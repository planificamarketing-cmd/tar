import type { Request, Response } from 'express';
import { updateVideoSchema, uploadVideoSchema, uuidSchema } from '@tar/shared';
import * as svc from './videos.service';

export async function upload(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const { orientation } = uploadVideoSchema.parse(req.body ?? {});
  const file = req.file
    ? {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        size: req.file.size,
      }
    : undefined;
  const video = await svc.uploadVideo(id, file, orientation);
  res.status(201).json({ data: video });
}

export async function list(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  res.json({ data: await svc.listVideos(id) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const videoId = uuidSchema.parse(req.params.videoId);
  const input = updateVideoSchema.parse(req.body);
  res.json({ data: await svc.updateVideo(id, videoId, input) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const videoId = uuidSchema.parse(req.params.videoId);
  await svc.deleteVideo(id, videoId);
  res.status(204).end();
}
