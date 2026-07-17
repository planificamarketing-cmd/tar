import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/require-auth';
import * as c from './scripts.controller';

// Gestor de scripts de marketing (§6.5) — capacidad scripts:manage (solo admin).
// La inyección pública por placement llega en la Fase B (§7.1).
export const scriptsRouter: Router = Router();

const adminOnly = [requireAuth, requirePermission('scripts:manage')] as const;

scriptsRouter.get('/', ...adminOnly, c.list);
scriptsRouter.post('/', ...adminOnly, c.create);
scriptsRouter.get('/:id', ...adminOnly, c.detail);
scriptsRouter.patch('/:id', ...adminOnly, c.update);
scriptsRouter.delete('/:id', ...adminOnly, c.remove);
