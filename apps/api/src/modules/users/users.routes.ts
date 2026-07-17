import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/require-auth';
import * as c from './users.controller';

// Gestión de operadores (§5.6) — capacidad users:manage (solo admin).
export const usersRouter: Router = Router();

const adminOnly = [requireAuth, requirePermission('users:manage')] as const;

usersRouter.get('/', ...adminOnly, c.list);
usersRouter.post('/', ...adminOnly, c.create);
usersRouter.get('/:id', ...adminOnly, c.detail);
usersRouter.patch('/:id', ...adminOnly, c.update);
usersRouter.delete('/:id', ...adminOnly, c.remove);
