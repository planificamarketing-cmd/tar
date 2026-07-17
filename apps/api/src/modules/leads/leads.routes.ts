import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth, requirePermission } from '../../middleware/require-auth';
import * as c from './leads.controller';

export const leadsRouter: Router = Router();

// Rate-limit estricto + honeypot (Zod) anti-spam en la captación pública (§6.7).
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: { code: 'rate_limited', message: 'Demasiadas solicitudes.' },
  },
});

// Público.
leadsRouter.post('/', leadLimiter, c.create);

// Prospectos: lectura (admin/editor/ventas/lector) vs escritura (admin/editor/ventas).
const canRead = [requireAuth, requirePermission('leads:read')] as const;
const canWrite = [requireAuth, requirePermission('leads:write')] as const;
leadsRouter.get('/', ...canRead, c.list);
leadsRouter.post('/bulk', ...canWrite, c.bulk);
leadsRouter.get('/:id', ...canRead, c.detail);
leadsRouter.patch('/:id', ...canWrite, c.update);
