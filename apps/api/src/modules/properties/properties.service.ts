import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  sql,
  type SQL,
} from 'drizzle-orm';
import { db, schema } from '@tar/db';
import type {
  CreatePropertyInput,
  Paginated,
  PropertyAdminQuery,
  PropertyMapQuery,
  PropertyQuery,
  UpdatePropertyInput,
} from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';
import { env } from '../../env';
import { emitEvent } from '../../lib/events';
import { toMxn } from '../../lib/pricing';
import { generateUniqueSlug, slugify } from '../../lib/slug';
import { normalizeText } from '../../lib/text';

const {
  properties,
  locations,
  propertyImages,
  amenities,
  propertyAmenities,
  propertyVideos,
} =
  schema;

// Estatus visibles en el sitio público (§4.1).
const PUBLIC_STATUSES = ['disponible', 'apartado'] as const;

// lat/lng derivados de `geo` (geography → geometry para ST_X/ST_Y).
const latSql = sql<number | null>`ST_Y(${properties.geo}::geometry)`;
const lngSql = sql<number | null>`ST_X(${properties.geo}::geometry)`;

// Columnas públicas de una propiedad (excluye geo binario y search_vector).
const propertyColumns = {
  id: properties.id,
  slug: properties.slug,
  externalRef: properties.externalRef,
  title: properties.title,
  description: properties.description,
  propertyType: properties.propertyType,
  priceSale: properties.priceSale,
  currencySale: properties.currencySale,
  priceRent: properties.priceRent,
  currencyRent: properties.currencyRent,
  bedrooms: properties.bedrooms,
  bathrooms: properties.bathrooms,
  halfBathrooms: properties.halfBathrooms,
  parking: properties.parking,
  floor: properties.floor,
  areaM2: properties.areaM2,
  lotM2: properties.lotM2,
  usableAreaM2: properties.usableAreaM2,
  rentableAreaM2: properties.rentableAreaM2,
  patioM2: properties.patioM2,
  terraceM2: properties.terraceM2,
  balconyM2: properties.balconyM2,
  gardenM2: properties.gardenM2,
  address: properties.address,
  postalCode: properties.postalCode,
  status: properties.status,
  featured: properties.featured,
  isRemate: properties.isRemate,
  publishedAt: properties.publishedAt,
  createdAt: properties.createdAt,
  updatedAt: properties.updatedAt,
  lat: latSql,
  lng: lngSql,
  estado: locations.estado,
  municipio: locations.municipio,
  colonia: locations.colonia,
  slugEstado: locations.slugEstado,
  slugColonia: locations.slugColonia,
};

// Reagrupa los campos de location en un objeto anidado (genérico para preservar
// el resto de columnas tipadas, p.ej. `id`).
function shape<
  T extends {
    estado: string | null;
    municipio: string | null;
    colonia: string | null;
    slugEstado: string | null;
    slugColonia: string | null;
  },
>(row: T) {
  const { estado, municipio, colonia, slugEstado, slugColonia, ...rest } = row;
  return {
    ...rest,
    location: estado
      ? { estado, municipio, colonia, slugEstado, slugColonia }
      : null,
  };
}

