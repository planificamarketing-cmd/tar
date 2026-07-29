import type { Request, Response } from 'express';
import {
  bulkLeadsSchema,
  createLeadSchema,
  leadQuerySchema,
  updateLeadSchema,
  uuidSchema,
} from '@tar/shared';
import * as svc from './leads.service';
import { toCsv, csvDate } from '../../lib/csv';

export async function create(req: Request, res: Response): Promise<void> {
  const input = createLeadSchema.parse(req.body);
  const data = await svc.createLead(input);
  res.status(201).json({ data });
}

export async function list(req: Request, res: Response): Promise<void> {
  const q = leadQuerySchema.parse(req.query);
  res.json(await svc.listLeads(q));
}

// GET /leads/export.csv — exporta los prospectos (respetando el filtro por etapa)
// con todas las columnas útiles para el CRM/seguimiento comercial.
export async function exportCsv(req: Request, res: Response): Promise<void> {
  const q = leadQuerySchema.parse(req.query);
  const rows = await svc.exportLeadsRows({
    status: q.status,
    propertyId: q.propertyId,
    assignedTo: q.assignedTo,
  });
  const header = [
    'Fecha',
    'Nombre',
    'Email',
    'Teléfono',
    'Tipo',
    'Etapa',
    'Origen',
    'Propiedad de interés',
    'URL propiedad',
    'Cita preferida',
    'UTM source',
    'UTM medium',
    'UTM campaign',
    'UTM content',
    'UTM term',
    'Asignado a',
    'Consentimiento',
    'Mensaje',
  ];
  const body = rows.map((r) => [
    csvDate(r.createdAt),
    r.name,
    r.email,
    r.phone,
    r.type,
    r.status,
    r.source,
    r.property,
    r.propertyUrl,
    csvDate(r.preferredAt),
    r.utmSource,
    r.utmMedium,
    r.utmCampaign,
    r.utmContent,
    r.utmTerm,
    r.assignedName,
    csvDate(r.consentAt),
    r.message,
  ]);
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="leads-tar-${stamp}.csv"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(toCsv([header, ...body]));
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

export async function bulk(req: Request, res: Response): Promise<void> {
  const input = bulkLeadsSchema.parse(req.body);
  const result = await svc.bulkUpdateLeads(input.ids, input.status, req.user!.sub);
  res.json({ data: result });
}
