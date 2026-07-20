import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/require-auth';
import * as c from './scripts.controller';

// Gestor de scripts de marketing (§6.5) — capacidad scripts:manage (solo admin),
// más la lectura pública por placement que consume el sitio público (§7.1).
export const scriptsRouter: Router = Router();

const adminOnly = [requireAuth, requirePermission('scripts:manage')] as const;

// Público, antes de las rutas admin y de '/:id' (para que no lo capture el wildcard).
scriptsRouter.get('/public', c.publicList);

scriptsRouter.get('/', ...adminOnly, c.list);
scriptsRouter.post('/', ...adminOnly, c.create);
scriptsRouter.get('/:id', ...adminOnly, c.detail);
scriptsRouter.patch('/:id', ...adminOnly, c.update);
scriptsRouter.delete('/:id', ...adminOnly, c.remove);
