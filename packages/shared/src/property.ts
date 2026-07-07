import { z } from 'zod';
import {
  commercialStatusSchema,
  currencySchema,
  featuredLevelSchema,
  propertyStatusSchema,
  propertyTypeSchema,
} from './enums';
import { paginationSchema } from './common';

// Acepta "a,b,c" o ?amenities=a&amenities=b → string[].
const csvArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    const arr = Array.isArray(v) ? v : v.split(',');
    return arr.map((s) => s.trim()).filter(Boolean);
  });

export const PROPERTY_SORTS = [
  'relevancia',
  'precio_asc',
  'precio_desc',
  'recientes',
] as const;
export const propertySortSchema = z.enum(PROPERTY_SORTS).default('relevancia');
export type PropertySort = (typeof PROPERTY_SORTS)[number];

// PRD §5.2 — filtros del listado público GET /properties.
// `operation` selecciona qué precio aplica; min/maxPrice operan sobre price_*_mxn.
export const propertyQuerySchema = paginationSchema.extend({
  operation: z.enum(['venta', 'renta']).optional(),
  type: propertyTypeSchema.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  parking: z.coerce.number().int().nonnegative().optional(),
  minArea: z.coerce.number().nonnegative().optional(),
  maxArea: z.coerce.number().nonnegative().optional(),
  minLot: z.coerce.number().nonnegative().optional(),
  maxLot: z.coerce.number().nonnegative().optional(),
  amenities: csvArray,
  colonia: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  sort: propertySortSchema,
});
export type PropertyQuery = z.infer<typeof propertyQuerySchema>;

// --- Listado admin (backoffice) ---
// A diferencia del público, ve TODOS los estatus (incl. borrador) y permite
// filtrar por estatus. Orden por recientes/actualizados; búsqueda por texto.
export const PROPERTY_ADMIN_SORTS = [
  'recientes',
  'actualizados',
  'precio_asc',
  'precio_desc',
] as const;
export const propertyAdminSortSchema = z
  .enum(PROPERTY_ADMIN_SORTS)
  .default('actualizados');
export type PropertyAdminSort = (typeof PROPERTY_ADMIN_SORTS)[number];

export const propertyAdminQuerySchema = paginationSchema.extend({
  status: propertyStatusSchema.optional(),
  type: propertyTypeSchema.optional(),
  featured: featuredLevelSchema.optional(),
  q: z.string().trim().min(1).optional(),
  sort: propertyAdminSortSchema,
  // 'true' → solo archivadas (soft-deleted); por defecto solo las activas.
  archived: z.enum(['true', 'false']).optional(),
});
export type PropertyAdminQuery = z.infer<typeof propertyAdminQuerySchema>;

// PRD §5.2 — GET /properties/map: filtros del listado + bbox.
// bbox = "minLng,minLat,maxLng,maxLat".
export const bboxSchema = z
  .string()
  .transform((s, ctx) => {
    const parts = s.split(',').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'bbox debe ser "minLng,minLat,maxLng,maxLat"',
      });
      return z.NEVER;
    }
    const [minLng, minLat, maxLng, maxLat] = parts as [
      number,
      number,
      number,
      number,
    ];
    return { minLng, minLat, maxLng, maxLat };
  });

export const propertyMapQuerySchema = propertyQuerySchema
  .omit({ page: true, limit: true, sort: true })
  .extend({ bbox: bboxSchema.optional() });
export type PropertyMapQuery = z.infer<typeof propertyMapQuerySchema>;

// --- Create / Update (admin/broker) ---
const priceField = z.coerce.number().positive().optional();

const basePropertyShape = {
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().optional(),
  propertyType: propertyTypeSchema,
  externalRef: z.string().trim().optional(),
  priceSale: priceField,
  currencySale: currencySchema.optional(),
  priceRent: priceField,
  currencyRent: currencySchema.optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  halfBathrooms: z.coerce.number().int().nonnegative().optional(),
  parking: z.coerce.number().int().nonnegative().optional(),
  floor: z.string().trim().optional(),
  areaM2: z.coerce.number().nonnegative().optional(),
  lotM2: z.coerce.number().nonnegative().optional(),
  address: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  // Ubicación geográfica (PostGIS). geo opcional en borrador, requerido al publicar.
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  estado: z.string().trim().optional(),
  municipio: z.string().trim().optional(),
  colonia: z.string().trim().optional(),
  featured: featuredLevelSchema.optional(),
  amenities: z.array(z.string().uuid()).optional(),
};

// Una propiedad debe tener al menos un precio (venta o renta), y si hay precio
// debe traer su moneda.
const priceRefine = (
  data: {
    priceSale?: number;
    currencySale?: string;
    priceRent?: number;
    currencyRent?: string;
  },
  ctx: z.RefinementCtx,
) => {
  if (data.priceSale && !data.currencySale) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currencySale'],
      message: 'currencySale es requerido cuando hay priceSale.',
    });
  }
  if (data.priceRent && !data.currencyRent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currencyRent'],
      message: 'currencyRent es requerido cuando hay priceRent.',
    });
  }
};

export const createPropertySchema = z
  .object(basePropertyShape)
  .superRefine((data, ctx) => {
    if (!data.priceSale && !data.priceRent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['priceSale'],
        message: 'Debe especificar al menos un precio (venta o renta).',
      });
    }
    priceRefine(data, ctx);
  });
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = z
  .object(basePropertyShape)
  .partial()
  .superRefine(priceRefine);
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

// PATCH /properties/:id/status (PRD §5.2).
export const updateStatusSchema = z.object({
  status: commercialStatusSchema,
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// POST /properties/bulk — acciones masivas del backoffice sobre varias propiedades.
// `status` es obligatorio solo cuando la acción es 'status'.
export const PROPERTY_BULK_ACTIONS = [
  'publish',
  'unpublish',
  'archive',
  'restore',
  'status',
] as const;
export const propertyBulkSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(200),
    action: z.enum(PROPERTY_BULK_ACTIONS),
    status: commercialStatusSchema.optional(),
  })
  .refine((d) => d.action !== 'status' || !!d.status, {
    path: ['status'],
    message: 'status es requerido cuando la acción es "status".',
  });
export type PropertyBulkInput = z.infer<typeof propertyBulkSchema>;

// PATCH /properties/:id/images/:imgId — reordenar / set cover / alt (§5.3).
export const updateImageSchema = z
  .object({
    position: z.coerce.number().int().nonnegative().optional(),
    isCover: z.boolean().optional(),
    alt: z.string().trim().max(200).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'Debe especificar al menos un campo a actualizar.',
  });
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
