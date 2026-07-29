import type { Request, Response } from 'express';
import {
  createPropertySchema,
  propertyAdminQuerySchema,
  propertyBulkSchema,
  propertyMapQuerySchema,
  propertyQuerySchema,
  updatePropertySchema,
  updateStatusSchema,
  uuidSchema,
} from '@tar/shared';
import * as svc from './properties.service';
import { generateFlyer } from './flyer.service';
import { generateFlyerPdf } from './flyer-pdf.service';

export async function list(req: Request, res: Response): Promise<void> {
  const q = propertyQuerySchema.parse(req.query);
  res.json(await svc.listProperties(q));
}

// Listado del backoffice (todos los estatus).
export async function listAdmin(req: Request, res: Response): Promise<void> {
  const q = propertyAdminQuerySchema.parse(req.query);
  res.json(await svc.listPropertiesAdmin(q));
}

// Conteo por estatus para KPIs del dashboard.
export async function statusCounts(_req: Request, res: Response): Promise<void> {
  res.json({ data: await svc.propertyStatusCounts() });
}

// Conteo por tipo (mix de inventario del dashboard, todo el inventario).
export async function typeCounts(_req: Request, res: Response): Promise<void> {
  res.json({ data: await svc.propertyTypeCounts() });
}

// Detalle admin por id (ve borradores).
export async function detailAdmin(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  res.json({ data: await svc.getPropertyByIdAdmin(id) });
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

export async function unpublish(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  res.json({ data: await svc.unpublishProperty(id) });
}

export async function restore(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  res.json({ data: await svc.restoreProperty(id) });
}

export async function duplicate(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  res.status(201).json({ data: await svc.duplicateProperty(id, req.user!.sub) });
}

export async function bulk(req: Request, res: Response): Promise<void> {
  const input = propertyBulkSchema.parse(req.body);
  const result = await svc.bulkProperties(input.ids, input.action, input.status);
  res.json({ data: result });
}

// Flyer compartible (imagen PNG) de una propiedad. Lectura (staff).
export async function flyer(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const png = await generateFlyer(id);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `inline; filename="flyer-${id}.png"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(png);
}

// Folleto PDF (staff, por id): incluye borradores para previsualizar antes de publicar.
export async function flyerPdf(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const pdf = await generateFlyerPdf(id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="ficha-${id}.pdf"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(pdf);
}

// Folleto PDF público (por slug): solo propiedades publicadas (getPropertyBySlug
// aplica el filtro de estatus públicos y lanza 404 en borradores).
export async function flyerPdfPublic(req: Request, res: Response): Promise<void> {
  const prop = await svc.getPropertyBySlug(String(req.params.slug));
  const pdf = await generateFlyerPdf(prop.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="ficha-${prop.slug ?? prop.id}.pdf"`,
  );
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(pdf);
}
