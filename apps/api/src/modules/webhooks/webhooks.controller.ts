import type { Request, Response } from 'express';
import {
  createApiKeySchema,
  createWebhookSubscriptionSchema,
  inboundWebhookSchema,
  updateWebhookSubscriptionSchema,
  uuidSchema,
} from '@tar/shared';
import * as svc from './webhooks.service';

// Suscripciones
export async function listSubscriptions(_req: Request, res: Response) {
  res.json({ data: await svc.listSubscriptions() });
}
export async function createSubscription(req: Request, res: Response) {
  const input = createWebhookSubscriptionSchema.parse(req.body);
  res.status(201).json({ data: await svc.createSubscription(input) });
}
export async function updateSubscription(req: Request, res: Response) {
  const id = uuidSchema.parse(req.params.id);
  const input = updateWebhookSubscriptionSchema.parse(req.body);
  res.json({ data: await svc.updateSubscription(id, input) });
}
export async function deleteSubscription(req: Request, res: Response) {
  const id = uuidSchema.parse(req.params.id);
  await svc.deleteSubscription(id);
  res.status(204).end();
}

// Entregas
export async function listDeliveries(_req: Request, res: Response) {
  res.json({ data: await svc.listDeliveries() });
}
export async function retryDelivery(req: Request, res: Response) {
  const id = uuidSchema.parse(req.params.id);
  await svc.retryDelivery(id);
  res.status(202).json({ data: { id, status: 'reencolado' } });
}

// Llaves de API
export async function listApiKeys(_req: Request, res: Response) {
  res.json({ data: await svc.listApiKeys() });
}
export async function createApiKey(req: Request, res: Response) {
  const input = createApiKeySchema.parse(req.body);
  // `key` solo se muestra aquí, una vez.
  res.status(201).json({ data: await svc.createApiKey(input) });
}
export async function deleteApiKey(req: Request, res: Response) {
  const id = uuidSchema.parse(req.params.id);
  await svc.deleteApiKey(id);
  res.status(204).end();
}

// Entrante (autenticación por X-API-Key dentro del service)
export async function inbound(req: Request, res: Response) {
  const body = inboundWebhookSchema.parse(req.body);
  const apiKey = req.header('X-API-Key') ?? undefined;
  res.json({ data: await svc.handleInbound(apiKey, body) });
}
