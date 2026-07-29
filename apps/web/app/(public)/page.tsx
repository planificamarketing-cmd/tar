import Image from 'next/image';
import Link from 'next/link';
import { PropertyCard } from '@/components/public/property-card';
import { HeroSearch } from '@/components/public/hero-search';
import { Faq } from '@/components/public/faq';
import { IChevR } from '@/components/public/icons';
import { fetchProperties, fetchLocations, buildSuggestions } from '@/lib/public';

const HERO_TYPES: [string, string][] = [
  ['departamento', 'Departamentos'],
  ['oficina', 'Oficinas'],
  ['local_comercial', 'Locales'],
  ['bodega_industrial', 'Bodegas'],
];

const EXPLORE: { type: string; label: string; desc: string }[] = [
  { type: 'departamento', label: 'Departamentos', desc: 'Espacios residenciales listos para habitar.' },
  { type: 'oficina', label: 'Oficinas', desc: 'Corporativos y espacios de trabajo.' },
  { type: 'local_comercial', label: 'Locales', desc: 'Puntos comerciales en zonas de alto flujo.' },
  { type: 'bodega_industrial', label: 'Bodegas', desc: 'Naves y espacios industriales.' },
];

export default async function HomePage() {
  // Revalida seguido (60 s) para que un cambio de destaque/remate o una publicación
  // se refleje pronto en la portada, sin depender solo de la revalidación on-demand.
  const [featured, recent, locations] = await Promise.all([
    fetchProperties({ sort: 'relevancia', limit: 6 }, 60),
    fetchProperties({ sort: 'recientes', limit: 6 }, 60),
    fetchLocations(),
  ]);

  const suggestions = buildSuggestions(locations);
  const total = featured.meta.total;
  const heroImg = featured.data.find((p) => p.cover)?.cover?.urlWebp;

  // JSON-LD de sitio: identifica la organización y habilita el sitelinks searchbox
  // de Google. Sin teléfono/dirección aún (datos del cliente pendientes de confirmar).
  const siteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateAgent',
        '@id': `${siteUrl}/#organization`,
        name: 'TAR Internacional',
        url: siteUrl,
        logo: `${siteUrl}/brand/tar-logo.webp`,
        description:
          'Grupo inmobiliario con más de 60 años de experiencia. Departamentos, oficinas, locales y bodegas en venta y renta en las mejores zonas de México.',
        areaServed: 'MX',
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'TAR Internacional',
        publisher: { '@id': `${siteUrl}/#organization` },
        inLanguage: 'es-MX',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/propiedades?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── HERO ── */}
      <section className="bg-canvas px-4 pb-6 pt-[84px] lg:px-6 lg:pb-7 lg:pt-[100px]">
        <div className="mx-auto max-w-[1400px]">
          <div className="relative flex min-h-[82vh] flex-col overflow-hidden rounded-[24px] lg:min-h-[90vh]">
            {/* Fondo */}
            <div className="absolute inset-0 bg-navy">
              {heroImg && (
                <Image src={heroImg} alt="" fill priority sizes="100vw" className="object-cover" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(15,27,45,0.95)_0%,rgba(15,27,45,0.74)_40%,rgba(15,27,45,0.28)_72%,rgba(107,24,32,0.38)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.6)_0%,transparent_46%)]" />
            </div>

            {/* Titular */}
            <div className="relative z-[2] px-5 pb-7 pt-[72px] lg:px-12 lg:pt-24">
              <h1 className="mb-5 max-w-[860px] font-display text-[clamp(40px,5vw,68px)] font-semibold leading-[1.05] tracking-[-1.5px] text-white">
                Bienes raíces que <span className="italic text-white/60">construyen</span> patrimonio.
              </h1>
              <p className="mb-6 max-w-[520px] text-[15.5px] leading-relaxed text-white/70">
                {total} propiedades en las mejores zonas de México. Departamentos, oficinas, locales
                y bodegas seleccionados por un equipo con seis décadas de experiencia.
              </p>
              <div className="flex flex-wrap gap-2">
                {HERO_TYPES.map(([t, l]) => (
                  <Link
                    key={t}
                    href={`/propiedades?type=${t}`}
                    className="rounded-full border border-white/25 bg-white/10 px-[18px] py-[9px] text-[13px] font-medium text-white backdrop-blur transition-colors hover:bg-white hover:text-navy"
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>

            {/* Tarjeta de búsqueda */}
            <div className="relative z-[2] mt-auto px-4 pb-6 lg:px-8 lg:pb-8">
              <HeroSearch suggestions={suggestions} />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-canvas px-4 pb-12 pt-2 lg:px-6 lg:pb-16">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 overflow-hidden rounded-[20px] border border-[#F1F1F0] bg-white shadow-[0_6px_28px_rgba(15,27,45,0.05)] md:grid-cols-4">
          {[
            ['60+', 'Años de experiencia', 'Desde 1960'],
            ['300+', 'Edificios construidos', 'TARTAKOVSKI HNOS'],
            [String(total), 'Propiedades disponibles', 'Venta y renta'],
            ['3,000+', 'Inquilinos atendidos', 'México y EUA'],
          ].map(([n, l, sub]) => (
            <div key={l} className="relative border-[#F1F1F0] px-6 py-6 [&:not(:last-child)]:border-b md:py-9 md:[&:not(:last-child)]:border-b-0 md:[&:not(:last-child)]:border-r">
              <div className="absolute left-6 top-0 h-[3px] w-9 bg-brand md:left-8" />
              <div className="mb-2 font-display text-4xl font-bold leading-none tracking-[-1.5px] text-navy md:text-[52px]">
                {n}
              </div>
              <div className="mb-0.5 text-sm font-semibold text-navy">{l}</div>
              <div className="text-xs text-[#9CA3AF]">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DESTACADAS ── */}
      {featured.data.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 pb-14 pt-6 lg:px-6 lg:pb-20 lg:pt-8">
          <div className="mb-9 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end md:gap-8">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-[#A9802F]">
                <span className="text-premium-to">★</span> Destacados
              </div>
              <h2 className="max-w-[640px] font-display text-[clamp(32px,4.5vw,52px)] font-semibold leading-[1.05] tracking-[-1px] text-navy">
                Propiedades
                <br />
                destacadas
              </h2>
            </div>
            <Link
              href="/propiedades"
              className="flex shrink-0 items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white"
            >
              Ver todas <IChevR s={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── EXPLORA POR TIPO (sustituye el mapa) ── */}
      <section className="bg-white px-4 py-14 lg:px-6 lg:py-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-9">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-brand">
              Explora la ciudad
            </div>
            <h2 className="max-w-[640px] font-display text-[clamp(28px,3.5vw,40px)] font-semibold leading-tight tracking-[-0.5px] text-navy">
              Descubre propiedades por categoría
            </h2>
            <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-muted">
              Desde departamentos compactos hasta oficinas corporativas: encuentra el inmueble ideal
              según lo que buscas, con la asesoría de un equipo con seis décadas de experiencia.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXPLORE.map((c) => (
              <Link
                key={c.type}
                href={`/propiedades?type=${c.type}`}
                className="group flex flex-col justify-between rounded-2xl border border-[#F1F1F0] bg-canvas p-6 transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
              >
                <div className="mb-8 h-1 w-9 bg-brand" />
                <div>
                  <div className="mb-1.5 font-display text-xl font-bold text-navy">{c.label}</div>
                  <p className="mb-4 text-[13px] leading-relaxed text-muted">{c.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                    Ver disponibles <IChevR s={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATÁLOGO (recientes) ── */}
      {recent.data.length > 0 && (
        <section className="bg-canvas px-4 py-14 lg:px-6 lg:py-20">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-9">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-brand">
                Catálogo completo
              </div>
              <h2 className="font-display text-[clamp(28px,3.5vw,42px)] font-semibold leading-tight tracking-[-0.5px] text-navy">
                Explora todo el inventario
              </h2>
              <p className="mt-2 text-sm text-muted">
                Departamentos, oficinas, locales y bodegas en las mejores zonas de México.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recent.data.map((p) => (
                <PropertyCard key={p.id} p={p} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/propiedades"
                className="inline-flex items-center gap-2 rounded-full bg-navy px-7 py-3 text-sm font-semibold text-white"
              >
                Ver todas las propiedades <IChevR s={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section className="bg-white px-4 py-14 lg:px-6 lg:py-20">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-brand">FAQ</div>
            <h2 className="mb-4 font-display text-[clamp(28px,3.5vw,40px)] font-semibold leading-tight tracking-[-0.5px] text-navy">
              Preguntas
              <br />
              frecuentes
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Nuestros expertos te guían en cada decisión basados en insights del mercado.
            </p>
          </div>
          <Faq />
        </div>
      </section>
    </div>
  );
}
