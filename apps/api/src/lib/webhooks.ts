import { createHmac } from 'node:crypto';
import type { DomainEvent } from './events';

// Firma HMAC-SHA256 del cuerpo (header X-TAR-Signature), §5.5.
export function signPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

export interface DeliveryTarget {
  targetUrl: string;
  secret: string;
}

export interface DeliveryResult {
  ok: boolean;
  status: number;
  error?: string;
}

// Realiza un POST firmado al destino. Timeout de 10s. No lanza: devuelve el
// resultado para que el worker decida reintentar.
export async function deliverWebhook(
  target: DeliveryTarget,
  event: DomainEvent,
  payload: Record<string, unknown>,
  timestamp: string,
): Promise<DeliveryResult> {
  const body = JSON.stringify({ event, data: payload, timestamp });
  const signature = signPayload(target.secret, body);
  try {
    const res = await fetch(target.targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TAR-Event': event,
        'X-TAR-Signature': signature,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: String(err) };
  }
}

// Backoff exponencial: 5 intentos (30s, 2m, 10m, 1h, 6h) — §5.5.
export const MAX_ATTEMPTS = 5;
export const BACKOFF_SECONDS = [30, 120, 600, 3600, 21600];