// Condiciones de filtro compartidas por el listado y el mapa.
function buildFilters(q: PropertyQuery | PropertyMapQuery): SQL[] {
  const c: SQL[] = [
    isNull(properties.deletedAt),
    inArray(properties.status, [...PUBLIC_STATUSES]),
  ];

  const priceCol =
    q.operation === 'renta'
      ? properties.priceRentMxn
      : q.operation === 'venta'
        ? properties.priceSaleMxn
        : null;
  if (q.operation === 'venta') c.push(isNotNull(properties.priceSaleMxn));
  if (q.operation === 'renta') c.push(isNotNull(properties.priceRentMxn));
  if (q.minPrice != null && priceCol)
    c.push(gte(priceCol, q.minPrice.toString()));
  if (q.maxPrice != null && priceCol)
    c.push(lte(priceCol, q.maxPrice.toString()));

  if (q.type) c.push(eq(properties.propertyType, q.type));
  if (q.bedrooms != null) c.push(gte(properties.bedrooms, q.bedrooms));
  if (q.bathrooms != null) c.push(gte(properties.bathrooms, q.bathrooms));
  if (q.parking != null) c.push(gte(properties.parking, q.parking));
  if (q.minArea != null) c.push(gte(properties.areaM2, q.minArea.toString()));
  if (q.maxArea != null) c.push(lte(properties.areaM2, q.maxArea.toString()));
  if (q.minLot != null) c.push(gte(properties.lotM2, q.minLot.toString()));
  if (q.maxLot != null) c.push(lte(properties.lotM2, q.maxLot.toString()));

  if (q.colonia) c.push(sql`${locations.colonia} ILIKE ${`%${q.colonia}%`}`);
  if (q.q)
    c.push(sql`${properties.searchVector} @@ plainto_tsquery('spanish', ${q.q})`);

  if (q.amenities?.length) {
    c.push(
      sql`${properties.id} IN (
        SELECT property_id FROM property_amenities
        WHERE amenity_id IN (${sql.join(
          q.amenities.map((a) => sql`${a}`),
          sql`, `,
        )})
        GROUP BY property_id
        HAVING count(DISTINCT amenity_id) = ${q.amenities.length}
      )`,
    );
  }
  return c;
}

// GET /properties — listado público con filtros, orden y paginación.
export async function listProperties(q: PropertyQuery): Promise<Paginated<unknown>> {
  const where = and(...buildFilters(q));
  const offset = (q.page - 1) * q.limit;

  const priceCol =
    q.operation === 'renta' ? properties.priceRentMxn : properties.priceSaleMxn;
  // relevancia: premium > destacada > normal, luego recientes.
  const featuredRank = sql`CASE ${properties.featured} WHEN 'premium' THEN 0 WHEN 'destacada' THEN 1 ELSE 2 END`;
  const orderBy: SQL[] =
    q.sort === 'precio_asc'
      ? [asc(priceCol)]
      : q.sort === 'precio_desc'
        ? [desc(priceCol)]
        : q.sort === 'recientes'
          ? [desc(properties.publishedAt)]
          : [featuredRank as SQL, desc(properties.publishedAt)];

  const rows = await db
    .select(propertyColumns)
    .from(properties)
    .leftJoin(locations, eq(properties.locationId, locations.id))
    .where(where)
    .orderBy(...orderBy)
    .limit(q.limit)
    .offset(offset);

  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(properties)
    .leftJoin(locations, eq(properties.locationId, locations.id))
    .where(where);
  const total = countRows[0]?.count ?? 0;

  const covers = await coverImages(rows.map((r) => r.id));
  const data = rows.map((r) => ({
    ...shape(r),
    cover: covers.get(r.id) ?? null,
  }));

  return { data, meta: { page: q.page, limit: q.limit, total } };
}

// GET /properties/admin — listado del backoffice: TODOS los estatus (incl.
// borrador), filtro por estatus y búsqueda. No aplica los estatus públicos.
export async function listPropertiesAdmin(
  q: PropertyAdminQuery,
): Promise<Paginated<unknown>> {
  const c: SQL[] = [
    q.archived === 'true'
      ? isNotNull(properties.deletedAt)
      : isNull(properties.deletedAt),
  ];
  if (q.status) c.push(eq(properties.status, q.status));
  if (q.type) c.push(eq(properties.propertyType, q.type));
  if (q.featured) c.push(eq(properties.featured, q.featured));
  if (q.remate === 'true') c.push(eq(properties.isRemate, true));
  if (q.q)
    c.push(sql`${properties.searchVector} @@ plainto_tsquery('spanish', ${q.q})`);
  const where = and(...c);
  const offset = (q.page - 1) * q.limit;

  const orderBy: SQL[] =
    q.sort === 'recientes'
      ? [desc(properties.createdAt)]
      : q.sort === 'precio_asc'
        ? [asc(properties.priceSaleMxn), asc(properties.priceRentMxn)]
        : q.sort === 'precio_desc'
          ? [desc(properties.priceSaleMxn), desc(properties.priceRentMxn)]
          : [desc(properties.updatedAt)];

  const rows = await db
    .select(propertyColumns)
    .from(properties)
    .leftJoin(locations, eq(properties.locationId, locations.id))
    .where(where)
    .orderBy(...orderBy)
    .limit(q.limit)
    .offset(offset);

  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(properties)
    .where(where);
  const total = countRows[0]?.count ?? 0;

  const covers = await coverImages(rows.map((r) => r.id));
  const data = rows.map((r) => ({
    ...shape(r),
    cover: covers.get(r.id) ?? null,
  }));

  return { data, meta: { page: q.page, limit: q.limit, total } };
}

