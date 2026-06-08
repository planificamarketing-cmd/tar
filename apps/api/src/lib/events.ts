import { logger } from './logger';

export type DomainEvent =
  | 'lead.created'
  | 'lead.status_changed'
  | 'property.published'
  | 'property.status_changed';

// Punto ÚNICO de emisión de eventos de dominio.
// En la Fase A.4 esto encolará en pg-boss para la entrega de webhooks (firma
// HMAC-SHA256 + backoff). Por ahora registra el evento; la firma de la función
// no cambiará, así que los emisores no se tocan al cablear pg-boss.
export async function emitEvent(
  event: DomainEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  logger.info({ event, payload }, `evento de dominio: ${event}`);
  // TODO(A.4): await boss.send('webhook-deliveries', { event, payload });
}
