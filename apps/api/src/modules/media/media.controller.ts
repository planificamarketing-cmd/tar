import type { Request, Response } from 'express';
import { updateImageSchema, uuidSchema } from '@tar/shared';
import * as svc from './media.service';

export async function upload(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const data = await svc.uploadImages(
    id,
    files.map((f) => ({
      buffer: f.buffer,
      mimetype: f.mimetype,
      size: f.size,
    })),
  );
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const imgId = uuidSchema.parse(req.params.imgId);
  const patch = updateImageSchema.parse(req.body);
  res.json({ data: await svc.updateImage(id, imgId, patch) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const imgId = uuidSchema.parse(req.params.imgId);
  await svc.deleteImage(id, imgId);
  res.status(204).end();
}
