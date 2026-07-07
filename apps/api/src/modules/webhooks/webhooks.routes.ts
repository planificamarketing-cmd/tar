import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth, requireRole } from '../../middleware/require-auth';
import * as c from './webhooks.controller';

export const webhooksRouter: Router = Router();

const admin = [requireAuth, requireRole('admin')] as const;

// Suscripciones salientes.
webhooksRouter.get('/subscriptions', ...admin, c.listSubscriptions);
webhooksRouter.post('/subscriptions', ...admin, c.createSubscription);
webhooksRouter.patch('/subscriptions/:id', ...admin, c.updateSubscription);
webhooksRouter.delete('/subscriptions/:id', ...admin, c.deleteSubscription);

// Pruebas: envío ad-hoc a una URL, y disparo de un evento de prueba a los activos.
webhooksRouter.post('/test', ...admin, c.testSubscription);
webhooksRouter.post('/test-event', ...admin, c.testEvent);

// Bitácora de entregas + reintento manual.
webhooksRouter.get('/deliveries', ...admin, c.listDeliveries);
webhooksRouter.post('/deliveries/:id/retry', ...admin, c.retryDelivery);

// Llaves de API (la llave en claro solo se muestra al crear).
webhooksRouter.get('/api-keys', ...admin, c.listApiKeys);
webhooksRouter.post('/api-keys', ...admin, c.createApiKey);
webhooksRouter.delete('/api-keys/:id', ...admin, c.deleteApiKey);

// Webhook entrante (auth por X-API-Key) — rate-limit propio.
const inboundLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
webhooksRouter.post('/inbound', inboundLimiter, c.inbound);
