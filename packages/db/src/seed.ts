import argon2 from 'argon2';
import { sql } from 'drizzle-orm';
import { db, pool } from './index';
import {
  amenities,
  locations,
  properties,
  propertyAmenities,
  propertyImages,
  users,
} from './schema';

// Seed de datos de MUESTRA (PRD §4.2). Representa el inventario real (venta/renta,
// MXN/USD, varios tipos, CDMX/Edomex/Querétaro) sin ser el CSV definitivo: la
// corrida real se hace con `pnpm import:inventario` en Fase A / Lanzamiento.
// Idempotente: limpia las tablas de catálogo antes de insertar (solo dev).

const USD_MXN_RATE = Number(process.env.USD_MXN_RATE ?? '18.50');

const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const toMxn = (price: number | null, currency: 'MXN' | 'USD' | null): string | null => {
  if (price == null || currency == null) return null;
  const mxn = currency === 'USD' ? price * USD_MXN_RATE : price;
  return mxn.toFixed(2);
};

// --- Catálogos ---
const AMENITIES = [
  { name: 'Alberca', icon: 'pool' },
  { name: 'Gimnasio', icon: 'dumbbell' },
  { name: 'Seguridad 24h', icon: 'shield' },
  { name: 'Roof garden', icon: 'tree' },
  { name: 'Elevador', icon: 'elevator' },
  { name: 'Áreas verdes', icon: 'leaf' },
  { name: 'Estacionamiento de visitas', icon: 'parking' },
  { name: 'Casa club', icon: 'home' },
];

const LOCATIONS = [
  { estado: 'Ciudad de México', municipio: 'Miguel Hidalgo', colonia: 'Polanco' },
  { estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonia: 'Roma Norte' },
  { estado: 'Ciudad de México', municipio: 'Benito Juárez', colonia: 'Del Valle' },
  { estado: 'Estado de México', municipio: 'Naucalpan', colonia: 'Satélite' },
  { estado: 'Querétaro', municipio: 'Querétaro', colonia: 'Juriquilla' },
];

type PropertyTypeValue =
  | 'casa'
  | 'departamento'
  | 'oficina'
  | 'local_comercial'
  | 'bodega_industrial'
  | 'terreno_industrial'
  | 'edificio'
  | 'terreno';

interface SeedProperty {
  title: string;
  description: string;
  type: PropertyTypeValue;
  loc: number; // índice en LOCATIONS
  priceSale: number | null;
  currencySale: 'MXN' | 'USD' | null;
  priceRent: number | null;
  currencyRent: 'MXN' | 'USD' | null;
  bedrooms: number | null;
  bathrooms: number | null;
  halfBathrooms: number | null;
  parking: number | null;
  areaM2: number | null;
  lotM2: number | null;
  lat: number;
  lng: number;
  featured: 'normal' | 'destacada' | 'premium';
  amenities: string[]; // nombres
}

