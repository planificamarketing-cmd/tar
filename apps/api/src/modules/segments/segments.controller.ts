import type { Request, Response } from 'express';
import {
  createSegmentSchema,
  updateSegmentSchema,
  uuidSchema,
} from '@tar/shared';
import * as svc from './segments.service';

export async function list(_req: Request, res: Response): Promise<void> {
  const data = await svc.listSegments();
  // Añade el conteo de coincidencias por segmento (útil para la UI).
  const withCounts = await Promise.all(
    data.map(async (s) => ({
      ...s,
      matchCount: await svc.countSegmentMatches(s.filters as never),
    })),
  );
  res.json({ data: withCounts });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createSegmentSchema.parse(req.body);
  res.status(201).json({ data: await svc.createSegment(input) });
}

export async function detail(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  res.json({ data: await svc.getSegment(id) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const input = updateSegmentSchema.parse(req.body);
  res.json({ data: await svc.updateSegment(id, input) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  await svc.deleteSegment(id);
  res.status(204).end();
}

// Público: feed CSV de catálogo de Meta. El token (no adivinable) identifica el
// segmento; Meta jala esta URL. Sin auth por diseño (solo publicadas que casan).
export async function feed(req: Request, res: Response): Promise<void> {
  const token = String(req.params.token ?? '').replace(/\.csv$/i, '');
  const csv = await svc.generateFeedCsv(token);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600');
  res.send(csv);
}
