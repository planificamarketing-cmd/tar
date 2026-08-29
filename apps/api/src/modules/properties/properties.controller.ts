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
import { toCsv, csvDate } from '../../lib/csv';
import { env } from '../../env';

export async function list(req: Request, res: Response): Promise<void> {
  const q = propertyQuerySchema.parse(req.query);
  res.json(await svc.listProperties(q));
}

// Listado del backoffice (todos los estatus).
export async function listAdmin(req: Request, res: Response): Promise<void> {
  const q = propertyAdminQuerySchema.parse(req.query);
  res.json(await svc.listPropertiesAdmin(q));
}

const TYPE_ES: Record<string, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  oficina: 'Oficina',
  local_comercial: 'Local comercial',
  bodega_industrial: 'Bodega industrial',
  terreno_industrial: 'Terreno industrial',
  edificio: 'Edificio',
  terreno: 'Terreno',
};
const STATUS_ES: Record<string, string> = {
  borrador: 'Borrador',
  disponible: 'Disponible',
  apartado: 'Apartado',
  rentado: 'Rentado',
  vendido: 'Vendido',
  pausado: 'Pausado',
};
const FEATURED_ES: Record<string, string> = {
  normal: 'Normal',
  destacada: 'Destacada',
  premium: 'Premium',
};

// GET /properties/admin/export.csv — exporta el inventario (respeta los filtros del
// listado admin) con todas las columnas útiles para análisis y respaldo.
export async function exportCsv(req: Request, res: Response): Promise<void> {
  const q = propertyAdminQuerySchema.parse(req.query);
  const rows = (await svc.exportPropertiesRows(q)) as Array<Record<string, unknown>>;
  const n = (v: unknown) => (v == null || v === '' ? '' : Number(v));
  const header = [
    'Título',
    'Tipo',
    'Operación',
    'Precio venta',
    'Moneda venta',
    'Precio renta',
    'Moneda renta',
    'm² construcción',
    'm² terreno',
    'Recámaras',
    'Baños',
    'Medios baños',
    'Estacionamientos',
    'Estado',
    'Municipio',
    'Colonia',
    'Dirección',
    'C.P.',
    'Estatus',
    'Destaque',
    'En remate',
    'URL',
    'Creada',
    'Publicada',
  ];
  const body = rows.map((p) => {
    const loc = (p.location ?? {}) as Record<string, string | null>;
    const hasSale = p.priceSale != null;
    const hasRent = p.priceRent != null;
    const operacion =
      hasSale && hasRent ? 'Venta y renta' : hasSale ? 'Venta' : hasRent ? 'Renta' : '—';
    return [
      p.title as string,
      TYPE_ES[p.propertyType as string] ?? (p.propertyType as string),
      operacion,
      n(p.priceSale),
      (p.currencySale as string) ?? '',
      n(p.priceRent),
      (p.currencyRent as string) ?? '',
      n(p.areaM2),
      n(p.lotM2),
      (p.bedrooms as number) ?? '',
      (p.bathrooms as number) ?? '',
      (p.halfBathrooms as number) ?? '',
      (p.parking as number) ?? '',
      loc.estado ?? '',
      loc.municipio ?? '',
      loc.colonia ?? '',
      (p.address as string) ?? '',
      (p.postalCode as string) ?? '',
      STATUS_ES[p.status as string] ?? (p.status as string),
      FEATURED_ES[p.featured as string] ?? (p.featured as string),
      p.isRemate ? 'Sí' : 'No',
      p.slug ? `${env.PUBLIC_SITE_URL}/propiedades/${p.slug}` : '',
      csvDate(p.createdAt as string),
      csvDate(p.publishedAt as string),
    ];
  });
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="inventario-tar-${stamp}.csv"`,
  );
  res.setHeader('Cache-Control', 'no-store');
  res.send(toCsv([header, ...body]));
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
// La dirección exacta SÍ sale por defecto (es la copia interna del asesor); con
// `?direccion=0` se genera la versión para compartir con un prospecto, que solo
// muestra la zona.
export async function flyerPdf(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const includeAddress = req.query.direccion !== '0';
  const pdf = await generateFlyerPdf(id, { includeAddress });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="ficha-${id}.pdf"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(pdf);
}

// Folleto PDF público (por slug): solo propiedades publicadas (getPropertyBySlug
// aplica el filtro de estatus públicos y lanza 404 en borradores). NUNCA lleva la
// dirección exacta: este es el archivo que ve el visitante y el que viaja en el
// webhook de prospectos.
export async function flyerPdfPublic(req: Request, res: Response): Promise<void> {
  const prop = await svc.getPropertyBySlug(String(req.params.slug));
  const pdf = await generateFlyerPdf(prop.id, { includeAddress: false });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="ficha-${prop.slug ?? prop.id}.pdf"`,
  );
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(pdf);
}