const PROPS: SeedProperty[] = [
  {
    title: 'Departamento de lujo en Polanco',
    description: 'Amplio departamento con acabados premium, vista a la ciudad y amenidades de primer nivel en el corazón de Polanco.',
    type: 'departamento', loc: 0,
    priceSale: 12500000, currencySale: 'MXN', priceRent: null, currencyRent: null,
    bedrooms: 3, bathrooms: 3, halfBathrooms: 1, parking: 2, areaM2: 185, lotM2: null,
    lat: 19.4333, lng: -99.1936, featured: 'premium',
    amenities: ['Alberca', 'Gimnasio', 'Seguridad 24h', 'Elevador'],
  },
  {
    title: 'Casa moderna en Satélite',
    description: 'Casa familiar de tres niveles con jardín, ideal para familia grande, en zona residencial consolidada.',
    type: 'casa', loc: 3,
    priceSale: 6800000, currencySale: 'MXN', priceRent: null, currencyRent: null,
    bedrooms: 4, bathrooms: 3, halfBathrooms: 1, parking: 2, areaM2: 280, lotM2: 320,
    lat: 19.5092, lng: -99.2376, featured: 'destacada',
    amenities: ['Áreas verdes', 'Seguridad 24h'],
  },
  {
    title: 'Loft en Roma Norte en renta',
    description: 'Loft industrial restaurado, luminoso, a pasos de los mejores restaurantes y galerías de la Roma.',
    type: 'departamento', loc: 1,
    priceSale: null, currencySale: null, priceRent: 28000, currencyRent: 'MXN',
    bedrooms: 1, bathrooms: 1, halfBathrooms: 0, parking: 1, areaM2: 75, lotM2: null,
    lat: 19.4180, lng: -99.1626, featured: 'normal',
    amenities: ['Roof garden', 'Elevador'],
  },
  {
    title: 'Oficina corporativa en Del Valle',
    description: 'Oficina en piso completo con recepción, salas de juntas y estacionamiento. Lista para ocupar.',
    type: 'oficina', loc: 2,
    priceSale: null, currencySale: null, priceRent: 4500, currencyRent: 'USD',
    bedrooms: null, bathrooms: 2, halfBathrooms: 0, parking: 6, areaM2: 220, lotM2: null,
    lat: 19.3859, lng: -99.1649, featured: 'normal',
    amenities: ['Seguridad 24h', 'Elevador', 'Estacionamiento de visitas'],
  },
  {
    title: 'Local comercial en Juriquilla',
    description: 'Local a pie de avenida con alto flujo peatonal y vehicular, ideal para franquicia o showroom.',
    type: 'local_comercial', loc: 4,
    priceSale: null, currencySale: null, priceRent: 45000, currencyRent: 'MXN',
    bedrooms: null, bathrooms: 1, halfBathrooms: 1, parking: 4, areaM2: 130, lotM2: null,
    lat: 20.7000, lng: -100.4470, featured: 'normal',
    amenities: ['Estacionamiento de visitas'],
  },
  {
    title: 'Bodega industrial en Naucalpan',
    description: 'Nave industrial con andén de carga, oficinas administrativas y altura libre de 10 metros.',
    type: 'bodega_industrial', loc: 3,
    priceSale: 1850000, currencySale: 'USD', priceRent: 95000, currencyRent: 'MXN',
    bedrooms: null, bathrooms: 2, halfBathrooms: 0, parking: 10, areaM2: 1200, lotM2: 1500,
    lat: 19.4781, lng: -99.2386, featured: 'destacada',
    amenities: ['Seguridad 24h'],
  },
  {
    title: 'Terreno industrial en Querétaro',
    description: 'Terreno plano con uso de suelo industrial, frente a vialidad principal y servicios completos.',
    type: 'terreno_industrial', loc: 4,
    priceSale: 32000000, currencySale: 'MXN', priceRent: null, currencyRent: null,
    bedrooms: null, bathrooms: null, halfBathrooms: null, parking: null, areaM2: null, lotM2: 8000,
    lat: 20.6500, lng: -100.4000, featured: 'normal',
    amenities: [],
  },
  {
    title: 'Edificio de departamentos en Roma Norte',
    description: 'Edificio completo de 6 departamentos, excelente oportunidad de inversión con rentas activas.',
    type: 'edificio', loc: 1,
    priceSale: 4200000, currencySale: 'USD', priceRent: null, currencyRent: null,
    bedrooms: 12, bathrooms: 8, halfBathrooms: 4, parking: 6, areaM2: 720, lotM2: 400,
    lat: 19.4145, lng: -99.1700, featured: 'premium',
    amenities: ['Elevador', 'Seguridad 24h'],
  },
  {
    title: 'Terreno residencial en Juriquilla',
    description: 'Terreno en fraccionamiento privado con amenidades, listo para construir tu casa de ensueño.',
    type: 'terreno', loc: 4,
    priceSale: 3200000, currencySale: 'MXN', priceRent: null, currencyRent: null,
    bedrooms: null, bathrooms: null, halfBathrooms: null, parking: null, areaM2: null, lotM2: 450,
    lat: 20.7050, lng: -100.4500, featured: 'normal',
    amenities: ['Casa club', 'Seguridad 24h', 'Áreas verdes'],
  },
  {
    title: 'Casa en venta y renta en Del Valle',
    description: 'Casa remodelada disponible tanto en venta como en renta, en una de las colonias más demandadas.',
    type: 'casa', loc: 2,
    priceSale: 9500000, currencySale: 'MXN', priceRent: 42000, currencyRent: 'MXN',
    bedrooms: 3, bathrooms: 2, halfBathrooms: 1, parking: 2, areaM2: 210, lotM2: 200,
    lat: 19.3795, lng: -99.1620, featured: 'destacada',
    amenities: ['Áreas verdes', 'Seguridad 24h'],
  },
];

