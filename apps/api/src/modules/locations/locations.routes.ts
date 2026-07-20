import { Router } from 'express';
import * as c from './locations.controller';

// Catálogo de ubicaciones existentes (estado/municipio/colonia) para los
// autocompletados. Público: lo consumen tanto el editor del backoffice como el
// buscador del sitio público (Fase B, §7.1). Solo devuelve nombres de lugares
// ya presentes en el inventario publicado — sin PII. La creación de ubicaciones
// nuevas ocurre al guardar una propiedad (resolveLocation, idempotente).
export const locationsRouter: Router = Router();

locationsRouter.get('/', c.list);
