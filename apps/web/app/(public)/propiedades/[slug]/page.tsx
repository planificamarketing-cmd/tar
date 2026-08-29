import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PropertyGallery, PropertyVideos } from '@/components/public/property-gallery';
import { PropertyCard } from '@/components/public/property-card';
import { LeadForm } from '@/components/public/lead-form';
import { TrackView } from '@/components/public/track-view';
import { PropertyMapPanel } from '@/components/public/property-map-loader';
import { IPin, IBed, IBath, ICar, IRuler, ICheck, IVerif } from '@/components/public/icons';
import {
  fetchProperty,
  fetchProperties,
  propertyPrice,
  primaryOperation,
  formatPricePublic,
  locationLabel,
  TYPE_LABEL_SINGULAR,
} from '@/lib/public';
import type { PropertyDetail } from '@/lib/types';

const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const p = await fetchProperty(params.slug);
  if (!p) return { title: 'Propiedad no encontrada' };
  const desc =
    p.description?.trim().slice(0, 160) ??
    `${TYPE_LABEL_SINGULAR[p.propertyType]} en ${locationLabel(p.location)} — TAR Internacional.`;
  const url = `${SITE_URL}/propiedades/${p.slug}`;
  return {
    title: p.title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: p.title,
      description: desc,
      url,
      images: p.cover ? [{ url: p.cover.urlWebp }] : undefined,
    },
  };
}

