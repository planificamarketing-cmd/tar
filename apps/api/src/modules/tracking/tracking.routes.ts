import { Router } from 'express';
import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { trackEventSchema } from '@tar/shared';
import { db, schema } from '@tar/db';
import { logger } from '../../lib/logger';

// POST /events/track — analítica básica (§5.4/§6.6). Registra vistas de ficha.
export const trackingRouter: Router = Router();

const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

trackingRouter.post(
  '/track',
  trackLimiter,
  async (req: Request, res: Response) => {
    const input = trackEventSchema.parse(req.body);
    try {
      await db.insert(schema.propertyEvents).values({
        propertyId: input.propertyId,
        type: 'view',
        meta: input.meta ?? null,
      });
    } catch (err) {
      // Best-effort: el tracking nunca rompe la navegación del usuario.
      logger.warn({ err }, 'tracking de vista falló (se ignora)');
    }
    res.status(204).end();
  },
);
