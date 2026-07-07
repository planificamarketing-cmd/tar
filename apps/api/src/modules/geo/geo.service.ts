import { isGoogleMapsUrl, parseGoogleMapsUrl, type ParsedMapsLocation } from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';

// Expande un enlace de Google Maps y extrae la ubicación. Los enlaces cortos
// (maps.app.goo.gl, goo.gl/maps) no traen coordenadas ni dirección: se sigue la
// redirección del lado del servidor hasta la URL "larga" que sí las contiene, y se
// parsea con la utilidad compartida (sin API de Google).
//
// Seguridad: solo se siguen enlaces de hosts de Google Maps (anti-SSRF), con
// timeout y sin descargar el cuerpo de la respuesta.
export async function resolveMapsUrl(url: string): Promise<ParsedMapsLocation> {
  if (!isGoogleMapsUrl(url)) {
    throw new ApiError(422, 'INVALID_MAPS_URL', 'El enlace no es de Google Maps.');
  }

  // Parseo directo (enlaces largos ya traen todo).
  const direct = parseGoogleMapsUrl(url);
  if (direct.lat != null || direct.address) return direct;

  // Enlace corto: seguir la redirección para obtener la URL final.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
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
      },
    });
    // No necesitamos el cuerpo; la información está en la URL final.
    await res.body?.cancel().catch(() => undefined);
    const finalUrl = res.url || url;
    const parsed = parseGoogleMapsUrl(finalUrl);
    if (parsed.lat == null && !parsed.address) {
      throw new ApiError(
        422,
        'MAPS_NOT_RESOLVED',
        'No se pudo extraer la ubicación del enlace. Pega el enlace largo desde la barra del navegador.',
      );
    }
    return parsed;
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
