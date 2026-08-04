// Capa base del mapa (PRD §6.2, §7.1, §7.3). El proveedor es Google Maps
// Platform (contractual); el clustering se calcula en cliente con supercluster a
// partir de los puntos que devuelve `GET /properties/map` para el bbox visible.
//
// La API key es del cliente y se restringe por referrer HTTP al dominio final
// (§ nota de despliegue del PRD). Mientras no exista, `mapsEnabled` es false y
// todo lo que dependa del mapa se degrada a un aviso —nunca a un error—: el
// sitio sigue siendo 100% usable por el listado y el buscador de texto.
import { apiFetch } from './api';
import type { FeaturedLevel } from '@tar/shared';
import type { PublicPropertyFilters } from './public';
import type { PropertyDetail } from './types';

export const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// Map ID de Google Cloud: lo exige `AdvancedMarker` (marcadores HTML, necesarios
// para los *price-pill*). `DEMO_MAP_ID` funciona para desarrollo; en producción
// se fija el Map ID de la cuenta del cliente con el estilo de marca aplicado.
export const MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

export const mapsEnabled = MAPS_API_KEY.length > 0;

// Centro por defecto: CDMX. Solo se usa cuando no hay ningún punto que encuadrar.
export const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 };
export const DEFAULT_ZOOM = 11;

// Payload ligero de `/properties/map` (§5.2). `price`/`currency` ya vienen en la
// moneda ORIGINAL y para la operación filtrada — no se convierten nunca.
export type MapPoint = {
  id: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  price: string | number | null;
  currency: string | null;
  featured: FeaturedLevel;
};

export type Bbox = { minLng: number; minLat: number; maxLng: number; maxLat: number };

export const bboxToParam = (b: Bbox): string =>
  [b.minLng, b.minLat, b.maxLng, b.maxLat].map((n) => n.toFixed(6)).join(',');

// El mapa no pagina ni ordena: recorta el área con el bbox visible y comparte
// el resto de filtros con el listado.
export type MapSearchFilters = Omit<PublicPropertyFilters, 'page' | 'limit' | 'sort'>;

// Puntos del mapa para el bbox visible + los filtros activos del listado.
// `no-store`: la vista mapa se refresca al desplazarse, no debe cachearse por bbox.
export async function fetchMapPoints(
  filters: MapSearchFilters = {},
  bbox?: Bbox,
  signal?: AbortSignal,
): Promise<MapPoint[]> {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  if (bbox) sp.set('bbox', bboxToParam(bbox));
  const qs = sp.toString();
  const { data } = await apiFetch<{ data: MapPoint[] }>(
    `/properties/map${qs ? `?${qs}` : ''}`,
    { auth: false, cache: 'no-store', ...(signal ? { signal } : {}) } as RequestInit,
  );
  // Defensa: `geo` es opcional en borrador; el endpoint ya filtra por NOT NULL,
  // pero un punto sin coordenadas rompería supercluster.
  return data.filter((p): p is MapPoint => p.lat != null && p.lng != null);
}

// Vista previa al hacer clic en un pin (§7.3: "al clic en pin muestra
// miniatura/vista previa"). El payload del mapa es deliberadamente ligero, así
// que la ficha resumida se pide bajo demanda y se memoriza en el componente.
export type MapPreview = Pick<
  PropertyDetail,
  | 'id'
  | 'slug'
  | 'title'
  | 'propertyType'
  | 'featured'
  | 'isRemate'
  | 'priceSale'
  | 'currencySale'
  | 'priceRent'
  | 'currencyRent'
  | 'areaM2'
  | 'bedrooms'
  | 'bathrooms'
  | 'location'
  | 'cover'
>;

export async function fetchMapPreview(slug: string): Promise<MapPreview> {
  const { data } = await apiFetch<{ data: MapPreview }>(
    `/properties/${encodeURIComponent(slug)}`,
    { auth: false } as RequestInit,
  );
  return data;
}

// Precio corto para el *price-pill* del marcador: debe caber en ~90px.
// "$4.2 MDP", "$28k/mes", "$450k". Moneda original siempre (regla del proyecto).
export function pillPrice(
  price: string | number | null | undefined,
  currency: string | null | undefined,
): string {
  const n = typeof price === 'number' ? price : Number(price);
  if (price == null || !Number.isFinite(n) || n === 0) return 'Consultar';
  const usd = (currency ?? 'MXN') === 'USD';
  const prefix = usd ? 'US$' : '$';
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${prefix}${m.toFixed(m % 1 === 0 || m >= 10 ? 0 : 1)}${usd ? 'M' : ' MDP'}`;
  }
  if (n >= 1_000) return `${prefix}${Math.round(n / 1_000)}k`;
  return `${prefix}${Math.round(n)}`;
}
