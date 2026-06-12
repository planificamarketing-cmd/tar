import type { Request, Response } from 'express';
import {
  createScriptSchema,
  scriptQuerySchema,
  updateScriptSchema,
  uuidSchema,
} from '@tar/shared';
import * as svc from './scripts.service';

export async function list(req: Request, res: Response): Promise<void> {
  const q = scriptQuerySchema.parse(req.query);
  res.json({ data: await svc.listScripts(q) });
}

export async function detail(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  res.json({ data: await svc.getScript(id) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createScriptSchema.parse(req.body);
  res.status(201).json({ data: await svc.createScript(input) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const input = updateScriptSchema.parse(req.body);
  res.json({ data: await svc.updateScript(id, input) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  await svc.deleteScript(id);
  res.status(204).end();
}
