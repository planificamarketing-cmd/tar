import { Router } from 'express';
import * as c from './amenities.controller';

// Catálogo público (lectura). La creación de amenidades ocurre vía importador
// o al guardar una propiedad; no se expone CRUD en esta fase.
export const amenitiesRouter: Router = Router();

amenitiesRouter.get('/', c.list);
