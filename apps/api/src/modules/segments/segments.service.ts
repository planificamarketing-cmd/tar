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
      feedFormat: input.feedFormat,
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
  if (input.feedFormat !== undefined) set.feedFormat = input.feedFormat;
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
      propertyType: properties.propertyType,
      priceSale: properties.priceSale,
      currencySale: properties.currencySale,
      priceRent: properties.priceRent,
      currencyRent: properties.currencyRent,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      areaM2: properties.areaM2,
      postalCode: properties.postalCode,
      address: properties.address,
      lat: sql<number | null>`ST_Y(${properties.geo}::geometry)`,
      lng: sql<number | null>`ST_X(${properties.geo}::geometry)`,
      estado: locations.estado,
      municipio: locations.municipio,
      colonia: locations.colonia,
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
  const useRent = filters.operation === 'renta';
  const priceOf = (r: FeedRow) =>
    useRent
      ? r.priceRent && `${Number(r.priceRent)} ${r.currencyRent ?? 'MXN'}`
      : (r.priceSale && `${Number(r.priceSale)} ${r.currencySale ?? 'MXN'}`) ||
        (r.priceRent && `${Number(r.priceRent)} ${r.currencyRent ?? 'MXN'}`);
  const linkOf = (slug: string | null) =>
    slug ? `${site}/propiedades/${slug}` : site;

  return seg.feedFormat === 'commerce'
    ? commerceCsv(rows, covers, priceOf, linkOf)
    : homeListingsCsv(rows, covers, useRent, priceOf, linkOf);
}

type FeedRow = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  propertyType: string;
  priceSale: string | null;
  currencySale: string | null;
  priceRent: string | null;
  currencyRent: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: string | null;
  postalCode: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  estado: string | null;
  municipio: string | null;
  colonia: string | null;
};

// Catálogo comercial genérico de Meta (Advantage+ / commerce).
function commerceCsv(
  rows: FeedRow[],
  covers: Map<string, string>,
  priceOf: (r: FeedRow) => string | null | undefined | false,
  linkOf: (slug: string | null) => string,
): string {
  const header =
    'id,title,description,availability,condition,price,link,image_link,brand';
  const lines = rows.map((r) =>
    [
      csv(r.id),
      csv(r.title),
      csv(r.description ?? r.title),
      csv('in stock'),
      csv('new'),
      csv(priceOf(r) || '0 MXN'),
      csv(linkOf(r.slug)),
      csv(covers.get(r.id) ?? ''),
      csv('TAR Internacional'),
    ].join(','),
  );
  return [header, ...lines].join('\n');
}

// Mapa de tipo de propiedad → property_type del catálogo inmobiliario de Meta.
const META_PROPERTY_TYPE: Record<string, string> = {
  casa: 'house',
  departamento: 'apartment',
  oficina: 'other',
  local_comercial: 'other',
  bodega_industrial: 'other',
  terreno_industrial: 'land',
  terreno: 'land',
  edificio: 'multi_family',
};

// Catálogo inmobiliario de Meta (Home Listings). Campos específicos del vertical
// de bienes raíces. Requiere lat/long (las propiedades disponibles siempre las
// tienen: publicar exige geo).
function homeListingsCsv(
  rows: FeedRow[],
  covers: Map<string, string>,
  useRent: boolean,
  priceOf: (r: FeedRow) => string | null | undefined | false,
  linkOf: (slug: string | null) => string,
): string {
  const header = [
    'home_listing_id',
    'name',
    'availability',
    'description',
    'price',
    'url',
    'image[0].url',
    'latitude',
    'longitude',
    'address.addr1',
    'address.city',
    'address.region',
    'address.postal_code',
    'address.country',
    'property_type',
    'listing_type',
    'num_beds',
    'num_baths',
    'area_size',
    'area_unit',
  ].join(',');
  const availability = useRent ? 'for_rent' : 'for_sale';
  const listingType = useRent ? 'for_rent_by_agent' : 'for_sale_by_agent';
  const lines = rows.map((r) =>
    [
      csv(r.id),
      csv(r.title),
      csv(availability),
      csv(r.description ?? r.title),
      csv(priceOf(r) || '0 MXN'),
      csv(linkOf(r.slug)),
      csv(covers.get(r.id) ?? ''),
      csv(r.lat ?? ''),
      csv(r.lng ?? ''),
      csv(r.address ?? r.colonia ?? ''),
      csv(r.municipio ?? ''),
      csv(r.estado ?? ''),
      csv(r.postalCode ?? ''),
      csv('MX'),
      csv(META_PROPERTY_TYPE[r.propertyType] ?? 'other'),
      csv(listingType),
      csv(r.bedrooms ?? ''),
      csv(r.bathrooms ?? ''),
      csv(r.areaM2 != null ? Number(r.areaM2) : ''),
      csv('sqm'),
    ].join(','),
  );
  return [header, ...lines].join('\n');
}
