import { randomBytes } from 'node:crypto';
import { and, desc, eq, gte, ilike, isNull, lte, sql, type SQL } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import type {
  CreateSegmentInput,
  SegmentFilters,
  UpdateSegmentInput,
} from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';
import { env } from '../../env';

const { properties, locations, propertySegments } = schema;

// Token no adivinable para la URL pública del feed.
function newFeedToken(): string {
  return randomBytes(16).toString('hex');
}

export async function listSegments() {
  return db
    .select()
    .from(propertySegments)
    .orderBy(desc(propertySegments.createdAt));
}

export async function getSegment(id: string) {
  const [row] = await db
    .select()
    .from(propertySegments)
    .where(eq(propertySegments.id, id))
    .limit(1);
  if (!row) throw new ApiError(404, 'not_found', 'Segmento no encontrado.');
  return row;
}

export async function createSegment(input: CreateSegmentInput) {
  const [row] = await db
    .insert(propertySegments)
    .values({
      name: input.name,
      filters: input.filters,
      isActive: input.isActive,
      feedToken: newFeedToken(),
    })
    .returning();
  return row!;
}

export async function updateSegment(id: string, input: UpdateSegmentInput) {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) set.name = input.name;
  if (input.filters !== undefined) set.filters = input.filters;
  if (input.isActive !== undefined) set.isActive = input.isActive;
  const [row] = await db
    .update(propertySegments)
    .set(set)
    .where(eq(propertySegments.id, id))
    .returning();
  if (!row) throw new ApiError(404, 'not_found', 'Segmento no encontrado.');
  return row;
}

export async function deleteSegment(id: string): Promise<void> {
  const [row] = await db
    .delete(propertySegments)
    .where(eq(propertySegments.id, id))
    .returning({ id: propertySegments.id });
  if (!row) throw new ApiError(404, 'not_found', 'Segmento no encontrado.');
}

// Traduce los filtros del segmento a condiciones SQL sobre propiedades PUBLICADAS.
function buildSegmentFilters(f: SegmentFilters): SQL[] {
  const c: SQL[] = [
    isNull(properties.deletedAt),
    eq(properties.status, 'disponible'),
  ];
  const priceCol =
    f.operation === 'renta' ? properties.priceRentMxn : properties.priceSaleMxn;
  if (f.operation === 'venta') c.push(sql`${properties.priceSaleMxn} IS NOT NULL`);
  if (f.operation === 'renta') c.push(sql`${properties.priceRentMxn} IS NOT NULL`);
  if (f.type) c.push(eq(properties.propertyType, f.type));
  if (f.minPrice != null) c.push(gte(priceCol, f.minPrice.toString()));
  if (f.maxPrice != null) c.push(lte(priceCol, f.maxPrice.toString()));
  if (f.minBedrooms != null) c.push(gte(properties.bedrooms, f.minBedrooms));
  if (f.featured) c.push(eq(properties.featured, f.featured));
  if (f.remate) c.push(eq(properties.isRemate, true));
  if (f.estado) c.push(ilike(locations.estado, f.estado));
  if (f.municipio) c.push(ilike(locations.municipio, f.municipio));
  if (f.colonia) c.push(ilike(locations.colonia, f.colonia));
  return c;
}

// Cuenta cuántas propiedades casan un segmento (para la UI).
export async function countSegmentMatches(filters: SegmentFilters): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(properties)
    .leftJoin(locations, eq(properties.locationId, locations.id))
    .where(and(...buildSegmentFilters(filters)));
  return rows[0]?.count ?? 0;
}

// Escapa un campo para CSV (comillas, comas, saltos de línea).
function csv(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value).replace(/[\r\n]+/g, ' ');
  return `"${s.replace(/"/g, '""')}"`;
}

// Genera el feed CSV (catálogo de Meta) del segmento identificado por su token.
// Solo propiedades DISPONIBLES que casan los filtros. Lanza 404 si el token no
// corresponde a un segmento activo.
export async function generateFeedCsv(token: string): Promise<string> {
  const [seg] = await db
    .select()
    .from(propertySegments)
    .where(
      and(
        eq(propertySegments.feedToken, token),
        eq(propertySegments.isActive, true),
      ),
    )
    .limit(1);
  if (!seg) throw new ApiError(404, 'not_found', 'Feed no encontrado.');

  const filters = seg.filters as SegmentFilters;
  const rows = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      title: properties.title,
      description: properties.description,
      priceSale: properties.priceSale,
      currencySale: properties.currencySale,
      priceRent: properties.priceRent,
      currencyRent: properties.currencyRent,
    })
    .from(properties)
    .leftJoin(locations, eq(properties.locationId, locations.id))
    .where(and(...buildSegmentFilters(filters)))
    .orderBy(desc(properties.publishedAt));

  // Portadas de todas las propiedades del feed.
  const ids = rows.map((r) => r.id);
  const covers = new Map<string, string>();
  if (ids.length) {
    const imgs = await db.execute<{ property_id: string; url_webp: string }>(sql`
      SELECT DISTINCT ON (property_id) property_id, url_webp
      FROM property_images
      WHERE property_id IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})
      ORDER BY property_id, is_cover DESC, position ASC
    `);
    for (const r of imgs.rows) covers.set(r.property_id, r.url_webp);
  }

  const site = env.PUBLIC_SITE_URL.replace(/\/$/, '');
  const header =
    'id,title,description,availability,condition,price,link,image_link,brand';
  const lines = rows.map((r) => {
    const useRent = filters.operation === 'renta';
    const price = useRent
      ? r.priceRent && `${Number(r.priceRent)} ${r.currencyRent ?? 'MXN'}`
      : (r.priceSale && `${Number(r.priceSale)} ${r.currencySale ?? 'MXN'}`) ||
        (r.priceRent && `${Number(r.priceRent)} ${r.currencyRent ?? 'MXN'}`);
    return [
      csv(r.id),
      csv(r.title),
      csv(r.description ?? r.title),
      csv('in stock'),
      csv('new'),
      csv(price || '0 MXN'),
      csv(r.slug ? `${site}/propiedades/${r.slug}` : site),
      csv(covers.get(r.id) ?? ''),
      csv('TAR Internacional'),
    ].join(',');
  });
  return [header, ...lines].join('\n');
}
