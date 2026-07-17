import { z } from 'zod';
import { featuredLevelSchema, propertyTypeSchema } from './enums';

// Segmentación de propiedades para catálogos de Meta. Un segmento es un conjunto
// con nombre de filtros ESTRICTOS; su feed CSV incluye solo propiedades
// publicadas (disponibles) que casan TODOS los filtros presentes.
export const segmentFiltersSchema = z
  .object({
    operation: z.enum(['venta', 'renta']).optional(),
    type: propertyTypeSchema.optional(),
    // Precios en MXN (columnas normalizadas price_*_mxn).
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    minBedrooms: z.coerce.number().int().nonnegative().optional(),
    estado: z.string().trim().min(1).optional(),
    municipio: z.string().trim().min(1).optional(),
    colonia: z.string().trim().min(1).optional(),
    featured: featuredLevelSchema.optional(),
    remate: z.boolean().optional(),
  })
  .strict();
export type SegmentFilters = z.infer<typeof segmentFiltersSchema>;

// Formato del feed de Meta: catálogo inmobiliario (Home Listings) o comercial.
export const FEED_FORMATS = ['home_listings', 'commerce'] as const;
export const feedFormatSchema = z.enum(FEED_FORMATS);
export type FeedFormat = z.infer<typeof feedFormatSchema>;

export const createSegmentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  filters: segmentFiltersSchema.default({}),
  feedFormat: feedFormatSchema.default('home_listings'),
  isActive: z.boolean().default(true),
});
export type CreateSegmentInput = z.infer<typeof createSegmentSchema>;

export const updateSegmentSchema = createSegmentSchema.partial();
export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>;
