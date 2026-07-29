import { createHash, randomBytes } from 'node:crypto';
import { and, desc, eq, arrayContains } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import type {
  CreateApiKeyInput,
  CreateWebhookSubscriptionInput,
  InboundWebhookInput,
  UpdateWebhookSubscriptionInput,
  WebhookEvent,
} from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';
import { enqueueRetry } from '../../lib/queue';
import { deliverWebhook } from '../../lib/webhooks';
import { updateLead } from '../leads/leads.service';
import { updateStatus as updatePropertyStatus } from '../properties/properties.service';

const { webhookSubscriptions, webhookDeliveries, apiKeys } = schema;

// Payload de ejemplo por evento, para las pruebas de webhook (marcado test:true).
function samplePayload(event: WebhookEvent): Record<string, unknown> {
  const id = '00000000-0000-0000-0000-000000000000';
  switch (event) {
    case 'property.published':
      return {
        id,
        slug: 'propiedad-de-ejemplo',
        url: 'https://tu-sitio.com/propiedades/propiedad-de-ejemplo',
        title: 'Casa de ejemplo en Polanco',
        description: 'Descripción de la propiedad…',
        propertyType: 'casa',
        status: 'disponible',
        featured: 'normal',
        price: { sale: 8500000, saleCurrency: 'MXN', rent: null, rentCurrency: null },
        bedrooms: 3,
        bathrooms: 2,
        halfBathrooms: 1,
        parking: 2,
        areaM2: 220,
        lotM2: 300,
        address: 'Calle Ejemplo 123',
        postalCode: '11560',
        location: { estado: 'Ciudad de México', municipio: 'Miguel Hidalgo', colonia: 'Polanco' },
        lat: 19.4326,
        lng: -99.1932,
        cover: 'https://tu-sitio.com/media/ejemplo/portada.webp',
        images: [
          'https://tu-sitio.com/media/ejemplo/1.webp',
          'https://tu-sitio.com/media/ejemplo/2.webp',
        ],
        amenities: ['Alberca', 'Seguridad 24h'],
      };
    case 'property.status_changed':
      return { id, from: 'disponible', to: 'apartado' };
    case 'lead.created':
      return {
        id,
        name: 'Lead de prueba',
        email: 'prospecto@ejemplo.com',
        phone: '+52 55 1234 5678',
        message: 'Me interesa esta propiedad, ¿podemos agendar una visita?',
        type: 'contacto',
        preferredAt: null,
        source: 'sitio_web',
        // UTMs de marketing: así viajan tal cual llegan del formulario público.
        utm: {
          utm_source: 'facebook',
          utm_medium: 'cpc',
          utm_campaign: 'remates-2026',
          utm_content: 'anuncio-carrusel',
          utm_term: 'departamento-polanco',
        },
        status: 'nuevo',
        consentAt: '2026-01-01T12:00:00.000Z',
        createdAt: '2026-01-01T12:00:00.000Z',
        propertyId: id,
        property: {
          id,
          slug: 'propiedad-de-ejemplo',
          url: 'https://tu-sitio.com/propiedades/propiedad-de-ejemplo',
          title: 'Casa de ejemplo en Polanco',
          propertyType: 'casa',
          status: 'disponible',
          price: { sale: 8500000, saleCurrency: 'MXN', rent: null, rentCurrency: null },
          cover: 'https://tu-sitio.com/media/ejemplo/portada.webp',
        },
      };
    case 'lead.status_changed':
      return { id, from: 'nuevo', to: 'cita_agendada' };
    default:
      return { id };
  }
}

// Prueba ad-hoc: envía un payload de ejemplo a una URL (con firma) sin guardar nada
// ni tocar la bitácora. Devuelve el resultado para mostrarlo en el panel.
export async function testWebhook(
  targetUrl: string,
  secret: string,
  event: WebhookEvent,
) {
  const result = await deliverWebhook(
    { targetUrl, secret },
    event,
    { ...samplePayload(event), test: true },
    new Date().toISOString(),
  );
  return { ok: result.ok, status: result.status, error: result.error ?? null };
}

