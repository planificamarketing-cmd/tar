import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/require-auth';
import * as c from './geo.controller';

// Utilidades de geolocalización para el backoffice. Protegido (geo:write): hace
// peticiones salientes, no debe quedar abierto.
export const geoRouter: Router = Router();

geoRouter.post('/resolve-maps', requireAuth, requirePermission('geo:write'), c.resolveMaps);
