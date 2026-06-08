import { createHash, randomBytes } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import type {
  CreateApiKeyInput,
  CreateWebhookSubscriptionInput,
  InboundWebhookInput,
  UpdateWebhookSubscriptionInput,
} from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';
import { enqueueRetry } from '../../lib/queue';
import { updateLead } from '../leads/leads.service';
import { updateStatus as updatePropertyStatus } from '../properties/properties.service';

const { webhookSubscriptions, webhookDeliveries, apiKeys } = schema;

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
