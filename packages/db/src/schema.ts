// Esquema Drizzle de la plataforma TAR (PRD §4.1).
// PostgreSQL 16 + PostGIS 3.4. Geografía en `geography(Point,4326)`.
// Índices: btree compuestos (filtros escalares), GIN full-text (`q`), GiST (geo).
import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// --- Tipos personalizados (no nativos en Drizzle) ---
const citext = customType<{ data: string }>({ dataType: () => 'citext' });
// NOTA: drizzle-kit entrecomilla el modificador `(Point,4326)` al generar el SQL,
// lo que rompe el DDL. Si se regenera la migración del `geo`, hay que quitar las
// comillas: `"geo" geography(Point,4326)` (no `"geography(Point,4326)"`).
const geography = customType<{ data: string }>({
  dataType: () => 'geography(Point,4326)',
});
const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });

// --- Enums ---
export const userRole = pgEnum('user_role', [
  'admin',
  'editor',
  'ventas',
  'lector',
]);
export const propertyType = pgEnum('property_type', [
  'casa',
  'departamento',
  'oficina',
  'local_comercial',
  'bodega_industrial',
  'terreno_industrial',
  'edificio',
  'terreno',
]);
export const propertyStatus = pgEnum('property_status', [
  'borrador',
  'disponible',
  'apartado',
  'rentado',
  'vendido',
  'pausado',
]);
export const featuredLevel = pgEnum('featured_level', [
  'normal',
  'destacada',
  'premium',
]);
export const leadType = pgEnum('lead_type', ['contacto', 'cita']);
// Pipeline de leads del negocio inmobiliario (decisión del cliente, ronda 1).
export const leadStatus = pgEnum('lead_status', [
  'nuevo',
  'cita_agendada',
  'cita_concretada',
  'apartado',
  'firma_contrato',
  'descartado',
]);
export const deliveryStatus = pgEnum('delivery_status', [
  'pendiente',
  'entregado',
  'fallido',
]);
export const propertyEventType = pgEnum('property_event_type', ['view']);
export const scriptPlacement = pgEnum('script_placement', [
  'head',
  'body',
  'footer',
]);
export const videoOrientation = pgEnum('video_orientation', [
  'horizontal',
  'vertical',
]);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
};

// --- users ---
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: citext('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: userRole('role').notNull().default('editor'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

// --- refresh_tokens ---
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('refresh_tokens_user_idx').on(t.userId)],
);

// --- locations ---
export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    estado: text('estado').notNull(),
    municipio: text('municipio').notNull(),
    colonia: text('colonia').notNull(),
    slugEstado: text('slug_estado').notNull(),
    slugColonia: text('slug_colonia').notNull(),
  },
  (t) => [
    uniqueIndex('locations_unique_idx').on(t.estado, t.municipio, t.colonia),
    index('locations_slug_idx').on(t.slugEstado, t.slugColonia),
  ],
);

