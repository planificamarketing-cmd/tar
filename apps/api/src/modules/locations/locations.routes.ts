import { Router } from 'express';
import * as c from './locations.controller';
import { requireAuth } from '../../middleware/require-auth';

// Catálogo de ubicaciones existentes para los autocompletados del backoffice.
// Requiere sesión (lo consume el editor de propiedades); la creación de nuevas
// ubicaciones ocurre al guardar una propiedad (resolveLocation, idempotente).
export const locationsRouter: Router = Router();

locationsRouter.get('/', requireAuth, c.list);
