import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/require-auth';
import * as c from './geo.controller';

// Utilidades de geolocalización para el backoffice. Protegido (admin/editor): hace
// peticiones salientes, no debe quedar abierto.
export const geoRouter: Router = Router();

geoRouter.post('/resolve-maps', requireAuth, requireRole('admin', 'editor'), c.resolveMaps);
