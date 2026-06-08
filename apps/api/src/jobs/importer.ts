import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { eq, sql } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import { env } from '../env';
import { logger } from '../lib/logger';
import { storage } from '../lib/storage';
import { toMxn } from '../lib/pricing';
import { generateUniqueSlug, slugify } from '../lib/slug';

const { properties, locations, amenities, propertyAmenities, propertyImages } =
  schema;

// Encabezados EXACTOS del export de EasyBroker (§4.3). La columna "0" es un
// encabezado roto: en realidad son recámaras (✔ confirmado por el cliente).
export const COL = {
  ref: 'id público (EB)',
  title: 'título de propiedad',
  priceSale: 'precio de venta',
  currencySale: 'moneda de venta',
  priceRent: 'precio de renta',
  currencyRent: 'moneda de renta',
  type: 'tipo de propiedad',
  description: 'descripción de propiedad',
  area: 'metros de construcción (m²)',
  lot: 'metros de terreno (m²)',
  baths: 'cantidad de baños',
  halfBaths: 'cantidad de medios baños',
  bedrooms: '0',
  floor: 'piso',
  parking: 'estacionamientos',
  street: 'calle',
  extNum: 'número exterior',
  intNum: 'número interior',
  postalCode: 'código postal',
  estado: 'estado',
  ciudad: 'ciudad',
  colonia: 'colonia/zona/barrio',
  features: 'características',
  images: 'imágenes',
} as const;

export type CsvRow = Record<string, string>;
export type PropertyType =
  (typeof schema.propertyType.enumValues)[number];

// ── Helpers puros (testeables) ──────────────────────────────────────────────

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

