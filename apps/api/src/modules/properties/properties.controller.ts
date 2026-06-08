import type { Request, Response } from 'express';
import {
  createPropertySchema,
  propertyMapQuerySchema,
  propertyQuerySchema,
  updatePropertySchema,
  updateStatusSchema,
  uuidSchema,
} from '@tar/shared';
import * as svc from './properties.service';

export async function list(req: Request, res: Response): Promise<void> {
  const q = propertyQuerySchema.parse(req.query);
  res.json(await svc.listProperties(q));
}

export async function map(req: Request, res: Response): Promise<void> {
  const q = propertyMapQuerySchema.parse(req.query);
  res.json({ data: await svc.mapProperties(q) });
}

export async function detail(req: Request, res: Response): Promise<void> {
  res.json({ data: await svc.getPropertyBySlug(req.params.slug as string) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createPropertySchema.parse(req.body);
  const data = await svc.createProperty(input, req.user!.sub);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const input = updatePropertySchema.parse(req.body);
  res.json({ data: await svc.updateProperty(id, input) });
}

export async function publish(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  res.json({ data: await svc.publishProperty(id) });
}

export async function status(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const body = updateStatusSchema.parse(req.body);
  res.json({ data: await svc.updateStatus(id, body.status) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  await svc.softDeleteProperty(id);
  res.status(204).end();
}