// Dispara un evento de PRUEBA a todas las suscripciones activas de ese evento.
// Envío directo (no crea registros de entrega): feedback inmediato por suscripción.
export async function testEvent(event: WebhookEvent) {
  const subs = await db
    .select()
    .from(webhookSubscriptions)
    .where(
      and(
        eq(webhookSubscriptions.isActive, true),
        arrayContains(webhookSubscriptions.events, [event]),
      ),
    );
  const results = await Promise.all(
    subs.map(async (s) => {
      const r = await deliverWebhook(
        { targetUrl: s.targetUrl, secret: s.secret },
        event,
        { ...samplePayload(event), test: true },
        new Date().toISOString(),
      );
      return {
        id: s.id,
        name: s.name,
        targetUrl: s.targetUrl,
        ok: r.ok,
        status: r.status,
        error: r.error ?? null,
      };
    }),
  );
  return { event, count: results.length, results };
}

// ── Suscripciones (salientes) ──
export function listSubscriptions() {
  return db
    .select()
    .from(webhookSubscriptions)
    .orderBy(desc(webhookSubscriptions.createdAt));
}

export async function createSubscription(
  input: CreateWebhookSubscriptionInput,
) {
  const [row] = await db
    .insert(webhookSubscriptions)
    .values({
      name: input.name,
      targetUrl: input.targetUrl,
      secret: input.secret,
      events: input.events,
      isActive: input.isActive,
    })
    .returning();
  return row;
}

export async function updateSubscription(
  id: string,
  input: UpdateWebhookSubscriptionInput,
) {
  const [row] = await db
    .update(webhookSubscriptions)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(webhookSubscriptions.id, id))
    .returning();
  if (!row) throw new ApiError(404, 'not_found', 'Suscripción no encontrada.');
  return row;
}

export async function deleteSubscription(id: string) {
  const deleted = await db
    .delete(webhookSubscriptions)
    .where(eq(webhookSubscriptions.id, id))
    .returning({ id: webhookSubscriptions.id });
  if (!deleted.length)
    throw new ApiError(404, 'not_found', 'Suscripción no encontrada.');
}

// ── Bitácora de entregas ──
export function listDeliveries() {
  return db
    .select()
    .from(webhookDeliveries)
    .orderBy(desc(webhookDeliveries.createdAt))
    .limit(100);
}

export async function retryDelivery(id: string) {
  const [d] = await db
    .select({ id: webhookDeliveries.id })
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, id))
    .limit(1);
  if (!d) throw new ApiError(404, 'not_found', 'Entrega no encontrada.');
  const ok = await enqueueRetry(id);
  if (!ok)
    throw new ApiError(
      503,
      'queue_unavailable',
      'La cola de entregas no está activa.',
    );
}

// ── Llaves de API (entrantes) ──
const hashKey = (raw: string) =>
  createHash('sha256').update(raw).digest('hex');

export function listApiKeys() {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      scopes: apiKeys.scopes,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .orderBy(desc(apiKeys.createdAt));
}

export async function createApiKey(input: CreateApiKeyInput) {
  // La llave en claro solo se devuelve aquí, una vez.
  const raw = `tar_${randomBytes(24).toString('hex')}`;
  const [row] = await db
    .insert(apiKeys)
    .values({ name: input.name, keyHash: hashKey(raw), scopes: input.scopes })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      scopes: apiKeys.scopes,
    });
  return { ...row, key: raw };
}

export async function deleteApiKey(id: string) {
  const deleted = await db
    .delete(apiKeys)
    .where(eq(apiKeys.id, id))
    .returning({ id: apiKeys.id });
  if (!deleted.length)
    throw new ApiError(404, 'not_found', 'Llave no encontrada.');
}

// ── Webhook entrante (§5.5) ──
export async function handleInbound(
  rawKey: string | undefined,
  body: InboundWebhookInput,
) {
  if (!rawKey)
    throw new ApiError(401, 'missing_api_key', 'Falta el header X-API-Key.');

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, hashKey(rawKey)), eq(apiKeys.isActive, true)))
    .limit(1);
  if (!key) throw new ApiError(401, 'invalid_api_key', 'API key inválida.');

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id));

  const needed =
    body.action === 'lead.update_status' ? 'leads:write' : 'properties:write';
  if (!key.scopes.includes(needed))
    throw new ApiError(
      403,
      'insufficient_scope',
      `La llave no tiene el scope requerido (${needed}).`,
    );

  if (body.action === 'lead.update_status') {
    await updateLead(body.leadId, { status: body.status }, null);
  } else {
    await updatePropertyStatus(body.propertyId, body.status);
  }
  return { ok: true, action: body.action };
}
