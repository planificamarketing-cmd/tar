import type { MetadataRoute } from 'next';
import { fetchProperties } from '@/lib/public';

const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const revalidate = 3600;

// Sitemap dinámico: páginas estáticas + todas las propiedades disponibles.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/propiedades`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/nosotros`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contacto`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/aviso-privacidad`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const properties: MetadataRoute.Sitemap = [];
  try {
    // Recorre las páginas del listado público (límite máximo 50 por página).
    for (let page = 1; page <= 40; page++) {
      const { data, meta } = await fetchProperties({ page, limit: 50, sort: 'recientes' }, 3600);
      for (const p of data) {
        properties.push({
          url: `${SITE_URL}/propiedades/${p.slug}`,
          lastModified: p.publishedAt ? new Date(p.publishedAt) : undefined,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
      if (page * 50 >= meta.total || data.length === 0) break;
    }
  } catch {
    // Si la API no responde al generar el sitemap, se entregan solo las estáticas.
  }

  return [...staticPages, ...properties];
}
