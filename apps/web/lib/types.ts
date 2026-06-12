import type {
  LeadStatus,
  LeadType,
  PropertyType,
  PropertyStatus,
  FeaturedLevel,
  UserRole,
  WebhookEvent,
  ApiKeyScope,
} from '@tar/shared';

export type PropertyListItem = {
  id: string;
  slug: string;
  title: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  featured: FeaturedLevel;
  priceSale: string | null;
  currencySale: string | null;
  priceRent: string | null;
  currencyRent: string | null;
  areaM2: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  location: {
    estado: string | null;
    municipio: string | null;
    colonia: string | null;
  } | null;
  cover: { urlWebp: string; urlThumb: string } | null;
  createdAt: string;
  publishedAt: string | null;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// ── Webhooks salientes + API keys entrantes (§5.5) ──
export type WebhookSubscription = {
  id: string;
  name: string;
  targetUrl: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryStatus = 'pendiente' | 'entregado' | 'fallido';

export type WebhookDelivery = {
  id: string;
  subscriptionId: string;
  event: string;
  payload: Record<string, unknown> | null;
  status: DeliveryStatus;
  attempts: number;
  lastError: string | null;
  responseCode: number | null;
  createdAt: string;
  deliveredAt: string | null;
};

export type ApiKey = {
  id: string;
  name: string;
  scopes: ApiKeyScope[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

// Respuesta de creación: incluye la llave en claro (solo una vez).
export type ApiKeyCreated = {
  id: string;
  name: string;
  scopes: ApiKeyScope[];
  key: string;
};

export type Amenity = { id: string; name: string; icon: string | null };

export type PropertyImage = {
  id: string;
  urlWebp: string;
  urlThumb: string;
  alt: string | null;
  position: number;
  isCover: boolean;
  width: number | null;
  height: number | null;
};

// Detalle admin (GET /properties/admin/:id) — incluye geo, imágenes y amenidades.
export type PropertyDetail = PropertyListItem & {
  description: string | null;
  externalRef: string | null;
  halfBathrooms: number | null;
  parking: number | null;
  floor: string | null;
  lotM2: string | null;
  address: string | null;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
  location:
    | (PropertyListItem['location'] & {
        slugEstado?: string | null;
        slugColonia?: string | null;
      })
    | null;
  images: PropertyImage[];
  amenities: Amenity[];
};

// Respuesta paginada estándar de la API (§5): { data, meta }.
export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number };
};

export type LeadEvent = {
  id: string;
  leadId: string;
  type: string;
  payload: Record<string, unknown> | null;
  userId: string | null;
  createdAt: string;
};

export type Lead = {
  id: string;
  propertyId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  type: LeadType;
  preferredAt: string | null;
  source: string | null;
  utm: Record<string, string> | null;
  status: LeadStatus;
  assignedTo: string | null;
  consentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadDetail = Lead & { events: LeadEvent[] };