async function main() {
  // eslint-disable-next-line no-console
  console.log('Seed: limpiando catálogo...');
  await db.execute(sql`
    TRUNCATE TABLE property_amenities, property_images, properties,
      amenities, locations, users RESTART IDENTITY CASCADE
  `);

  // Admin
  const passwordHash = await argon2.hash('admin123');
  const [admin] = await db
    .insert(users)
    .values({
      email: 'admin@tarinternacional.com',
      passwordHash,
      name: 'Administrador TAR',
      role: 'admin',
    })
    .returning();

  // Amenities
  const insertedAmenities = await db
    .insert(amenities)
    .values(AMENITIES)
    .returning();
  const amenityByName = new Map(insertedAmenities.map((a) => [a.name, a.id]));

  // Locations
  const insertedLocations = await db
    .insert(locations)
    .values(
      LOCATIONS.map((l) => ({
        ...l,
        slugEstado: slugify(l.estado),
        slugColonia: slugify(l.colonia),
      })),
    )
    .returning();

  // Properties
  let count = 0;
  for (const p of PROPS) {
    const loc = insertedLocations[p.loc]!;
    const [inserted] = await db
      .insert(properties)
      .values({
        slug: `${slugify(p.title)}-${count + 1}`,
        title: p.title,
        description: p.description,
        propertyType: p.type,
        priceSale: p.priceSale?.toFixed(2) ?? null,
        currencySale: p.currencySale,
        priceRent: p.priceRent?.toFixed(2) ?? null,
        currencyRent: p.currencyRent,
        priceSaleMxn: toMxn(p.priceSale, p.currencySale),
        priceRentMxn: toMxn(p.priceRent, p.currencyRent),
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        halfBathrooms: p.halfBathrooms,
        parking: p.parking,
        areaM2: p.areaM2?.toFixed(2) ?? null,
        lotM2: p.lotM2?.toFixed(2) ?? null,
        locationId: loc.id,
        address: `${loc.colonia}, ${loc.municipio}`,
        geo: sql`ST_SetSRID(ST_MakePoint(${p.lng}, ${p.lat}), 4326)::geography`,
        status: 'disponible',
        featured: p.featured,
        publishedAt: sql`now()`,
        createdBy: admin!.id,
      })
      .returning();

    if (p.amenities.length) {
      await db.insert(propertyAmenities).values(
        p.amenities
          .map((name) => amenityByName.get(name))
          .filter((id): id is string => Boolean(id))
          .map((amenityId) => ({ propertyId: inserted!.id, amenityId })),
      );
    }

    // Imagen de portada placeholder (las reales llegan con el importador).
    await db.insert(propertyImages).values({
      propertyId: inserted!.id,
      urlWebp: `https://placehold.co/1200x800/0F1B2D/FFF.webp?text=${encodeURIComponent(p.title)}`,
      urlThumb: `https://placehold.co/400x300/0F1B2D/FFF.webp`,
      alt: p.title,
      position: 0,
      isCover: true,
    });

    count++;
  }

  // eslint-disable-next-line no-console
  console.log(`✔ Seed completo: ${count} propiedades, 1 admin (admin@tarinternacional.com / admin123).`);
  await pool.end();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('✖ Falló el seed:', err);
  process.exit(1);
});
