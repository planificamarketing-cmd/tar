import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import type { CreateLeadInput, LeadQuery, UpdateLeadInput } from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';
import { emitEvent } from '../../lib/events';
import { sendNewLeadNotification } from '../../lib/mailer';
import { getPropertyByIdAdmin } from '../properties/properties.service';
import { env } from '../../env';

const { leads, leadEvents, properties, users } = schema;

const num = (v: unknown) => (v == null ? null : Number(v));

// Etiquetas legibles para la exportación (mismo texto que el panel).
const LEAD_STATUS_ES: Record<string, string> = {
  nuevo: 'Nuevo',
  cita_agendada: 'Cita agendada',
  cita_concretada: 'Cita concretada',
  apartado: 'Apartado',
  firma: 'Firma de contrato',
  descartado: 'Descartado',
};
const LEAD_TYPE_ES: Record<string, string> = {
  contacto: 'Contacto',
  cita: 'Solicitud de cita',
};

// Snapshot compacto de la propiedad para el webhook `lead.created`: incluye los
// datos útiles (precio, m² —incl. útil/rentable de oficina y áreas exteriores—,
// remate, ubicación, enlace y portada) para que el consumidor (n8n, CRM…) reciba
// el contexto completo del formulario sin una 2ª llamada. Misma filosofía que
// `property.published`.
type PropertyDetailShape = Awaited<ReturnType<typeof getPropertyByIdAdmin>>;
function buildLeadPropertySnapshot(d: PropertyDetailShape): Record<string, unknown> {
  return {
    id: d.id,
    slug: d.slug,
    url: d.slug ? `${env.PUBLIC_SITE_URL}/propiedades/${d.slug}` : null,
    title: d.title,
    propertyType: d.propertyType,
    status: d.status,
    featured: d.featured,
    price: {
      sale: num(d.priceSale),
      saleCurrency: d.currencySale,
      rent: num(d.priceRent),
      rentCurrency: d.currencyRent,
    },
    bedrooms: d.bedrooms,
    bathrooms: d.bathrooms,
    halfBathrooms: d.halfBathrooms,
    parking: d.parking,
    areaM2: num(d.areaM2),
    lotM2: num(d.lotM2),
    usableAreaM2: num(d.usableAreaM2),
    rentableAreaM2: num(d.rentableAreaM2),
    patioM2: num(d.patioM2),
    terraceM2: num(d.terraceM2),
    balconyM2: num(d.balconyM2),
    gardenM2: num(d.gardenM2),
    isRemate: d.isRemate,
    location: d.location,
    cover: d.images.find((i) => i.isCover)?.urlWebp ?? d.images[0]?.urlWebp ?? null,
  };
}

// POST /leads — creación pública. El consentimiento LFPDPPP ya viene validado
// por Zod (literal true) → se sella `consent_at`.
export async function createLead(input: CreateLeadInput) {
  let propertyTitle: string | null = null;
  let property: Record<string, unknown> | null = null;
  if (input.propertyId) {
    try {
      const detail = await getPropertyByIdAdmin(input.propertyId);
      propertyTitle = detail.title;
      property = buildLeadPropertySnapshot(detail);
    } catch {
      // Propiedad no encontrada / borrada: el lead se registra igual, sin snapshot.
    }
  }

  const [lead] = await db
    .insert(leads)
    .values({
      propertyId: input.propertyId ?? null,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      message: input.message ?? null,
      type: input.type,
      preferredAt: input.preferredAt ?? null,
      source: input.source ?? null,
      utm: input.utm ?? null,
      consentAt: new Date(),
      status: 'nuevo',
    })
    .returning();

  // Payload enriquecido: lead completo + snapshot de la propiedad asociada.
  await emitEvent('lead.created', {
    id: lead!.id,
    name: lead!.name,
    email: lead!.email,
    phone: lead!.phone,
    message: lead!.message,
    type: lead!.type,
    preferredAt: lead!.preferredAt,
    source: lead!.source,
    utm: lead!.utm,
    status: lead!.status,
    consentAt: lead!.consentAt,
    createdAt: lead!.createdAt,
    propertyId: lead!.propertyId,
    property,
  });
  await sendNewLeadNotification({
    name: lead!.name,
    email: lead!.email,
    phone: lead!.phone,
    message: lead!.message,
    type: lead!.type,
    propertyTitle,
  });

  return { id: lead!.id, status: lead!.status };
}

