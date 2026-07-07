import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/require-auth';
import * as c from './properties.controller';

export const propertiesRouter: Router = Router();

const staff = [requireAuth, requireRole('admin', 'editor')] as const;

// ── Backoffice (admin/editor) ── antes de /:slug para que el comodín no
// capture "admin".
propertiesRouter.get('/admin', ...staff, c.listAdmin);
propertiesRouter.get('/admin/status-counts', ...staff, c.statusCounts);
propertiesRouter.get('/admin/type-counts', ...staff, c.typeCounts);
propertiesRouter.get('/admin/:id', ...staff, c.detailAdmin);

// ── Públicas ──
// /map antes que /:slug para que no lo capture el comodín.
propertiesRouter.get('/', c.list);
propertiesRouter.get('/map', c.map);
propertiesRouter.get('/:slug', c.detail);

// ── Protegidas (admin/editor) ──
propertiesRouter.post('/', ...staff, c.create);
// /bulk antes de /:id/... (no colisiona, pero se agrupa con las acciones masivas).
propertiesRouter.post('/bulk', ...staff, c.bulk);
propertiesRouter.patch('/:id', ...staff, c.update);
propertiesRouter.post('/:id/publish', ...staff, c.publish);
propertiesRouter.post('/:id/unpublish', ...staff, c.unpublish);
propertiesRouter.post('/:id/duplicate', ...staff, c.duplicate);
propertiesRouter.post('/:id/restore', ...staff, c.restore);
propertiesRouter.patch('/:id/status', ...staff, c.status);

// Soft delete (archivar): solo admin.
propertiesRouter.delete('/:id', requireAuth, requireRole('admin'), c.remove);
