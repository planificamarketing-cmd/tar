import type {
  LeadStatus,
  LeadType,
  PropertyType,
  PropertyStatus,
  FeaturedLevel,
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