export async function listLeads(q: LeadQuery) {
  const c = [isNull(leads.deletedAt)];
  if (q.status) c.push(eq(leads.status, q.status));
  if (q.propertyId) c.push(eq(leads.propertyId, q.propertyId));
  if (q.assignedTo) c.push(eq(leads.assignedTo, q.assignedTo));
  const where = and(...c);

  const rows = await db
    .select()
    .from(leads)
    .where(where)
    .orderBy(desc(leads.createdAt))
    .limit(q.limit)
    .offset((q.page - 1) * q.limit);
  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(where);

  return {
    data: rows,
    meta: { page: q.page, limit: q.limit, total: countRows[0]?.count ?? 0 },
  };
}

// Exportación CSV de prospectos: TODAS las columnas útiles (contacto, campaña/UTM,
// propiedad de interés, etapa, consentimiento), respetando el filtro por etapa. Sin
// paginar (tope de seguridad) y ordenado por fecha. Devuelve las filas ya aplanadas.
export async function exportLeadsRows(q: {
  status?: string;
  propertyId?: string;
  assignedTo?: string;
}) {
  const c = [isNull(leads.deletedAt)];
  if (q.status) c.push(eq(leads.status, q.status as never));
  if (q.propertyId) c.push(eq(leads.propertyId, q.propertyId));
  if (q.assignedTo) c.push(eq(leads.assignedTo, q.assignedTo));

  const rows = await db
    .select({
      lead: leads,
      propertyTitle: properties.title,
      propertySlug: properties.slug,
      assignedName: users.name,
    })
    .from(leads)
    .leftJoin(properties, eq(leads.propertyId, properties.id))
    .leftJoin(users, eq(leads.assignedTo, users.id))
    .where(and(...c))
    .orderBy(desc(leads.createdAt))
    .limit(20000);

  return rows.map(({ lead, propertyTitle, propertySlug, assignedName }) => {
    const utm = (lead.utm ?? {}) as Record<string, string>;
    return {
      createdAt: lead.createdAt,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      type: LEAD_TYPE_ES[lead.type] ?? lead.type,
      status: LEAD_STATUS_ES[lead.status] ?? lead.status,
      source: lead.source,
      property: propertyTitle,
      propertyUrl: propertySlug ? `${env.PUBLIC_SITE_URL}/propiedades/${propertySlug}` : '',
      preferredAt: lead.preferredAt,
      utmSource: utm.utm_source ?? '',
      utmMedium: utm.utm_medium ?? '',
      utmCampaign: utm.utm_campaign ?? '',
      utmContent: utm.utm_content ?? '',
      utmTerm: utm.utm_term ?? '',
      assignedName,
      consentAt: lead.consentAt,
      message: lead.message,
    };
  });
}

export async function getLead(id: string) {
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
    .limit(1);
  if (!lead) throw new ApiError(404, 'not_found', 'Lead no encontrado.');
  const events = await db
    .select()
    .from(leadEvents)
    .where(eq(leadEvents.leadId, id))
    .orderBy(desc(leadEvents.createdAt));
  return { ...lead, events };
}

// PATCH /leads/:id — cambia status/asignación, registra lead_event y emite evento.
// `userId` null cuando el cambio viene de un webhook entrante.
export async function updateLead(
  id: string,
  input: UpdateLeadInput,
  userId: string | null,
) {
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
    .limit(1);
  if (!lead) throw new ApiError(404, 'not_found', 'Lead no encontrado.');

  const set: Record<string, unknown> = { updatedAt: new Date() };
  const payload: Record<string, unknown> = {};
  let statusChanged: { from: string; to: string } | null = null;

  if (input.status !== undefined && input.status !== lead.status) {
    set.status = input.status;
    statusChanged = { from: lead.status, to: input.status };
    payload.status = statusChanged;
  }
  if (input.assignedTo !== undefined) {
    set.assignedTo = input.assignedTo;
    payload.assignedTo = input.assignedTo;
  }

  await db.update(leads).set(set).where(eq(leads.id, id));
  await db.insert(leadEvents).values({
    leadId: id,
    type: statusChanged ? 'status_changed' : 'assigned',
    payload,
    userId,
  });

  if (statusChanged) {
    await emitEvent('lead.status_changed', {
      id,
      from: statusChanged.from,
      to: statusChanged.to,
    });
  }
  return getLead(id);
}

// POST /leads/bulk — cambia la etapa de varios leads. Reusa updateLead por id
// (registra bitácora + emite evento por cada uno). Reporta ok/errores.
export async function bulkUpdateLeads(
  ids: string[],
  status: UpdateLeadInput['status'],
  userId: string | null,
): Promise<{ ok: number; failed: { id: string; error: string }[] }> {
  const failed: { id: string; error: string }[] = [];
  let ok = 0;
  for (const id of ids) {
    try {
      await updateLead(id, { status }, userId);
      ok += 1;
    } catch (err) {
      failed.push({ id, error: err instanceof ApiError ? err.message : 'Error' });
    }
  }
  return { ok, failed };
}
