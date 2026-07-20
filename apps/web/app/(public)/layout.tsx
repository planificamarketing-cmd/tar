import type { Metadata } from 'next';
import { SiteHeader } from '@/components/public/site-header';
import { SiteFooter } from '@/components/public/site-footer';
import { MarketingScripts } from '@/components/public/marketing-scripts';
import { fetchPublicScripts } from '@/lib/public';

const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TAR Internacional — Grupo Inmobiliario',
    template: '%s · TAR Internacional',
  },
  description:
    'Portal inmobiliario TAR Internacional. Departamentos, oficinas, locales y bodegas en venta y renta en las mejores zonas de México, con más de 60 años de experiencia.',
  openGraph: {
    type: 'website',
    siteName: 'TAR Internacional',
    locale: 'es_MX',
  },
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const scripts = await fetchPublicScripts();
  return (
    <>
      <MarketingScripts scripts={scripts} />
      <SiteHeader />
      <main className="min-h-screen">{children}</main>
      <SiteFooter />
    </>
  );
}