// "$4,350,000.00" → 4350000 ; vacío → null
export function parseMoney(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseIntOrNull(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === '') return null;
  const n = parseInt(raw.replace(/[^0-9-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

export function parseNumOrNull(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === '') return null;
  const n = Number(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const TYPE_MAP: Record<string, PropertyType> = {
  casa: 'casa',
  departamento: 'departamento',
  depto: 'departamento',
  oficina: 'oficina',
  'local comercial': 'local_comercial',
  local: 'local_comercial',
  'bodega industrial': 'bodega_industrial',
  bodega: 'bodega_industrial',
  'terreno industrial': 'terreno_industrial',
  edificio: 'edificio',
  terreno: 'terreno',
};

// Mapea el tipo del CSV al enum. Devuelve el tipo + si hubo que adivinar.
export function mapPropertyType(raw: string | undefined): {
  type: PropertyType;
  guessed: boolean;
} {
  const key = norm(raw ?? '');
  if (TYPE_MAP[key]) return { type: TYPE_MAP[key], guessed: false };
  if (key.includes('bodega')) return { type: 'bodega_industrial', guessed: true };
  if (key.includes('terreno'))
    return {
      type: key.includes('industrial') ? 'terreno_industrial' : 'terreno',
      guessed: true,
    };
  if (key.includes('oficina')) return { type: 'oficina', guessed: true };
  if (key.includes('local')) return { type: 'local_comercial', guessed: true };
  if (key.includes('edificio')) return { type: 'edificio', guessed: true };
  if (key.includes('depa') || key.includes('depto'))
    return { type: 'departamento', guessed: true };
  return { type: 'casa', guessed: true };
}

export function currency(raw: string | undefined): 'MXN' | 'USD' | null {
  const u = (raw ?? '').toUpperCase().trim();
  return u === 'USD' ? 'USD' : u === 'MXN' ? 'MXN' : null;
}

export function buildAddress(row: CsvRow): string | null {
  const parts = [
    (row[COL.street] ?? '').trim(),
    (row[COL.extNum] ?? '').trim(),
    (row[COL.intNum] ?? '').trim() ? `Int ${(row[COL.intNum] ?? '').trim()}` : '',
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

export function parseImageUrls(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//.test(u));
}

export function parseFeatures(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
}

// ── Mapeo de una fila a los valores de la propiedad ─────────────────────────
export interface MappedProperty {
  externalRef: string;
  title: string;
  description: string | null;
  propertyType: PropertyType;
  typeGuessed: boolean;
  priceSale: number | null;
  currencySale: 'MXN' | 'USD' | null;
  priceRent: number | null;
  currencyRent: 'MXN' | 'USD' | null;
  bedrooms: number | null;
  bathrooms: number | null;
  halfBathrooms: number | null;
  parking: number | null;
  floor: string | null;
  areaM2: number | null;
  lotM2: number | null;
  estado: string | null;
  municipio: string | null;
  colonia: string | null;
  address: string | null;
  postalCode: string | null;
  features: string[];
  images: string[];
}

export function mapRow(row: CsvRow): MappedProperty {
  const { type, guessed } = mapPropertyType(row[COL.type]);
  return {
    externalRef: (row[COL.ref] ?? '').trim(),
    title: (row[COL.title] ?? '').trim(),
    description: (row[COL.description] ?? '').trim() || null,
    propertyType: type,
    typeGuessed: guessed,
    priceSale: parseMoney(row[COL.priceSale]),
    currencySale: currency(row[COL.currencySale]),
    priceRent: parseMoney(row[COL.priceRent]),
    currencyRent: currency(row[COL.currencyRent]),
    bedrooms: parseIntOrNull(row[COL.bedrooms]),
    bathrooms: parseIntOrNull(row[COL.baths]),
    halfBathrooms: parseIntOrNull(row[COL.halfBaths]),
    parking: parseIntOrNull(row[COL.parking]),
    floor: (row[COL.floor] ?? '').trim() || null,
    areaM2: parseNumOrNull(row[COL.area]),
    lotM2: parseNumOrNull(row[COL.lot]),
    estado: (row[COL.estado] ?? '').trim() || null,
    municipio: (row[COL.ciudad] ?? '').trim() || null,
    colonia: (row[COL.colonia] ?? '').trim() || null,
    address: buildAddress(row),
    postalCode: (row[COL.postalCode] ?? '').trim() || null,
    features: parseFeatures(row[COL.features]),
    images: parseImageUrls(row[COL.images]),
  };
}

// ── Importación con efectos (BD, red) ───────────────────────────────────────
export interface ImportOptions {
  dryRun?: boolean;
  noImages?: boolean;
  noGeo?: boolean;
  limit?: number;
}

export interface ImportReport {
  total: number;
  created: number;
  updated: number;
  disponible: number;
  borrador: number;
  byType: Record<string, number>;
  withSale: number;
  withRent: number;
  imagesDownloaded: number;
  deadImages: number;
  geocoded: number;
  warnings: string[];
  failed: { ref: string; reason: string }[];
}

async function geocode(
  parts: string[],
): Promise<{ lat: number; lng: number } | null> {
  if (!env.GOOGLE_GEOCODING_API_KEY) return null;
  const address = encodeURIComponent(parts.filter(Boolean).join(', '));
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${env.GOOGLE_GEOCODING_API_KEY}`,
      { signal: AbortSignal.timeout(15_000) },
    );
    const json = (await res.json()) as {
      status: string;
      results?: { geometry: { location: { lat: number; lng: number } } }[];
    };
    if (json.status !== 'OK' || !json.results?.length) return null;
    return json.results[0]!.geometry.location;
  } catch {
    return null;
  }
}

async function downloadImages(
  propertyId: string,
  urls: string[],
): Promise<{ ok: number; dead: number }> {
  let ok = 0;
  let dead = 0;
  let position = -1;
  for (const url of urls.slice(0, 30)) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) {
        dead += 1;
        continue;
      }
      const input = Buffer.from(await res.arrayBuffer());
      const full = await sharp(input)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      const thumb = await sharp(input)
        .rotate()
        .resize({ width: 400, height: 300, fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
      const hash = createHash('sha256')
        .update(full.data)
        .digest('hex')
        .slice(0, 16);
      const urlWebp = await storage.save(
        `${propertyId}/${hash}.webp`,
        full.data,
      );
      const urlThumb = await storage.save(
        `${propertyId}/${hash}_thumb.webp`,
        thumb,
      );
      position += 1;
      await db.insert(propertyImages).values({
        propertyId,
        urlWebp,
        urlThumb,
        width: full.info.width,
        height: full.info.height,
        position,
        isCover: position === 0,
      });
      ok += 1;
    } catch {
      dead += 1;
    }
  }
  return { ok, dead };
}

// Cache de amenidades por nombre normalizado; crea las faltantes (§4.3).
async function buildAmenityResolver() {
  const rows = await db
    .select({ id: amenities.id, name: amenities.name })
    .from(amenities);
  const cache = new Map(rows.map((r) => [norm(r.name), r.id]));
  return async (name: string): Promise<string> => {
    const key = norm(name);
    const hit = cache.get(key);
    if (hit) return hit;
    const [created] = await db
      .insert(amenities)
      .values({ name })
      .onConflictDoNothing()
      .returning({ id: amenities.id });
    let id = created?.id;
    if (!id) {
      const [existing] = await db
        .select({ id: amenities.id })
        .from(amenities)
        .where(eq(amenities.name, name))
        .limit(1);
      id = existing!.id;
    }
    cache.set(key, id);
    return id;
  };
}

async function resolveLocation(m: MappedProperty): Promise<string | null> {
  if (!m.estado || !m.municipio || !m.colonia) return null;
  const [existing] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      sql`${locations.estado} = ${m.estado} AND ${locations.municipio} = ${m.municipio} AND ${locations.colonia} = ${m.colonia}`,
    )
    .limit(1);
  if (existing) return existing.id;
  const [created] = await db
    .insert(locations)
    .values({
      estado: m.estado,
      municipio: m.municipio,
      colonia: m.colonia,
      slugEstado: slugify(m.estado),
      slugColonia: slugify(m.colonia),
    })
    .returning({ id: locations.id });
  return created!.id;
}

export async function runImport(
  rows: CsvRow[],
  opts: ImportOptions = {},
): Promise<ImportReport> {
  const report: ImportReport = {
    total: 0,
    created: 0,
    updated: 0,
    disponible: 0,
    borrador: 0,
    byType: {},
    withSale: 0,
    withRent: 0,
    imagesDownloaded: 0,
    deadImages: 0,
    geocoded: 0,
    warnings: [],
    failed: [],
  };
  const list = opts.limit ? rows.slice(0, opts.limit) : rows;
  const resolveAmenity = opts.dryRun ? null : await buildAmenityResolver();

  for (const row of list) {
    const m = mapRow(row);
    report.total += 1;

    if (!m.externalRef || !m.title) {
      report.failed.push({
        ref: m.externalRef || '(sin ref)',
        reason: 'falta id público o título',
      });
      continue;
    }

    report.byType[m.propertyType] = (report.byType[m.propertyType] ?? 0) + 1;
    if (m.priceSale) report.withSale += 1;
    if (m.priceRent) report.withRent += 1;
    if (m.typeGuessed)
      report.warnings.push(`${m.externalRef}: tipo inferido (${m.propertyType})`);
    if (!m.priceSale && !m.priceRent)
      report.warnings.push(`${m.externalRef}: sin precio`);

    if (opts.dryRun) {
      report.borrador += 1;
      continue;
    }

    try {
      // Geocoding (si hay key). Sin geo → borrador.
      let geo: { lat: number; lng: number } | null = null;
      if (!opts.noGeo) {
        geo = await geocode([
          m.address ?? '',
          m.colonia ?? '',
          m.municipio ?? '',
          m.estado ?? '',
          m.postalCode ?? '',
          'México',
        ]);
        if (geo) report.geocoded += 1;
      }

      const locationId = await resolveLocation(m);

      // Upsert idempotente por external_ref.
      const baseValues = {
        title: m.title,
        description: m.description,
        propertyType: m.propertyType,
        priceSale: m.priceSale?.toString() ?? null,
        currencySale: m.currencySale,
        priceRent: m.priceRent?.toString() ?? null,
        currencyRent: m.currencyRent,
        priceSaleMxn: toMxn(m.priceSale, m.currencySale),
        priceRentMxn: toMxn(m.priceRent, m.currencyRent),
        bedrooms: m.bedrooms,
        bathrooms: m.bathrooms,
        halfBathrooms: m.halfBathrooms,
        parking: m.parking,
        floor: m.floor,
        areaM2: m.areaM2?.toString() ?? null,
        lotM2: m.lotM2?.toString() ?? null,
        locationId,
        address: m.address,
        postalCode: m.postalCode,
        updatedAt: new Date(),
        ...(geo
          ? {
              geo: sql`ST_SetSRID(ST_MakePoint(${geo.lng}, ${geo.lat}), 4326)::geography`,
            }
          : {}),
      };

      const existingRows = await db
        .select({ id: properties.id, slug: properties.slug })
        .from(properties)
        .where(eq(properties.externalRef, m.externalRef))
        .limit(1);
      const existing = existingRows[0];

      let propertyId: string;
      if (existing) {
        await db
          .update(properties)
          .set(baseValues)
          .where(eq(properties.id, existing.id));
        propertyId = existing.id;
        report.updated += 1;
      } else {
        const [inserted] = await db
          .insert(properties)
          .values({
            ...baseValues,
            externalRef: m.externalRef,
            status: 'borrador',
            featured: 'normal',
          })
          .returning({ id: properties.id });
        propertyId = inserted!.id;
        report.created += 1;
      }

      // Amenidades (match difuso por nombre normalizado + creación de faltantes).
      if (m.features.length && resolveAmenity) {
        const ids = new Set<string>();
        for (const f of m.features) ids.add(await resolveAmenity(f));
        await db
          .delete(propertyAmenities)
          .where(eq(propertyAmenities.propertyId, propertyId));
        await db
          .insert(propertyAmenities)
          .values([...ids].map((amenityId) => ({ propertyId, amenityId })))
          .onConflictDoNothing();
      }

      // Imágenes: solo si la propiedad aún no tiene (re-ejecución no re-descarga).
      if (!opts.noImages && m.images.length) {
        const imgCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, propertyId));
        if ((imgCount[0]?.count ?? 0) === 0) {
          const r = await downloadImages(propertyId, m.images);
          report.imagesDownloaded += r.ok;
          report.deadImages += r.dead;
          if (r.dead)
            report.warnings.push(`${m.externalRef}: ${r.dead} imagen(es) caída(s)`);
        }
      }

      // Estatus: disponible si tiene geo + imágenes; si no, borrador (revisión).
      const [imgCountRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(propertyImages)
        .where(eq(propertyImages.propertyId, propertyId));
      const hasImages = (imgCountRow?.count ?? 0) > 0;

      if (geo && hasImages) {
        const slug =
          existing?.slug ?? (await generateUniqueSlug(m.title, propertyId));
        await db
          .update(properties)
          .set({
            slug,
            status: 'disponible',
            publishedAt: sql`coalesce(published_at, now())`,
          })
          .where(eq(properties.id, propertyId));
        report.disponible += 1;
      } else {
        report.borrador += 1;
        if (!geo)
          report.warnings.push(`${m.externalRef}: sin geocoding → borrador`);
      }
    } catch (err) {
      logger.error({ err, ref: m.externalRef }, 'fila falló en el importador');
      report.failed.push({ ref: m.externalRef, reason: String(err) });
    }
  }

  return report;
}