function num(v: string | null | undefined): number {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

// Datos exteriores/adicionales que solo aplican a ciertos tipos (Grupo A).
function extraAreas(p: PropertyDetail): [string, string][] {
  const rows: [string, string][] = [];
  const add = (label: string, v: string | null) => {
    if (num(v) > 0) rows.push([label, `${Math.round(num(v))} m²`]);
  };
  if (p.propertyType === 'oficina') {
    add('m² útil', p.usableAreaM2);
    add('m² rentable', p.rentableAreaM2);
  }
  add('Patio', p.patioM2);
  add('Terraza', p.terraceM2);
  add('Balcón', p.balconyM2);
  add('Jardín', p.gardenM2);
  return rows;
}

export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const p = await fetchProperty(params.slug);
  if (!p) notFound();

  const op = primaryOperation(p);
  const priceNum = op === 'venta' ? num(p.priceSale) : num(p.priceRent);
  const currency = (op === 'venta' ? p.currencySale : p.currencyRent) ?? 'MXN';
  const area = num(p.areaM2);
  const price = propertyPrice(p, { compact: true });

  const similarRes = await fetchProperties({ type: p.propertyType, limit: 4 });
  const similar = similarRes.data.filter((x) => x.slug !== p.slug).slice(0, 3);

  const pricePerM2 =
    area > 0
      ? `${formatPricePublic(Math.round(priceNum / area), currency, op, { compact: false })}${
          op === 'renta' ? '' : '/m²'
        }`
      : null;

  const datos: [string, string][] = [
    ['Tipo', TYPE_LABEL_SINGULAR[p.propertyType]],
    ['Operación', op === 'venta' ? 'Venta' : 'Renta'],
    ...(area > 0 ? ([['Superficie', `${Math.round(area)} m²`]] as [string, string][]) : []),
    ...extraAreas(p),
    ...(num(p.lotM2) > 0 ? ([['Terreno', `${Math.round(num(p.lotM2))} m²`]] as [string, string][]) : []),
    ...(pricePerM2 ? ([[op === 'renta' ? 'Precio por m²/mes' : 'Precio por m²', pricePerM2]] as [string, string][]) : []),
    ...(p.floor ? ([['Piso', p.floor]] as [string, string][]) : []),
    ['Ubicación', locationLabel(p.location)],
    ['Estatus', 'Disponible'],
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: p.title,
    description: p.description ?? undefined,
    url: `${SITE_URL}/propiedades/${p.slug}`,
    image: p.images.map((i) => i.urlWebp),
    ...(priceNum > 0
      ? {
          offers: {
            '@type': 'Offer',
            price: priceNum,
            priceCurrency: currency,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
    ...(p.location
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: p.location.municipio ?? undefined,
            addressRegion: p.location.estado ?? undefined,
            postalCode: p.postalCode ?? undefined,
            addressCountry: 'MX',
          },
        }
      : {}),
    ...(p.lat != null && p.lng != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng } }
      : {}),
  };

  return (
    <div className="min-h-screen bg-canvas pt-[88px] lg:pt-[112px]">
      <TrackView propertyId={p.id} />
      <script
        type="application/ld+json"
        // JSON-LD para SEO (RealEstateListing). No es un script ejecutable.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-1.5 px-4 py-3 text-[13px] lg:px-8">
        <Link href="/" className="text-muted hover:text-brand">
          Inicio
        </Link>
        <span className="text-[#D1D5DB]">/</span>
        <Link href={`/propiedades?operation=${op}`} className="text-muted hover:text-brand">
          {op === 'venta' ? 'Venta' : 'Renta'}
        </Link>
        <span className="text-[#D1D5DB]">/</span>
        <span className="max-w-[360px] truncate font-medium text-navy">{p.title}</span>
      </div>

      {/* Galería */}
      <div className="mx-auto max-w-[1400px] px-4 pb-6 lg:px-8">
        <PropertyGallery images={p.images} title={p.title} />
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-[1400px] px-4 pb-12 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px] lg:gap-9">
          {/* Izquierda */}
          <div className="flex flex-col gap-5">
            {/* Título */}
            <div className="rounded-[18px] border border-[#F1F1F0] bg-white p-5 lg:p-8">
              <div className="mb-3.5 flex flex-wrap gap-2">
                {p.featured !== 'normal' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-premium-from to-premium-to px-3 py-1 text-[11px] font-bold tracking-wide text-[#3A2A08]">
                    ★ Destacado
                  </span>
                )}
                <span className="rounded-full bg-brand-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
                  {TYPE_LABEL_SINGULAR[p.propertyType]}
                </span>
                {p.isRemate && (
                  <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white">
                    En remate
                  </span>
                )}
                {p.isExclusive && (
                  <span className="rounded-full bg-navy px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    Exclusiva
                  </span>
                )}
              </div>
              <h1 className="mb-2 font-display text-[clamp(26px,3vw,38px)] font-semibold leading-tight tracking-[-0.5px] text-navy">
                {p.title}
              </h1>
              <div className="flex items-center gap-1.5 text-sm text-muted">
                <IPin s={13} />
                {/* Solo la zona: la dirección exacta no se publica en el portal
                    (se comparte con el asesor durante el proceso). */}
                {locationLabel(p.location)}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#F1F1F0] pt-4">
                <div className="font-display text-4xl font-bold tracking-[-1px] text-navy">{price}</div>
                <div className="flex flex-wrap gap-5 text-sm text-ink">
                  {area > 0 && (
                    <div className="flex items-center gap-1.5">
                      <IRuler s={16} />
                      <strong>{Math.round(area)}</strong> m²
                    </div>
                  )}
                  {(p.bedrooms ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <IBed s={16} />
                      <strong>{p.bedrooms}</strong> rec.
                    </div>
                  )}
                  {(p.bathrooms ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <IBath s={16} />
                      <strong>{p.bathrooms}</strong> baños
                    </div>
                  )}
                  {(p.parking ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <ICar s={16} />
                      <strong>{p.parking}</strong> caj.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Descripción */}
            {p.description && (
              <div className="rounded-[18px] border border-[#F1F1F0] bg-white p-5 lg:p-8">
                <h3 className="mb-4 font-display text-[22px] font-bold text-navy">Descripción</h3>
                <p className="whitespace-pre-line text-[15px] leading-[1.8] text-ink">{p.description}</p>
              </div>
            )}

            {/* Características / amenidades */}
            {p.amenities.length > 0 && (
              <div className="rounded-[18px] border border-[#F1F1F0] bg-white p-5 lg:p-8">
                <h3 className="mb-4 font-display text-[22px] font-bold text-navy">Características</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {p.amenities.map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5 py-2 text-sm text-ink">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                        <ICheck s={13} />
                      </span>
                      {a.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ubicación en el mapa (§7.1) — solo si la propiedad tiene geo */}
            {p.lat != null && p.lng != null && (
              <div className="rounded-[18px] border border-[#F1F1F0] bg-white p-5 lg:p-8">
                <h3 className="mb-4 font-display text-[22px] font-bold text-navy">
                  Ubicación
                </h3>
                <PropertyMapPanel
                  lat={p.lat}
                  lng={p.lng}
                  title={p.title}
                  address={locationLabel(p.location)}
                />
              </div>
            )}

            {/* Videos H/V */}
            <PropertyVideos videos={p.videos} />

            {/* Datos */}
            <div className="rounded-[18px] border border-[#F1F1F0] bg-white p-5 lg:p-8">
              <h3 className="mb-4 font-display text-[22px] font-bold text-navy">Datos</h3>
              <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-x-8">
                {datos.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between border-b border-[#F1F1F0] py-3 text-sm"
                  >
                    <span className="text-muted">{k}</span>
                    <span className="font-medium text-navy">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Derecha — formulario sticky */}
          <div>
            <div className="lg:sticky lg:top-[100px]">
              <LeadForm propertyId={p.id} propertyTitle={p.title} operation={op} />
              <a
                href={`${API_URL}/properties/${p.slug}/flyer.pdf`}
                target="_blank"
                rel="noopener"
                className="mt-4 flex items-center justify-center gap-2 rounded-[14px] border border-navy bg-navy px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a2b45]"
              >
                <IRuler s={16} /> Descargar folleto (PDF)
              </a>
              <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-[#F1F1F0] bg-white px-5 py-4">
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <IVerif s={18} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-navy">
                    Anunciado por TAR Internacional
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    Grupo inmobiliario · 60+ años de experiencia
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similares */}
        {similar.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-6 font-display text-3xl font-semibold tracking-[-0.5px] text-navy">
              Propiedades similares
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((sp) => (
                <PropertyCard key={sp.id} p={sp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
