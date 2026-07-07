import { z } from 'zod';
import {
  apiKeyScopeSchema,
  commercialStatusSchema,
  leadStatusSchema,
  webhookEventSchema,
} from './enums';

// PRD §5.5 — webhooks salientes.
export const createWebhookSubscriptionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  targetUrl: z.string().url(),
  secret: z.string().min(8),
  events: z.array(webhookEventSchema).min(1),
  isActive: z.boolean().default(true),
});
export type CreateWebhookSubscriptionInput = z.infer<
  typeof createWebhookSubscriptionSchema
>;

export const updateWebhookSubscriptionSchema =
  createWebhookSubscriptionSchema.partial();
export type UpdateWebhookSubscriptionInput = z.infer<
  typeof updateWebhookSubscriptionSchema
>;

// Prueba ad-hoc de un webhook: envía un payload de ejemplo a una URL (con firma) sin
// guardar nada. Sirve para el botón "Enviar prueba" al crear/editar y en la lista.
export const testWebhookSchema = z.object({
  targetUrl: z.string().url(),
  secret: z.string().min(1),
  event: webhookEventSchema.default('property.published'),
});
export type TestWebhookInput = z.infer<typeof testWebhookSchema>;

// Dispara un evento de PRUEBA a todas las suscripciones activas de ese evento
// (botón "Probar webhooks" desde Propiedades). No toca datos reales.
export const testEventSchema = z.object({
  event: webhookEventSchema.default('property.published'),
});
export type TestEventInput = z.infer<typeof testEventSchema>;

// PRD §5.5 — API keys para webhooks entrantes.
export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(120),
  scopes: z.array(apiKeyScopeSchema).min(1),
});
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

// PRD §5.5 — POST /webhooks/inbound (X-API-Key): acciones de terceros.
export const inboundWebhookSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('lead.update_status'),
    leadId: z.string().uuid(),
    status: leadStatusSchema,
  }),
  z.object({
    action: z.literal('property.update_status'),
    propertyId: z.string().uuid(),
    status: commercialStatusSchema,
  }),
]);
export type InboundWebhookInput = z.infer<typeof inboundWebhookSchema>;
