import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/require-auth';
import * as c from './properties.controller';

export const propertiesRouter: Router = Router();

// Lectura del catálogo admin: admin/editor/ventas/lector (todos tienen properties:read).
const canRead = [requireAuth, requirePermission('properties:read')] as const;
// Escritura del catálogo: admin/editor.
const canWrite = [requireAuth, requirePermission('properties:write')] as const;

// ── Backoffice ── antes de /:slug para que el comodín no capture "admin".
propertiesRouter.get('/admin', ...canRead, c.listAdmin);
propertiesRouter.get('/admin/status-counts', ...canRead, c.statusCounts);
propertiesRouter.get('/admin/type-counts', ...canRead, c.typeCounts);
propertiesRouter.get('/admin/export.csv', ...canRead, c.exportCsv);
propertiesRouter.get('/admin/:id', ...canRead, c.detailAdmin);
// Folleto PDF staff (por id, incluye borradores). Bajo /admin/ → no colisiona con
// la ruta pública /:slug/flyer.pdf.
propertiesRouter.get('/admin/:id/flyer.pdf', ...canRead, c.flyerPdf);

// Flyer compartible (imagen PNG). Lectura (cualquier staff). 2 segmentos → no
// colisiona con /:slug.
propertiesRouter.get('/:id/flyer', ...canRead, c.flyer);

// ── Públicas ──
// /map antes que /:slug para que no lo capture el comodín.
propertiesRouter.get('/', c.list);
propertiesRouter.get('/map', c.map);
// Folleto PDF público (por slug, solo publicadas). 2 segmentos → distinto de /:slug.
propertiesRouter.get('/:slug/flyer.pdf', c.flyerPdfPublic);
propertiesRouter.get('/:slug', c.detail);

// ── Protegidas (escritura del catálogo) ──
propertiesRouter.post('/', ...canWrite, c.create);
// /bulk antes de /:id/... (no colisiona, pero se agrupa con las acciones masivas).
propertiesRouter.post('/bulk', ...canWrite, c.bulk);
propertiesRouter.patch('/:id', ...canWrite, c.update);
propertiesRouter.post('/:id/publish', ...canWrite, c.publish);
propertiesRouter.post('/:id/unpublish', ...canWrite, c.unpublish);
propertiesRouter.post('/:id/duplicate', ...canWrite, c.duplicate);
propertiesRouter.post('/:id/restore', ...canWrite, c.restore);
propertiesRouter.patch('/:id/status', ...canWrite, c.status);

// Soft delete (archivar): capacidad de borrado (admin/editor).
propertiesRouter.delete(
  '/:id',
  requireAuth,
  requirePermission('properties:delete'),
  c.remove,
);
