import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/require-auth';
import * as c from './users.controller';

// Gestión de operadores (§5.6) — SOLO administradores.
export const usersRouter: Router = Router();

const adminOnly = [requireAuth, requireRole('admin')] as const;

usersRouter.get('/', ...adminOnly, c.list);
usersRouter.post('/', ...adminOnly, c.create);
usersRouter.get('/:id', ...adminOnly, c.detail);
usersRouter.patch('/:id', ...adminOnly, c.update);
usersRouter.delete('/:id', ...adminOnly, c.remove);