// --- properties ---
export const properties = pgTable(
  'properties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').unique(),
    externalRef: text('external_ref').unique(),
    title: text('title').notNull(),
    description: text('description'),
    propertyType: propertyType('property_type').notNull(),
    // Precios duales (venta/renta), moneda original preservada para el display.
    priceSale: numeric('price_sale', { precision: 14, scale: 2 }),
    currencySale: char('currency_sale', { length: 3 }),
    priceRent: numeric('price_rent', { precision: 14, scale: 2 }),
    currencyRent: char('currency_rent', { length: 3 }),
    // Normalizados a MXN para filtrar/ordenar (USD_MXN_RATE del env).
    priceSaleMxn: numeric('price_sale_mxn', { precision: 14, scale: 2 }),
    priceRentMxn: numeric('price_rent_mxn', { precision: 14, scale: 2 }),
    bedrooms: integer('bedrooms'),
    bathrooms: integer('bathrooms'),
    halfBathrooms: integer('half_bathrooms'),
    parking: integer('parking'),
    floor: text('floor'),
    areaM2: numeric('area_m2', { precision: 10, scale: 2 }),
    lotM2: numeric('lot_m2', { precision: 10, scale: 2 }),
    // Metraje de oficina: superficie útil y rentable (solo aplica a `oficina`).
    usableAreaM2: numeric('usable_area_m2', { precision: 10, scale: 2 }),
    rentableAreaM2: numeric('rentable_area_m2', { precision: 10, scale: 2 }),
    // Áreas exteriores con su metraje opcional. Aplicabilidad por tipo (se valida en
    // el editor): patio/terraza/balcón → depto/casa/oficina; jardín → casa/depto.
    patioM2: numeric('patio_m2', { precision: 10, scale: 2 }),
    terraceM2: numeric('terrace_m2', { precision: 10, scale: 2 }),
    balconyM2: numeric('balcony_m2', { precision: 10, scale: 2 }),
    gardenM2: numeric('garden_m2', { precision: 10, scale: 2 }),
    locationId: uuid('location_id').references(() => locations.id),
    address: text('address'),
    postalCode: text('postal_code'),
    geo: geography('geo'),
    status: propertyStatus('status').notNull().default('borrador'),
    featured: featuredLevel('featured').notNull().default('normal'),
    // Etiqueta "en remate" (convive con cualquier estatus; aplica a venta y renta).
    isRemate: boolean('is_remate').notNull().default(false),
    // Full-text en español sobre title+description (filtro `q`).
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, ''))`,
    ),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [
    index('properties_sale_filter_idx').on(
      t.status,
      t.propertyType,
      t.priceSaleMxn,
    ),
    index('properties_rent_filter_idx').on(
      t.status,
      t.propertyType,
      t.priceRentMxn,
    ),
    index('properties_bedrooms_idx').on(t.bedrooms),
    index('properties_featured_idx').on(t.featured, t.publishedAt),
    index('properties_search_idx').using('gin', t.searchVector),
    index('properties_geo_idx').using('gist', t.geo),
  ],
);

// --- amenities ---
export const amenities = pgTable('amenities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  icon: text('icon'),
});

// --- property_amenities (N:M) ---
export const propertyAmenities = pgTable(
  'property_amenities',
  {
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    amenityId: uuid('amenity_id')
      .notNull()
      .references(() => amenities.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.propertyId, t.amenityId] }),
    index('property_amenities_amenity_idx').on(t.amenityId),
  ],
);

// --- property_images ---
export const propertyImages = pgTable(
  'property_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    urlWebp: text('url_webp').notNull(),
    urlThumb: text('url_thumb').notNull(),
    alt: text('alt'),
    position: integer('position').notNull().default(0),
    width: integer('width'),
    height: integer('height'),
    isCover: boolean('is_cover').notNull().default(false),
  },
  (t) => [index('property_images_position_idx').on(t.propertyId, t.position)],
);

// --- property_videos ---
// Videos de la propiedad (horizontal / vertical). Se guardan tal cual en disco
// (sin transcodificar) vía lib/storage; la orientación la fija quien sube.
export const propertyVideos = pgTable(
  'property_videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    orientation: videoOrientation('orientation').notNull().default('horizontal'),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('property_videos_prop_idx').on(t.propertyId, t.position)],
);

// --- leads ---
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id').references(() => properties.id),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    message: text('message'),
    type: leadType('type').notNull().default('contacto'),
    preferredAt: timestamp('preferred_at', { withTimezone: true }),
    source: text('source'),
    utm: jsonb('utm'),
    status: leadStatus('status').notNull().default('nuevo'),
    assignedTo: uuid('assigned_to').references(() => users.id),
    consentAt: timestamp('consent_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('leads_status_idx').on(t.status),
    index('leads_property_idx').on(t.propertyId),
    index('leads_assigned_idx').on(t.assignedTo),
  ],
);

// --- lead_events ---
export const leadEvents = pgTable(
  'lead_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    payload: jsonb('payload'),
    userId: uuid('user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('lead_events_lead_idx').on(t.leadId)],
);

// --- webhook_subscriptions ---
export const webhookSubscriptions = pgTable('webhook_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  targetUrl: text('target_url').notNull(),
  secret: text('secret').notNull(),
  events: text('events').array().notNull(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

// --- webhook_deliveries ---
export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => webhookSubscriptions.id, { onDelete: 'cascade' }),
    event: text('event').notNull(),
    payload: jsonb('payload'),
    status: deliveryStatus('status').notNull().default('pendiente'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    responseCode: integer('response_code'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  },
  (t) => [index('webhook_deliveries_subscription_idx').on(t.subscriptionId)],
);

// --- api_keys (webhooks entrantes) ---
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),
  scopes: text('scopes').array().notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- property_events (analítica básica) ---
export const propertyEvents = pgTable(
  'property_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    type: propertyEventType('type').notNull(),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('property_events_prop_idx').on(t.propertyId, t.type, t.createdAt),
  ],
);

// --- marketing_scripts ---
export const marketingScripts = pgTable('marketing_scripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  placement: scriptPlacement('placement').notNull(),
  code: text('code').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

// --- property_segments (segmentación para catálogos de Meta) ---
// Conjunto con nombre de filtros estrictos sobre el catálogo. Cada segmento
// expone un feed CSV público (catálogo de Meta) en una URL con token no
// adivinable; Meta lo jala. Solo incluye propiedades publicadas que casan.
export const propertySegments = pgTable('property_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  feedToken: text('feed_token').notNull().unique(),
  filters: jsonb('filters').notNull(),
  // Formato del feed: 'home_listings' (catálogo inmobiliario de Meta) o
  // 'commerce' (catálogo comercial genérico).
  feedFormat: text('feed_format').notNull().default('home_listings'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});