// Conteo de propiedades por estatus (no borradas) — KPIs del dashboard admin.
export async function propertyStatusCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      status: properties.status,
      count: sql<number>`count(*)::int`,
    })
    .from(properties)
    .where(isNull(properties.deletedAt))
    .groupBy(properties.status);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = r.count;
  return out;
}

// Conteo por tipo de propiedad (todo el inventario, incl. borradores) para el
// mix del dashboard. Agregado real en BD: no depende de la muestra paginada.
export async function propertyTypeCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      type: properties.propertyType,
      count: sql<number>`count(*)::int`,
    })
    .from(properties)
    .where(isNull(properties.deletedAt))
    .groupBy(properties.propertyType);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.type] = r.count;
  return out;
}

// GET /properties/map — payload ligero para clustering (bbox + filtros).
export async function mapProperties(q: PropertyMapQuery) {
  const c = buildFilters(q);
  c.push(isNotNull(properties.geo));
  if (q.bbox) {
    c.push(
      sql`ST_Within(${properties.geo}::geometry, ST_MakeEnvelope(${q.bbox.minLng}, ${q.bbox.minLat}, ${q.bbox.maxLng}, ${q.bbox.maxLat}, 4326))`,
    );
  }

  const rows = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      featured: properties.featured,
      lat: latSql,
      lng: lngSql,
      priceSale: properties.priceSale,
      currencySale: properties.currencySale,
      priceRent: properties.priceRent,
      currencyRent: properties.currencyRent,
    })
    .from(properties)
    .leftJoin(locations, eq(properties.locationId, locations.id))
    .where(and(...c))
    .limit(1000);

  // price/currency corresponden a la operación filtrada, en moneda ORIGINAL.
  return rows.map((r) => {
    const rent = q.operation === 'renta';
    const price = rent
      ? r.priceRent
      : q.operation === 'venta'
        ? r.priceSale
        : (r.priceSale ?? r.priceRent);
    const currency = rent
      ? r.currencyRent
      : q.operation === 'venta'
        ? r.currencySale
        : (r.currencySale ?? r.currencyRent);
    return {
      id: r.id,
      slug: r.slug,
      featured: r.featured,
      lat: r.lat,
      lng: r.lng,
      price,
      currency,
    };
  });
}

// GET /properties/:slug — detalle público (imágenes + amenidades).
export async function getPropertyBySlug(slug: string) {
  const [row] = await db
    .select(propertyColumns)
    .from(properties)
    .leftJoin(locations, eq(properties.locationId, locations.id))
    .where(
      and(
        eq(properties.slug, slug),
        isNull(properties.deletedAt),
        inArray(properties.status, [...PUBLIC_STATUSES]),
      ),
    )
    .limit(1);

  if (!row) throw new ApiError(404, 'not_found', 'Propiedad no encontrada.');
  return withImagesAndAmenities(shape(row));
}

// Versión admin: por id, sin filtro de estatus (ve borradores).
export async function getPropertyByIdAdmin(id: string) {
  const [row] = await db
    .select(propertyColumns)
    .from(properties)
    .leftJoin(locations, eq(properties.locationId, locations.id))
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1);
  if (!row) throw new ApiError(404, 'not_found', 'Propiedad no encontrada.');
  return withImagesAndAmenities(shape(row));
}

