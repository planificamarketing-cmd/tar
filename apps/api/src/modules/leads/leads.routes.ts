import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth, requireRole } from '../../middleware/require-auth';
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

// Admin/editor.
const staff = [requireAuth, requireRole('admin', 'editor')] as const;
leadsRouter.get('/', ...staff, c.list);
leadsRouter.post('/bulk', ...staff, c.bulk);
leadsRouter.get('/:id', ...staff, c.detail);
leadsRouter.patch('/:id', ...staff, c.update);
