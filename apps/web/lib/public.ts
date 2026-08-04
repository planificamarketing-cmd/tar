// Capa de datos del sitio público (Fase B, §7.1). Todo va contra los endpoints
// PÚBLICOS de la API (sin auth): lista/detalle de propiedades, amenidades,
// catálogo de ubicaciones y scripts de marketing. Segura en Server Components
// (apiFetch con auth:false no toca `window`).
import type { PropertyType } from '@tar/shared';
import { apiFetch } from './api';
import type {
  Amenity,
  LocationOption,
  Paginated,
  PropertyDetail,
  PropertyListItem,
} from './types';

// ── Autocompletado de ubicación (helpers puros, server-safe) ──────────────────
// Normaliza acentos/mayúsculas para que "cuauhtemoc" encuentre "Cuauhtémoc".
export const normText = (s: string) =>
  (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export type Suggestion = { label: string; kind: 'Colonia' | 'Municipio' | 'Estado'; n: number };

// Deriva sugerencias del catálogo de ubicaciones (colonias, municipios/alcaldías,
// estados/zonas), más frecuentes primero. Vive aquí (no en el componente client)
// para poder llamarse desde Server Components.
export function buildSuggestions(locations: LocationOption[]): Suggestion[] {
  const map = new Map<string, Suggestion>();
  const add = (label: string | null, kind: Suggestion['kind']) => {
    if (!label) return;
    const k = kind + '|' + normText(label);
    if (!map.has(k)) map.set(k, { label: label.trim(), kind, n: 0 });
    map.get(k)!.n += 1;
  };
  for (const l of locations) {
    add(l.colonia, 'Colonia');
    add(l.municipio, 'Municipio');
    add(l.estado, 'Estado');
  }
  return [...map.values()].sort((a, b) => b.n - a.n);
}

// ── Tipos públicos ────────────────────────────────────────────────────────────
export type Operation = 'venta' | 'renta';

export type PublicPropertyFilters = {
  page?: number;
  limit?: number;
  operation?: Operation;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  minArea?: number;
  maxArea?: number;
  colonia?: string;
  amenities?: string[];
  q?: string;
  sort?: 'relevancia' | 'precio_asc' | 'precio_desc' | 'recientes';
};

export type PublicScripts = {
  head: { id: string; name: string; code: string }[];
  body: { id: string; name: string; code: string }[];
  footer: { id: string; name: string; code: string }[];
};

// Revalidación ISR por defecto para el contenido público (1 h). Se puede acortar
// por llamada. Los datos cambian al publicar en el backoffice; 1 h es suficiente.
const REVALIDATE = 3600;

function toQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(','));
    } else {
      sp.set(k, String(v));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ── Fetchers ──────────────────────────────────────────────────────────────────
export function fetchProperties(
  filters: PublicPropertyFilters = {},
  revalidate = REVALIDATE,
): Promise<Paginated<PropertyListItem>> {
  return apiFetch<Paginated<PropertyListItem>>(`/properties${toQuery(filters)}`, {
    auth: false,
    next: { revalidate },
  } as RequestInit);
}

export async function fetchProperty(
  slug: string,
  revalidate = REVALIDATE,
): Promise<PropertyDetail | null> {
  try {
    const { data } = await apiFetch<{ data: PropertyDetail }>(
      `/properties/${encodeURIComponent(slug)}`,
      { auth: false, next: { revalidate } } as RequestInit,
    );
    return data;
  } catch {
    return null;
  }
}

// Variantes tolerantes a fallo, para las páginas que Next PRERRENDERIZA en el
// build (`/`, `/nosotros`). Durante `next build` —y en particular al construir
// la imagen de Docker (§11)— la API todavía no existe: si el fetch tirara, el
// build entero fallaría y el despliegue quedaría bloqueado. Con esto la página
// se genera vacía y la ISR la rellena en la primera revalidación.
// Las páginas dinámicas (`/propiedades`) siguen usando las versiones estrictas:
// ahí un fallo de la API sí debe verse, y su error boundary lo maneja.
export async function fetchPropertiesSafe(
  filters: PublicPropertyFilters = {},
  revalidate = REVALIDATE,
): Promise<Paginated<PropertyListItem>> {
  try {
    return await fetchProperties(filters, revalidate);
  } catch {
    return { data: [], meta: { page: 1, limit: filters.limit ?? 0, total: 0 } };
  }
}

export async function fetchLocationsSafe(): Promise<LocationOption[]> {
  try {
    return await fetchLocations();
  } catch {
    return [];
  }
}

export async function fetchAmenities(): Promise<Amenity[]> {
  const { data } = await apiFetch<{ data: Amenity[] }>('/amenities', {
    auth: false,
    next: { revalidate: REVALIDATE },
  } as RequestInit);
  return data;
}

export async function fetchLocations(): Promise<LocationOption[]> {
  const { data } = await apiFetch<{ data: LocationOption[] }>('/locations', {
    auth: false,
    next: { revalidate: REVALIDATE },
  } as RequestInit);
  return data;
}

export async function fetchPublicScripts(): Promise<PublicScripts> {
  try {
    const { data } = await apiFetch<{ data: PublicScripts }>('/scripts/public', {
      auth: false,
      // Los scripts deben reflejar cambios pronto: revalidación corta.
      next: { revalidate: 300 },
    } as RequestInit);
    return data;
  } catch {
    return { head: [], body: [], footer: [] };
  }
}

// ── Formato de precio (estilo prototipo v3) ───────────────────────────────────
// Regla del proyecto: mostrar SIEMPRE moneda original, nunca convertir. Rentas
// en $/mes; ventas grandes en MXN se compactan a "MDP" (como el prototipo).
function money(n: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPricePublic(
  price: string | number | null | undefined,
  currency: string | null | undefined,
  operation: Operation,
  opts: { compact?: boolean } = {},
): string {
  const n = typeof price === 'number' ? price : Number(price);
  if (price == null || Number.isNaN(n) || n === 0) return 'Precio a consultar';
  const cur = currency ?? 'MXN';
  if (operation === 'renta') return `${money(n, cur)}/mes`;
  if ((opts.compact ?? true) && cur === 'MXN' && n >= 1_000_000) {
    const mdp = n / 1_000_000;
    return `$${mdp.toFixed(mdp % 1 === 0 ? 0 : 1)} MDP`;
  }
  return money(n, cur);
}

// Operación principal de la propiedad: venta si tiene precio de venta, si no renta
// (el inventario suele ser una u otra). Se usa para el badge y el precio.
export function primaryOperation(p: {
  priceSale: string | null;
  priceRent: string | null;
}): Operation {
  return p.priceSale != null && Number(p.priceSale) > 0 ? 'venta' : 'renta';
}

// Precio a mostrar de una propiedad (elige venta/renta y formatea).
export function propertyPrice(
  p: {
    priceSale: string | null;
    currencySale: string | null;
    priceRent: string | null;
    currencyRent: string | null;
  },
  opts: { compact?: boolean } = {},
): string {
  const op = primaryOperation(p);
  return op === 'venta'
    ? formatPricePublic(p.priceSale, p.currencySale, 'venta', opts)
    : formatPricePublic(p.priceRent, p.currencyRent, 'renta', opts);
}

// Etiqueta corta de ubicación: "Colonia, Municipio" (lo que exista).
export function locationLabel(
  loc: { colonia: string | null; municipio: string | null; estado: string | null } | null,
): string {
  if (!loc) return 'México';
  return [loc.colonia, loc.municipio].filter(Boolean).join(', ') || loc.estado || 'México';
}

// Dirección completa para mostrar (ficha, mapa). Une la calle con
// "Colonia, Municipio" SIN repetirlas: en el inventario importado el campo
// `address` ya suele traer la colonia, y concatenar a ciegas producía cosas como
// "Roma Norte, Cuauhtémoc, Roma Norte, Cuauhtémoc".
export function displayAddress(
  address: string | null | undefined,
  location: { colonia: string | null; municipio: string | null; estado: string | null } | null,
): string {
  const loc = locationLabel(location);
  const addr = (address ?? '').trim();
  if (!addr) return loc;
  if (!loc || loc === 'México') return addr;
  return normText(addr).includes(normText(loc)) ? addr : `${addr}, ${loc}`;
}

// Etiqueta de tipo en SINGULAR (para el pie de la tarjeta / ficha), como el
// prototipo (TYPE_LABELS). El catálogo plural vive en lib/format (filtros).
export const TYPE_LABEL_SINGULAR: Record<PropertyType, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  oficina: 'Oficina',
  local_comercial: 'Local comercial',
  bodega_industrial: 'Bodega industrial',
  terreno_industrial: 'Terreno industrial',
  edificio: 'Edificio',
  terreno: 'Terreno',
};
