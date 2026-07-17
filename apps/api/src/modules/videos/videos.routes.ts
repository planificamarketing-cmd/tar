import { Router } from 'express';
import multer from 'multer';
import { VIDEO_MAX_BYTES } from '@tar/shared';
import { requireAuth, requirePermission } from '../../middleware/require-auth';
import * as c from './videos.controller';

// Videos en memoria (se guardan tal cual en disco; sin transcodificación). Límite
// de tamaño desde @tar/shared. Se monta bajo /api/v1/properties.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: VIDEO_MAX_BYTES, files: 1 },
});

export const videosRouter: Router = Router();

const staff = [requireAuth, requirePermission('media:write')] as const;

videosRouter.get('/:id/videos', ...staff, c.list);
videosRouter.post('/:id/videos', ...staff, upload.single('video'), c.upload);
videosRouter.patch('/:id/videos/:videoId', ...staff, c.update);
videosRouter.delete('/:id/videos/:videoId', ...staff, c.remove);
