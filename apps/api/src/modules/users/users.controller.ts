import type { Request, Response } from 'express';
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  uuidSchema,
} from '@tar/shared';
import * as svc from './users.service';

export async function list(req: Request, res: Response): Promise<void> {
  const q = userQuerySchema.parse(req.query);
  res.json(await svc.listUsers(q));
}

export async function detail(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  res.json({ data: await svc.getUser(id) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createUserSchema.parse(req.body);
  res.status(201).json({ data: await svc.createUser(input) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const input = updateUserSchema.parse(req.body);
  res.json({ data: await svc.updateUser(id, input, req.user!.sub) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  await svc.deactivateUser(id, req.user!.sub);
  res.status(204).end();
}