async function withImagesAndAmenities<T extends { id: string }>(prop: T) {
  const images = await db
    .select({
      id: propertyImages.id,
      urlWebp: propertyImages.urlWebp,
      urlThumb: propertyImages.urlThumb,
      alt: propertyImages.alt,
      position: propertyImages.position,
      isCover: propertyImages.isCover,
      width: propertyImages.width,
      height: propertyImages.height,
    })
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, prop.id))
    .orderBy(asc(propertyImages.position));

  const ams = await db
    .select({
      id: amenities.id,
      name: amenities.name,
      icon: amenities.icon,
    })
    .from(propertyAmenities)
    .innerJoin(amenities, eq(amenities.id, propertyAmenities.amenityId))
    .where(eq(propertyAmenities.propertyId, prop.id));

  const videos = await db
    .select({
      id: propertyVideos.id,
      url: propertyVideos.url,
      orientation: propertyVideos.orientation,
      position: propertyVideos.position,
    })
    .from(propertyVideos)
    .where(eq(propertyVideos.propertyId, prop.id))
    .orderBy(asc(propertyVideos.position));

  return { ...prop, images, amenities: ams, videos };
}

// Imagen de portada por propiedad (para el listado).
async function coverImages(ids: string[]) {
  const map = new Map<string, { urlWebp: string; urlThumb: string }>();
  if (!ids.length) return map;
  const rows = await db
    .select({
      propertyId: propertyImages.propertyId,
      urlWebp: propertyImages.urlWebp,
      urlThumb: propertyImages.urlThumb,
      isCover: propertyImages.isCover,
      position: propertyImages.position,
    })
    .from(propertyImages)
    .where(inArray(propertyImages.propertyId, ids))
    .orderBy(desc(propertyImages.isCover), asc(propertyImages.position));
  for (const r of rows) {
    if (!map.has(r.propertyId)) {
      map.set(r.propertyId, { urlWebp: r.urlWebp, urlThumb: r.urlThumb });
    }
  }
  return map;
}

// Busca o crea la location (estado/municipio/colonia). El match es INSENSIBLE a
// acentos y mayúsculas (normalizeText): aunque el editor o el importador escriban
// una variante ("cuauhtemoc"), se reutiliza la location canónica existente en lugar
// de crear un duplicado. Solo si no hay coincidencia normalizada se inserta una nueva
// (preservando la grafía tal cual la escribió el usuario).
async function resolveLocation(input: {
  estado?: string;
  municipio?: string;
  colonia?: string;
}): Promise<string | null> {
  const estado = input.estado?.trim();
  const municipio = input.municipio?.trim();
  const colonia = input.colonia?.trim();
  if (!estado || !municipio || !colonia) return null;

  const nEstado = normalizeText(estado);
  const nMunicipio = normalizeText(municipio);
  const nColonia = normalizeText(colonia);

  const all = await db
    .select({
      id: locations.id,
      estado: locations.estado,
      municipio: locations.municipio,
      colonia: locations.colonia,
    })
    .from(locations);
  const existing = all.find(
    (l) =>
      normalizeText(l.estado) === nEstado &&
      normalizeText(l.municipio) === nMunicipio &&
      normalizeText(l.colonia) === nColonia,
  );
  if (existing) return existing.id;
  const [created] = await db
    .insert(locations)
    .values({
      estado,
      municipio,
      colonia,
      slugEstado: slugify(estado),
      slugColonia: slugify(colonia),
    })
    .returning({ id: locations.id });
  return created!.id;
}

async function setAmenities(propertyId: string, amenityIds: string[]) {
  await db
    .delete(propertyAmenities)
    .where(eq(propertyAmenities.propertyId, propertyId));
  if (amenityIds.length) {
    await db
      .insert(propertyAmenities)
      .values(amenityIds.map((amenityId) => ({ propertyId, amenityId })))
      .onConflictDoNothing();
  }
}

const geoSql = (lat: number, lng: number): SQL =>
  sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;

