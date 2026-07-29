import { isGoogleMapsUrl, parseGoogleMapsUrl, type ParsedMapsLocation } from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';

// Expande un enlace de Google Maps y extrae la ubicación. Los enlaces cortos
// (maps.app.goo.gl, goo.gl/maps) no traen coordenadas ni dirección: se sigue la
// redirección del lado del servidor hasta la URL "larga" que sí las contiene, y se
// parsea con la utilidad compartida (sin API de Google).
//
// Seguridad: solo se siguen enlaces de hosts de Google Maps (anti-SSRF), con
// timeout y tamaño de cuerpo acotado.

// Los enlaces cortos modernos (maps.app.goo.gl) no siempre redirigen con un 3xx a la
// URL larga: a veces devuelven una página intermedia (consentimiento / interstitial)
// cuyo destino real va DENTRO del HTML, no en `res.url`. Aquí se rescata ese destino
// (o, en su defecto, las coordenadas del pin) del cuerpo de la respuesta.
function locationFromHtml(html: string): ParsedMapsLocation | null {
  // Desescapa las secuencias que Google usa dentro de JSON/JS embebido para que las
  // URLs de destino queden legibles (= → "=", & → "&", \/ → "/", &amp; → "&").
  const text = html
    .replace(/\\u003d/gi, '=')
    .replace(/\\u0026/gi, '&')
    .replace(/\\\//g, '/')
    .replace(/&amp;/gi, '&');

  // 1) URLs de Google Maps embebidas: el destino del interstitial suele venir como
  //    parámetro `continue=`/`url=`/`q=` (página de consentimiento) o como una URL
  //    `/maps/place/...` completa dentro del HTML. Parsearlas da coords + dirección.
  const candidates: string[] = [];
  for (const m of text.matchAll(
    /(?:continue|url|q|link)=(https?(?::|%3A)[^"'&\s\\<>]+)/gi,
  )) {
    if (!m[1]) continue;
    try {
      candidates.push(decodeURIComponent(m[1]));
    } catch {
      candidates.push(m[1]);
    }
  }
  for (const m of text.matchAll(
    /https?:\/\/(?:www\.|maps\.)?google\.[a-z.]+\/maps\/[^"'\s\\<>]+/gi,
  )) {
    candidates.push(m[0]);
  }
  for (const c of candidates) {
    if (!isGoogleMapsUrl(c)) continue;
    const parsed = parseGoogleMapsUrl(c);
    if (parsed.lat != null || parsed.address) return parsed;
  }

  // 2) Coordenadas del pin sueltas en el HTML: `!3d<lat>!4d<lng>` o `@lat,lng`. Son los
  //    marcadores fiables (evitamos números arbitrarios de la página). Sin dirección.
  const pin = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const at = text.match(/[@/](-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
  const m = pin ?? at;
  if (m && m[1] != null && m[2] != null) {
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (
      !Number.isNaN(lat) &&
      !Number.isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      return { lat, lng };
    }
  }
  return null;
}

export async function resolveMapsUrl(url: string): Promise<ParsedMapsLocation> {
  if (!isGoogleMapsUrl(url)) {
    throw new ApiError(422, 'INVALID_MAPS_URL', 'El enlace no es de Google Maps.');
  }

  // Parseo directo (enlaces largos ya traen todo).
  const direct = parseGoogleMapsUrl(url);
  if (direct.lat != null || direct.address) return direct;

  // Enlace corto: seguir la redirección y, si hace falta, leer el HTML final.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Sin un UA "de navegador" Google puede devolver una página de consentimiento
        // sin la URL del lugar.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept-Language': 'es-MX,es;q=0.9',
      },
    });

    // (a) La URL final tras las redirecciones: el caso feliz (`/place/…/@lat,lng`).
    const fromUrl = parseGoogleMapsUrl(res.url || url);
    if (fromUrl.lat != null || fromUrl.address) return fromUrl;

    // (b) Si la URL final no trae nada (interstitial/consent), se busca en el HTML.
    const body = (await res.text()).slice(0, 800_000);
    const fromBody = locationFromHtml(body);
    if (fromBody && (fromBody.lat != null || fromBody.address)) return fromBody;

    throw new ApiError(
      422,
      'MAPS_NOT_RESOLVED',
      'No se pudo extraer la ubicación del enlace. Abre el enlace en Google Maps y pega el enlace largo de la barra del navegador (el que incluye /place/… y @lat,lng).',
    );
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      502,
      'MAPS_FETCH_FAILED',
      'No se pudo resolver el enlace de Google Maps. Inténtalo de nuevo o pega el enlace largo.',
    );
  } finally {
    clearTimeout(timeout);
  }
}
