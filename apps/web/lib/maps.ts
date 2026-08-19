// Capa base del mapa (PRD §6.2, §7.1, §7.3). El clustering se calcula en cliente
// con supercluster a partir de los puntos que devuelve `GET /properties/map` para
// el bbox visible.
//
// PROVEEDOR — desviación documentada del PRD §7.0: el PRD contrataba Google Maps
// Platform, pero el cliente decidió (2026-08-03) no abrir cuenta de facturación
// en Google. Se sustituye por **Leaflet** (librería open-source, sin llave) con
// mosaicos de CARTO sobre datos de OpenStreetMap. Beneficios: sin llave, sin
// tarjeta, sin cuota que vigilar, y encaja con la regla de "solo dependencias
// open-source / sin vendor lock-in" del proyecto.
//
// El proveedor de mosaicos es CONFIGURABLE por entorno: si algún día se quiere
// cambiar (MapTiler, Stadia, servidor propio) se ajustan dos variables, sin tocar
// código. La atribución es obligatoria: OpenStreetMap la exige por licencia.
import { apiFetch } from './api';
import type { FeaturedLevel, PropertyType } from '@tar/shared';
import type { PublicPropertyFilters, Operation } from './public';
import { isPerM2Price } from './public';
import type { PropertyDetail } from './types';

// Estilo claro y sobrio ("voyager"), que no compite con los marcadores de marca.
// `{r}` sirve las teselas en alta densidad (retina) cuando el navegador lo pide.
export const MAP_TILES_URL =
  process.env.NEXT_PUBLIC_MAP_TILES_URL ||
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export const MAP_TILES_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILES_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const MAP_MAX_ZOOM = 19;

// Centro por defecto: CDMX. Solo se usa cuando no hay ningún punto que encuadrar.
export const DEFAULT_CENTER: [number, number] = [19.4326, -99.1332];
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
  // Campos enriquecidos (§7.1 vista mapa split): alimentan las tarjetas del panel
  // de lista lateral sin una segunda petición. Opcionales por compatibilidad.
  operation?: Operation; // operación a la que corresponde `price` (para el formato /m²)
  title?: string;
  propertyType?: PropertyType;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: string | number | null;
  location?: { colonia: string | null; municipio: string | null; estado: string | null } | null;
  cover?: { urlWebp: string; urlThumb: string } | null;
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
  operation?: Operation,
): string {
  const n = typeof price === 'number' ? price : Number(price);
  if (price == null || !Number.isFinite(n) || n === 0) return 'Consultar';
  const usd = (currency ?? 'MXN') === 'USD';
  const prefix = usd ? 'US$' : '$';
  // Tasa por m² (parte del inventario comercial): se marca con su unidad.
  if (operation && isPerM2Price(n, operation)) return `${prefix}${Math.round(n)}/m²`;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${prefix}${m.toFixed(m % 1 === 0 || m >= 10 ? 0 : 1)}${usd ? 'M' : ' MDP'}`;
  }
  if (n >= 1_000) return `${prefix}${Math.round(n / 1_000)}k`;
  return `${prefix}${Math.round(n)}`;
}
