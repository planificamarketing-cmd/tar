import { expect, type APIRequestContext, type Locator } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://localhost:4000';

export type PublicProperty = {
  id: string;
  slug: string;
  title: string;
  isExclusive: boolean;
  isRemate: boolean;
  featured: 'normal' | 'destacada' | 'premium';
  location: { colonia: string | null; municipio: string | null; estado: string | null };
};

// Las pruebas trabajan sobre el inventario REAL que responde la API (sembrado con
// `pnpm db:seed`), no sobre datos inventados: así comprueban el mismo camino que ve
// un visitante.
export async function fetchPublicProperties(
  request: APIRequestContext,
  query = 'limit=50',
): Promise<PublicProperty[]> {
  const res = await request.get(`${API}/api/v1/properties?${query}`);
  if (!res.ok()) throw new Error(`La API no respondió el listado público (${res.status()})`);
  return (await res.json()).data as PublicProperty[];
}

export async function fetchProperty(
  request: APIRequestContext,
  slug: string,
): Promise<Record<string, unknown>> {
  const res = await request.get(`${API}/api/v1/properties/${slug}`);
  if (!res.ok()) throw new Error(`La API no respondió la ficha ${slug} (${res.status()})`);
  return (await res.json()).data as Record<string, unknown>;
}

// Carpeta donde se dejan las capturas de evidencia (fuera del repo por defecto).
export const SHOTS = process.env.E2E_SHOTS_DIR ?? 'test-results/capturas';

// Espera a que TODOS los mosaicos pedidos estén pintados (no solo el primero): si
// el proveedor fallara, el mapa saldría gris y la prueba lo detectaría. Se compara
// contra el total pedido en vez de un número fijo, porque el móvil necesita menos
// mosaicos que el escritorio.
export async function esperarMosaicos(mapa: Locator): Promise<void> {
  await expect
    .poll(
      async () => {
        const total = await mapa.locator('.leaflet-tile').count();
        const listos = await mapa.locator('.leaflet-tile-loaded').count();
        return total > 0 && listos === total ? 'listos' : `${listos}/${total}`;
      },
      { timeout: 20_000 },
    )
    .toBe('listos');
}