// POST /properties — crea borrador.
export async function createProperty(
  input: CreatePropertyInput,
  userId: string,
) {
  const locationId = await resolveLocation(input);
  const [created] = await db
    .insert(properties)
    .values({
      title: input.title,
      description: input.description,
      propertyType: input.propertyType,
      externalRef: input.externalRef,
      priceSale: input.priceSale?.toString() ?? null,
      currencySale: input.currencySale ?? null,
      priceRent: input.priceRent?.toString() ?? null,
      currencyRent: input.currencyRent ?? null,
      priceSaleMxn: toMxn(input.priceSale, input.currencySale),
      priceRentMxn: toMxn(input.priceRent, input.currencyRent),
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      halfBathrooms: input.halfBathrooms,
      parking: input.parking,
      floor: input.floor,
      areaM2: input.areaM2?.toString() ?? null,
      lotM2: input.lotM2?.toString() ?? null,
      usableAreaM2: input.usableAreaM2?.toString() ?? null,
      rentableAreaM2: input.rentableAreaM2?.toString() ?? null,
      patioM2: input.patioM2?.toString() ?? null,
      terraceM2: input.terraceM2?.toString() ?? null,
      balconyM2: input.balconyM2?.toString() ?? null,
      gardenM2: input.gardenM2?.toString() ?? null,
      locationId,
      address: input.address,
      postalCode: input.postalCode,
      geo:
        input.lat != null && input.lng != null
          ? geoSql(input.lat, input.lng)
          : null,
      featured: input.featured ?? 'normal',
      isRemate: input.isRemate ?? false,
      status: 'borrador',
      createdBy: userId,
    })
    .returning({ id: properties.id });

  if (input.amenities?.length) await setAmenities(created!.id, input.amenities);
  return getPropertyByIdAdmin(created!.id);
}

// PATCH /properties/:id — actualiza campos (recalcula MXN, geo, location).
export async function updateProperty(id: string, input: UpdatePropertyInput) {
  const [current] = await db
    .select({
      id: properties.id,
      priceSale: properties.priceSale,
      currencySale: properties.currencySale,
      priceRent: properties.priceRent,
      currencyRent: properties.currencyRent,
    })
    .from(properties)
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1);
  if (!current) throw new ApiError(404, 'not_found', 'Propiedad no encontrada.');

  const set: Record<string, unknown> = { updatedAt: new Date() };
  const assign = <K extends keyof UpdatePropertyInput>(k: K, col: string) => {
    if (input[k] !== undefined) set[col] = input[k];
  };
  assign('title', 'title');
  assign('description', 'description');
  assign('propertyType', 'propertyType');
  assign('externalRef', 'externalRef');
  assign('bedrooms', 'bedrooms');
  assign('bathrooms', 'bathrooms');
  assign('halfBathrooms', 'halfBathrooms');
  assign('parking', 'parking');
  assign('floor', 'floor');
  assign('address', 'address');
  assign('postalCode', 'postalCode');
  assign('featured', 'featured');
  assign('isRemate', 'isRemate');
  const numAssign = (k: keyof UpdatePropertyInput, col: string) => {
    if (input[k] !== undefined) set[col] = input[k]?.toString() ?? null;
  };
  numAssign('areaM2', 'areaM2');
  numAssign('lotM2', 'lotM2');
  numAssign('usableAreaM2', 'usableAreaM2');
  numAssign('rentableAreaM2', 'rentableAreaM2');
  numAssign('patioM2', 'patioM2');
  numAssign('terraceM2', 'terraceM2');
  numAssign('balconyM2', 'balconyM2');
  numAssign('gardenM2', 'gardenM2');

  // Precios + normalización a MXN (merge con lo actual).
  const priceTouched =
    input.priceSale !== undefined ||
    input.currencySale !== undefined ||
    input.priceRent !== undefined ||
    input.currencyRent !== undefined;
  if (priceTouched) {
    const saleP =
      input.priceSale ??
      (current.priceSale != null ? Number(current.priceSale) : null);
    const saleC = input.currencySale ?? current.currencySale ?? null;
    const rentP =
      input.priceRent ??
      (current.priceRent != null ? Number(current.priceRent) : null);
    const rentC = input.currencyRent ?? current.currencyRent ?? null;
    set.priceSale = saleP?.toString() ?? null;
    set.currencySale = saleC;
    set.priceRent = rentP?.toString() ?? null;
    set.currencyRent = rentC;
    set.priceSaleMxn = toMxn(saleP, saleC);
    set.priceRentMxn = toMxn(rentP, rentC);
  }

  if (input.lat != null && input.lng != null) {
    set.geo = geoSql(input.lat, input.lng);
  }
  if (input.estado || input.municipio || input.colonia) {
    set.locationId = await resolveLocation(input);
  }

  await db.update(properties).set(set).where(eq(properties.id, id));
  if (input.amenities) await setAmenities(id, input.amenities);
  return getPropertyByIdAdmin(id);
}

