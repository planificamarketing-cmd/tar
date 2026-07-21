import { env } from '../env';
import { logger } from './logger';

// Revalidación on-demand del sitio público (Next.js ISR). Cuando una propiedad se
// publica, despublica o cambia de estatus, se avisa al sitio para que refresque
// las rutas afectadas de inmediato (sin esperar la ventana de ISR por tiempo).
//
// Best-effort por diseño: si no hay secreto configurado, si el sitio no responde
// o tarda, se registra y se continúa — NUNCA bloquea ni rompe la operación sobre
// la propiedad. Protegido por `REVALIDATE_SECRET` (secreto compartido web↔api).

// Rutas del sitio afectadas por un cambio de propiedad: el listado, la home y el
// sitemap siempre; la ficha solo si se conoce el slug.
export function propertyRevalidatePaths(slug?: string | null): string[] {
  const paths = ['/', '/propiedades', '/sitemap.xml'];
  if (slug) paths.push(`/propiedades/${slug}`);
  return paths;
}

export async function revalidatePublicSite(paths: string[]): Promise<void> {
  if (!env.REVALIDATE_SECRET) return; // revalidación desactivada
  if (paths.length === 0) return;
  const url = `${env.PUBLIC_SITE_URL}/revalidate`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': env.REVALIDATE_SECRET,
      },
      body: JSON.stringify({ paths }),
      // No colgar la operación de la propiedad si el sitio tarda en responder.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      logger.warn({ url, status: res.status, paths }, 'revalidación del sitio falló');
    } else {
      logger.info({ paths }, 'sitio público revalidado');
    }
  } catch (err) {
    logger.warn({ url, err }, 'revalidación del sitio no disponible');
  }
}
