import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import type { CreateLeadInput, LeadQuery, UpdateLeadInput } from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';
import { emitEvent } from '../../lib/events';
import { sendNewLeadNotification } from '../../lib/mailer';

const { leads, leadEvents, properties } = schema;

// POST /leads — creación pública. El consentimiento LFPDPPP ya viene validado
// por Zod (literal true) → se sella `consent_at`.
export async function createLead(input: CreateLeadInput) {
  let propertyTitle: string | null = null;
  if (input.propertyId) {
    const [p] = await db
      .select({ title: properties.title })
      .from(properties)
      .where(eq(properties.id, input.propertyId))
      .limit(1);
    propertyTitle = p?.title ?? null;
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

  await emitEvent('lead.created', {
    id: lead!.id,
    name: lead!.name,
    email: lead!.email,
    type: lead!.type,
    propertyId: lead!.propertyId,
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