// Payload enriquecido para el webhook `property.published`: incluye datos útiles
// (título, descripción, precio, fotos, amenidades, ubicación y enlace) para que el
// consumidor (n8n, CRM…) no tenga que hacer una segunda llamada.
type PropertyDetailShape = Awaited<ReturnType<typeof getPropertyByIdAdmin>>;
function buildPublishedPayload(
  d: PropertyDetailShape,
  slug: string,
): Record<string, unknown> {
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    id: d.id,
    slug,
    url: `${env.PUBLIC_SITE_URL}/propiedades/${slug}`,
    title: d.title,
    description: d.description,
    propertyType: d.propertyType,
    status: d.status,
    featured: d.featured,
    price: {
      sale: num(d.priceSale),
      saleCurrency: d.currencySale,
      rent: num(d.priceRent),
      rentCurrency: d.currencyRent,
    },
    bedrooms: d.bedrooms,
    bathrooms: d.bathrooms,
    halfBathrooms: d.halfBathrooms,
    parking: d.parking,
    areaM2: num(d.areaM2),
    lotM2: num(d.lotM2),
    usableAreaM2: num(d.usableAreaM2),
    rentableAreaM2: num(d.rentableAreaM2),
    patioM2: num(d.patioM2),
    terraceM2: num(d.terraceM2),
    balconyM2: num(d.balconyM2),
    gardenM2: num(d.gardenM2),
    isRemate: d.isRemate,
    address: d.address,
    postalCode: d.postalCode,
    location: d.location,
    lat: d.lat,
    lng: d.lng,
    cover:
      d.images.find((i) => i.isCover)?.urlWebp ?? d.images[0]?.urlWebp ?? null,
    images: d.images.map((i) => i.urlWebp),
    amenities: d.amenities.map((a) => a.name),
  };
}

// POST /properties/:id/publish — valida geo + campos, slug inmutable, evento.
export async function publishProperty(id: string) {
  const [p] = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      title: properties.title,
      priceSale: properties.priceSale,
      priceRent: properties.priceRent,
      publishedAt: properties.publishedAt,
      hasGeo: sql<boolean>`${properties.geo} IS NOT NULL`,
    })
    .from(properties)
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1);
  if (!p) throw new ApiError(404, 'not_found', 'Propiedad no encontrada.');
  if (!p.hasGeo)
    throw new ApiError(
      422,
      'geo_required',
      'La propiedad necesita ubicación en el mapa para publicarse.',
    );
  if (!p.priceSale && !p.priceRent)
    throw new ApiError(
      422,
      'price_required',
      'Se requiere al menos un precio (venta o renta) para publicar.',
    );

  // slug inmutable: si ya existe, se conserva.
  const slug = p.slug ?? (await generateUniqueSlug(p.title, id));
  await db
    .update(properties)
    .set({
      slug,
      status: 'disponible',
      publishedAt: p.publishedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(properties.id, id));

  const detail = await getPropertyByIdAdmin(id);
  await emitEvent('property.published', buildPublishedPayload(detail, slug));
  return detail;
}

// PATCH /properties/:id/status — estatus comercial + evento.
export async function updateStatus(
  id: string,
  status: (typeof PUBLIC_STATUSES)[number] | string,
) {
  const [p] = await db
    .select({ id: properties.id, status: properties.status })
    .from(properties)
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1);
  if (!p) throw new ApiError(404, 'not_found', 'Propiedad no encontrada.');

  await db
    .update(properties)
    .set({
      status: status as (typeof schema.propertyStatus.enumValues)[number],
      updatedAt: new Date(),
    })
    .where(eq(properties.id, id));

  await emitEvent('property.status_changed', {
    id,
    from: p.status,
    to: status,
  });
  return getPropertyByIdAdmin(id);
}

// DELETE /properties/:id — soft delete (la guía del proyecto: nunca hard delete).
export async function softDeleteProperty(id: string) {
  const [p] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1);
  if (!p) throw new ApiError(404, 'not_found', 'Propiedad no encontrada.');
  await db
    .update(properties)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(properties.id, id));
}

