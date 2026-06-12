import type { Request, Response } from 'express';
import * as svc from './amenities.service';

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ data: await svc.listAmenities() });
}
