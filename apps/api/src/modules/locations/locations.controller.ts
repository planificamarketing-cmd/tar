import type { Request, Response } from 'express';
import * as svc from './locations.service';

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ data: await svc.listLocations() });
}
