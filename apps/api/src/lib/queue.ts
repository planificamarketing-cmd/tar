import PgBoss from 'pg-boss';
import { and, arrayContains, eq } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import { env } from '../env';
import { logger } from './logger';
import {
  BACKOFF_SECONDS,
  MAX_ATTEMPTS,
  deliverWebhook,
} from './webhooks';
import type { DomainEvent } from './events';

const QUEUE = 'webhook-deliver';
const { webhookSubscriptions, webhookDeliveries } = schema;

let boss: PgBoss | null = null;
export function getBoss(): PgBoss | null {
  return boss;
}

export async function startQueue(): Promise<void> {
  const instance = new PgBoss({ connectionString: env.DATABASE_URL });
  instance.on('error', (err) => logger.error({ err }, 'pg-boss error'));
  await instance.start();
  await instance.createQueue(QUEUE);
  await instance.work<{ deliveryId: string }>(QUEUE, async (jobs) => {
    for (const job of jobs) await handleDelivery(instance, job.data.deliveryId);
  });
  boss = instance;
  logger.info('pg-boss iniciado (entrega de webhooks)');
}

export async function stopQueue(): Promise<void> {
  if (boss) {
    await boss.stop();
    boss = null;
  }
}

// Fan-out: por cada suscripción activa al evento, crea un registro de entrega y
// encola un job. No-op si la cola no está iniciada.
export async function dispatchEvent(
  event: DomainEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!boss) return;
  const subs = await db
    .select()
    .from(webhookSubscriptions)
    .where(
      and(
        eq(webhookSubscriptions.isActive, true),
        arrayContains(webhookSubscriptions.events, [event]),
      ),
    );
  for (const sub of subs) {
    const [delivery] = await db
      .insert(webhookDeliveries)
      .values({ subscriptionId: sub.id, event, payload, status: 'pendiente' })
      .returning({ id: webhookDeliveries.id });
    await boss.send(QUEUE, { deliveryId: delivery!.id });
  }
}

// Reintento manual desde el admin (§5.5).
export async function enqueueRetry(deliveryId: string): Promise<boolean> {
  if (!boss) return false;
  await db
    .update(webhookDeliveries)
    .set({ status: 'pendiente' })
    .where(eq(webhookDeliveries.id, deliveryId));
  await boss.send(QUEUE, { deliveryId });
  return true;
}

async function handleDelivery(
  instance: PgBoss,
  deliveryId: string,
): Promise<void> {
  const [delivery] = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, deliveryId))
    .limit(1);
  if (!delivery || delivery.status === 'entregado') return;

  const [sub] = await db
    .select()
    .from(webhookSubscriptions)
    .where(eq(webhookSubscriptions.id, delivery.subscriptionId))
    .limit(1);
  if (!sub) return;

  const attempts = delivery.attempts + 1;
  const result = await deliverWebhook(
    { targetUrl: sub.targetUrl, secret: sub.secret },
    delivery.event as DomainEvent,
    (delivery.payload ?? {}) as Record<string, unknown>,
    new Date().toISOString(),
  );

  if (result.ok) {
    await db
      .update(webhookDeliveries)
      .set({
        status: 'entregado',
        attempts,
        responseCode: result.status,
        deliveredAt: new Date(),
        lastError: null,
      })
      .where(eq(webhookDeliveries.id, deliveryId));
    return;
  }

  if (attempts < MAX_ATTEMPTS) {
    await db
      .update(webhookDeliveries)
      .set({
        status: 'pendiente',
        attempts,
        responseCode: result.status || null,
        lastError: result.error ?? `HTTP ${result.status}`,
      })
      .where(eq(webhookDeliveries.id, deliveryId));
    await instance.send(
      QUEUE,
      { deliveryId },
      { startAfter: BACKOFF_SECONDS[attempts - 1] },
    );
  } else {
    await db
      .update(webhookDeliveries)
      .set({
        status: 'fallido',
        attempts,
        responseCode: result.status || null,
        lastError: result.error ?? `HTTP ${result.status}`,
      })
      .where(eq(webhookDeliveries.id, deliveryId));
  }
}