// POST /properties/:id/restore — des-archiva (recupera una propiedad archivada).
export async function restoreProperty(id: string) {
  const [p] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, id), isNotNull(properties.deletedAt)))
    .limit(1);
  if (!p) throw new ApiError(404, 'not_found', 'Propiedad archivada no encontrada.');
  await db
    .update(properties)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(properties.id, id));
  return getPropertyByIdAdmin(id);
}

// POST /properties/:id/unpublish — regresa una propiedad publicada a borrador.
export async function unpublishProperty(id: string) {
  const [p] = await db
    .select({ id: properties.id, status: properties.status })
    .from(properties)
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1);
  if (!p) throw new ApiError(404, 'not_found', 'Propiedad no encontrada.');
  if (p.status === 'borrador') return getPropertyByIdAdmin(id);
  await db
    .update(properties)
    .set({ status: 'borrador', publishedAt: null, updatedAt: new Date() })
    .where(eq(properties.id, id));
  await emitEvent('property.status_changed', { id, from: p.status, to: 'borrador' });
  return getPropertyByIdAdmin(id);
}

// POST /properties/:id/duplicate — crea un BORRADOR copiando los datos (sin
// imágenes ni slug; el slug se genera al publicar). Copia amenidades y ubicación.
export async function duplicateProperty(id: string, userId: string) {
  const [src] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1);
  if (!src) throw new ApiError(404, 'not_found', 'Propiedad no encontrada.');

  const [copy] = await db
    .insert(properties)
    .values({
      title: `${src.title} (copia)`,
      description: src.description,
      propertyType: src.propertyType,
      externalRef: null, // el external_ref es único por origen: no se copia
      priceSale: src.priceSale,
      currencySale: src.currencySale,
      priceRent: src.priceRent,
      currencyRent: src.currencyRent,
      priceSaleMxn: src.priceSaleMxn,
      priceRentMxn: src.priceRentMxn,
      bedrooms: src.bedrooms,
      bathrooms: src.bathrooms,
      halfBathrooms: src.halfBathrooms,
      parking: src.parking,
      floor: src.floor,
      areaM2: src.areaM2,
      lotM2: src.lotM2,
      usableAreaM2: src.usableAreaM2,
      rentableAreaM2: src.rentableAreaM2,
      patioM2: src.patioM2,
      terraceM2: src.terraceM2,
      balconyM2: src.balconyM2,
      gardenM2: src.gardenM2,
      locationId: src.locationId,
      address: src.address,
      postalCode: src.postalCode,
      geo: src.geo,
      featured: src.featured,
      isRemate: src.isRemate,
      status: 'borrador',
      slug: null,
      publishedAt: null,
      createdBy: userId,
    })
    .returning({ id: properties.id });

  const ams = await db
    .select({ amenityId: propertyAmenities.amenityId })
    .from(propertyAmenities)
    .where(eq(propertyAmenities.propertyId, id));
  if (ams.length) {
    await db
      .insert(propertyAmenities)
      .values(ams.map((a) => ({ propertyId: copy!.id, amenityId: a.amenityId })))
      .onConflictDoNothing();
  }
  return getPropertyByIdAdmin(copy!.id);
}

// POST /properties/bulk — acción masiva. Devuelve conteo de ok/errores por id,
// aplicando la misma validación que las acciones individuales (p.ej. publish
// exige geo + precio, así que las que no cumplan se reportan como error).
export async function bulkProperties(
  ids: string[],
  action: 'publish' | 'unpublish' | 'archive' | 'restore' | 'status',
  status?: (typeof PUBLIC_STATUSES)[number] | string,
): Promise<{ ok: number; failed: { id: string; error: string }[] }> {
  const failed: { id: string; error: string }[] = [];
  let ok = 0;
  for (const id of ids) {
    try {
      if (action === 'publish') await publishProperty(id);
      else if (action === 'unpublish') await unpublishProperty(id);
      else if (action === 'archive') await softDeleteProperty(id);
      else if (action === 'restore') await restoreProperty(id);
      else if (action === 'status') await updateStatus(id, status!);
      ok += 1;
    } catch (err) {
      failed.push({
        id,
        error: err instanceof ApiError ? err.message : 'Error',
      });
    }
  }
  return { ok, failed };
}
