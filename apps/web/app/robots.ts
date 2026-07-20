import type { MetadataRoute } from 'next';

const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';

// robots.txt dinámico: indexar el sitio público, bloquear el panel y la API.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
