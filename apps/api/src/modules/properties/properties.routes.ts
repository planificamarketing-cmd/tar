import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/require-auth';
import * as c from './properties.controller';

export const propertiesRouter: Router = Router();

const staff = [requireAuth, requireRole('admin', 'editor')] as const;

// ── Backoffice (admin/editor) ── antes de /:slug para que el comodín no
// capture "admin".
propertiesRouter.get('/admin', ...staff, c.listAdmin);
propertiesRouter.get('/admin/status-counts', ...staff, c.statusCounts);
propertiesRouter.get('/admin/:id', ...staff, c.detailAdmin);

// ── Públicas ──
// /map antes que /:slug para que no lo capture el comodín.
propertiesRouter.get('/', c.list);
propertiesRouter.get('/map', c.map);
propertiesRouter.get('/:slug', c.detail);

// ── Protegidas (admin/editor) ──
propertiesRouter.post('/', ...staff, c.create);
propertiesRouter.patch('/:id', ...staff, c.update);
propertiesRouter.post('/:id/publish', ...staff, c.publish);
propertiesRouter.patch('/:id/status', ...staff, c.status);

// Soft delete: solo admin.
propertiesRouter.delete('/:id', requireAuth, requireRole('admin'), c.remove);
