import type { Request, Response } from 'express';
import {
  createLeadSchema,
  leadQuerySchema,
  updateLeadSchema,
  uuidSchema,
} from '@tar/shared';
import * as svc from './leads.service';

export async function create(req: Request, res: Response): Promise<void> {
  const input = createLeadSchema.parse(req.body);
  const data = await svc.createLead(input);
  res.status(201).json({ data });
}

export async function list(req: Request, res: Response): Promise<void> {
  const q = leadQuerySchema.parse(req.query);
  res.json(await svc.listLeads(q));
}

export async function detail(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  res.json({ data: await svc.getLead(id) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const input = updateLeadSchema.parse(req.body);
  res.json({ data: await svc.updateLead(id, input, req.user!.sub) });
}
