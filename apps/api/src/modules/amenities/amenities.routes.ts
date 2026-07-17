import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/require-auth';
import * as c from './amenities.controller';

// Catálogo de amenidades. Lectura pública; alta protegida (amenities:write) para poder
// ampliar el catálogo desde el editor de propiedades.
export const amenitiesRouter: Router = Router();

amenitiesRouter.get('/', c.list);
amenitiesRouter.post('/', requireAuth, requirePermission('amenities:write'), c.create);
