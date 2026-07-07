import type { Request, Response } from 'express';
import { expandMapsSchema } from '@tar/shared';
import * as svc from './geo.service';

// Resuelve un enlace de Google Maps → ubicación (coords + estado/municipio/colonia/
// dirección/CP en lo que el enlace permita). Para el autocompletado del editor.
export async function resolveMaps(req: Request, res: Response): Promise<void> {
  const { url } = expandMapsSchema.parse(req.body);
  const location = await svc.resolveMapsUrl(url);
  res.json({ data: location });
}
