import type { Request, Response } from 'express';
import { createAmenitySchema } from '@tar/shared';
import * as svc from './amenities.service';

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ data: await svc.listAmenities() });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createAmenitySchema.parse(req.body);
  const amenity = await svc.createAmenity(input);
  res.status(201).json({ data: amenity });
}
