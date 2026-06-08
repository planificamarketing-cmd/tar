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
  PropertyMapQuery,
  PropertyQuery,
  UpdatePropertyInput,
} from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';
import { emitEvent } from '../../lib/events';
import { toMxn } from '../../lib/pricing';
import { generateUniqueSlug, slugify } from '../../lib/slug';

const { properties, locations, propertyImages, amenities, propertyAmenities } =
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
  address: properties.address,
  postalCode: properties.postalCode,
  status: properties.status,
  featured: properties.featured,
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

  return { ...prop, images, amenities: ams };
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

// Busca o crea la location (estado/municipio/colonia).
async function resolveLocation(input: {
  estado?: string;
  municipio?: string;
  colonia?: string;
}): Promise<string | null> {
  const { estado, municipio, colonia } = input;
  if (!estado || !municipio || !colonia) return null;
  const [existing] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      and(
        eq(locations.estado, estado),
        eq(locations.municipio, municipio),
        eq(locations.colonia, colonia),
      ),
    )
    .limit(1);
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
      locationId,
      address: input.address,
      postalCode: input.postalCode,
      geo:
        input.lat != null && input.lng != null
          ? geoSql(input.lat, input.lng)
          : null,
      featured: input.featured ?? 'normal',
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
  if (input.areaM2 !== undefined) set.areaM2 = input.areaM2?.toString() ?? null;
  if (input.lotM2 !== undefined) set.lotM2 = input.lotM2?.toString() ?? null;

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

  await emitEvent('property.published', { id, slug });
  return getPropertyByIdAdmin(id);
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

// DELETE /properties/:id — soft delete (CLAUDE.md: nunca hard delete).
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
