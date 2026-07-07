import { z } from 'zod';

// Utilidades para autocompletar la ubicación a partir de un enlace de Google Maps.
// Todo esto funciona SIN la API de Google (pendiente del cliente): parsea lo que el
// propio enlace ya trae en la URL. Los enlaces "largos" del navegador incluyen el
// segmento `/place/<dirección>/@lat,lng` con la dirección completa; los enlaces
// cortos (maps.app.goo.gl, goo.gl/maps) no traen nada y el servidor los expande
// antes de parsear (ver apps/api/.../geo).

export type ParsedMapsLocation = {
  lat?: number;
  lng?: number;
  address?: string;
  colonia?: string;
  municipio?: string;
  estado?: string;
  postalCode?: string;
};

// Hosts de Google Maps que aceptamos (y que el servidor puede expandir). Evita que
// el resolvedor del servidor siga enlaces arbitrarios (SSRF).
const MAPS_HOSTS = [
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
  'g.co',
  'maps.googleapis.com',
];

// Host de una URL sin depender del global `URL` (este módulo es isomorfo y se
// typechequea sin lib DOM).
function hostOf(text: string): string | null {
  const m = text.trim().match(/^https?:\/\/([^/?#]+)/i);
  if (!m || !m[1]) return null;
  return m[1].toLowerCase().replace(/:\d+$/, '');
}

export function isGoogleMapsUrl(text: string): boolean {
  const host = hostOf(text);
  if (!host) return false;
  return MAPS_HOSTS.some((h) => host === h || host.endsWith('.' + h));
}

// Un enlace corto no lleva coordenadas ni dirección: hay que expandirlo (seguir la
// redirección) del lado del servidor antes de poder parsearlo.
export function isShortMapsUrl(text: string): boolean {
  const host = hostOf(text);
  if (!host) return false;
  return (
    host === 'maps.app.goo.gl' ||
    host === 'goo.gl' ||
    host === 'g.co' ||
    host.endsWith('.goo.gl')
  );
}

// Abreviaturas de estado que usa Google → nombre canónico (coincide con el catálogo
// de ubicaciones del portal). Cubre las variantes más comunes.
const STATE_ALIASES: Record<string, string> = {
  cdmx: 'Ciudad de México',
  'ciudad de mexico': 'Ciudad de México',
  df: 'Ciudad de México',
  'd.f.': 'Ciudad de México',
  edomex: 'Estado de México',
  'estado de mexico': 'Estado de México',
  'edo. de mexico': 'Estado de México',
  'mex.': 'Estado de México',
  jal: 'Jalisco',
  'jal.': 'Jalisco',
  'n.l.': 'Nuevo León',
  nl: 'Nuevo León',
  'q.r.': 'Quintana Roo',
  qroo: 'Quintana Roo',
  'qro.': 'Querétaro',
  qro: 'Querétaro',
  'b.c.': 'Baja California',
  'b.c.s.': 'Baja California Sur',
  gto: 'Guanajuato',
  'gto.': 'Guanajuato',
  pue: 'Puebla',
  'pue.': 'Puebla',
  ver: 'Veracruz',
  'ver.': 'Veracruz',
  yuc: 'Yucatán',
  'yuc.': 'Yucatán',
  sin: 'Sinaloa',
  'sin.': 'Sinaloa',
  son: 'Sonora',
  'son.': 'Sonora',
  chih: 'Chihuahua',
  'chih.': 'Chihuahua',
  coah: 'Coahuila',
  'coah.': 'Coahuila',
  mich: 'Michoacán',
  'mich.': 'Michoacán',
  gro: 'Guerrero',
  'gro.': 'Guerrero',
  oax: 'Oaxaca',
  'oax.': 'Oaxaca',
  chis: 'Chiapas',
  'chis.': 'Chiapas',
  tamps: 'Tamaulipas',
  'tamps.': 'Tamaulipas',
  hgo: 'Hidalgo',
  'hgo.': 'Hidalgo',
  mor: 'Morelos',
  'mor.': 'Morelos',
  ags: 'Aguascalientes',
  'ags.': 'Aguascalientes',
  slp: 'San Luis Potosí',
  'slp.': 'San Luis Potosí',
  tab: 'Tabasco',
  'tab.': 'Tabasco',
  camp: 'Campeche',
  'camp.': 'Campeche',
  col: 'Colima',
  'col.': 'Colima',
  dgo: 'Durango',
  'dgo.': 'Durango',
  nay: 'Nayarit',
  'nay.': 'Nayarit',
  zac: 'Zacatecas',
  'zac.': 'Zacatecas',
  tlax: 'Tlaxcala',
  'tlax.': 'Tlaxcala',
};

function canonicalState(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return STATE_ALIASES[key] ?? raw.trim();
}

function isCountry(part: string): boolean {
  return /^m[eé]xico$/i.test(part.trim());
}

// Coordenadas: se prefiere el pin real del lugar (`!3d..!4d..`), luego el centro del
// mapa (`@lat,lng`) y por último un `q=lat,lng`.
function parseCoords(text: string): { lat: number; lng: number } | null {
  const pin = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const at = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const q = text.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
  const generic = text.match(/(-?\d{1,3}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/);
  const m = pin ?? at ?? q ?? generic;
  if (!m || m[1] == null || m[2] == null) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

// Dirección: del segmento `/place/<texto>/` de la URL. Google la codifica con `+`
// por espacios y `%XX`. Formato mexicano típico (separado por comas):
//   "Calle 123, Colonia, Municipio, 06700 Ciudad, ESTADO, México"
function parsePlace(text: string): Omit<ParsedMapsLocation, 'lat' | 'lng'> {
  const out: Omit<ParsedMapsLocation, 'lat' | 'lng'> = {};
  const seg = text.match(/\/place\/([^/@]+)/);
  if (!seg || !seg[1]) return out;
  const raw = seg[1].replace(/\+/g, ' ');

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  // Un "place" que en realidad son coordenadas ("19.42,-99.16") no es una dirección.
  if (/^-?\d+\.\d+,-?\d+\.\d+$/.test(decoded.trim())) return out;

  let parts = decoded
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && isCountry(last)) parts = parts.slice(0, -1);
  if (!parts.length) return out;

  out.address = parts[0];

  // Parte que contiene el código postal de 5 dígitos ("06700 Ciudad de México").
  const cpIdx = parts.findIndex((p) => /\b\d{5}\b/.test(p));
  if (cpIdx >= 0) {
    const cp = parts[cpIdx]?.match(/\b(\d{5})\b/);
    if (cp?.[1]) out.postalCode = cp[1];
    const estado = parts[cpIdx + 1];
    if (estado) out.estado = canonicalState(estado);
    if (cpIdx - 1 >= 1) out.municipio = parts[cpIdx - 1];
    if (cpIdx - 2 >= 1) out.colonia = parts[cpIdx - 2];
  } else if (parts.length >= 2) {
    // Sin CP: heurística mínima. address = 1ª parte; última = estado si parece uno.
    const tail = parts[parts.length - 1];
    if (tail) out.estado = canonicalState(tail);
    if (parts.length >= 3) out.municipio = parts[parts.length - 2];
    if (parts.length >= 4) out.colonia = parts[1];
  }
  return out;
}

// Parser principal: combina coordenadas + dirección de una URL/enlace de Google Maps.
export function parseGoogleMapsUrl(text: string): ParsedMapsLocation {
  const t = text.trim();
  const coords = parseCoords(t);
  const place = parsePlace(t);
  return {
    ...place,
    ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
  };
}

// Cuerpo del endpoint que expande enlaces cortos del lado del servidor.
export const expandMapsSchema = z.object({
  url: z.string().trim().url(),
});
export type ExpandMapsInput = z.infer<typeof expandMapsSchema>;
