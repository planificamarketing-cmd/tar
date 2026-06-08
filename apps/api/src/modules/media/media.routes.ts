import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/require-auth';
import * as c from './media.controller';

// Imágenes en memoria (luego sharp las re-codifica). Límite 10 MB, hasta 20.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 20 },
});

// Se monta bajo /api/v1/properties (rutas anidadas de media, §5.3).
export const mediaRouter: Router = Router();

const staff = [requireAuth, requireRole('admin', 'editor')] as const;

mediaRouter.post('/:id/images', ...staff, upload.array('images', 20), c.upload);
mediaRouter.patch('/:id/images/:imgId', ...staff, c.update);
mediaRouter.delete('/:id/images/:imgId', ...staff, c.remove);
