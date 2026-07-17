import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/require-auth';
import * as c from './segments.controller';

// CRUD de segmentos (configuración, admin: segments:manage).
export const segmentsRouter: Router = Router();
const admin = [requireAuth, requirePermission('segments:manage')] as const;

segmentsRouter.get('/', ...admin, c.list);
segmentsRouter.post('/', ...admin, c.create);
segmentsRouter.get('/:id', ...admin, c.detail);
segmentsRouter.patch('/:id', ...admin, c.update);
segmentsRouter.delete('/:id', ...admin, c.remove);

// Feed público del catálogo de Meta (sin auth; token no adivinable).
export const feedsRouter: Router = Router();
feedsRouter.get('/meta/:token', c.feed);
