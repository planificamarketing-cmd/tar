import { logger } from './logger';
import { dispatchEvent } from './queue';

export type DomainEvent =
  | 'lead.created'
  | 'lead.status_changed'
  | 'property.published'
  | 'property.status_changed';

// Punto ÚNICO de emisión de eventos de dominio. Encola la entrega de webhooks
// vía pg-boss (firma HMAC + backoff). Si la cola no está iniciada (p.ej. tests),
// `dispatchEvent` es no-op y solo se registra el evento.
export async function emitEvent(
  event: DomainEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  logger.info({ event, payload }, `evento de dominio: ${event}`);
  await dispatchEvent(event, payload);
}
