import type { APIRequestContext } from '@playwright/test';

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
