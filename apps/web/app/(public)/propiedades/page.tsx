import type { Metadata } from 'next';
import Link from 'next/link';
import { PropertyCard } from '@/components/public/property-card';
import { PropertyRow } from '@/components/public/property-row';
import { ListingSidebar } from '@/components/public/listing-sidebar';
import { ListingControls } from '@/components/public/listing-controls';
import { MobileFilters } from '@/components/public/mobile-filters';
import { fetchProperties, fetchLocations, buildSuggestions } from '@/lib/public';
import type { PublicPropertyFilters } from '@/lib/public';
import type { MapSearchFilters } from '@/lib/maps';
import type { PropertyType } from '@tar/shared';

export const metadata: Metadata = {
  title: 'Propiedades',
  description:
    'Explora departamentos, oficinas, locales y bodegas en venta y renta en las mejores zonas de México con TAR Internacional.',
};

const PER_PAGE = 9;

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

// Ventana de paginación con elipsis: primera, última, la actual y sus vecinas.
// Ej. (7, 20) → [1, '…', 6, 7, 8, '…', 20]. Evita cientos de botones si el
// inventario crece. '…' se renderiza como separador no clicable.
function paginationRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push('…');
  for (let n = start; n <= end; n++) out.push(n);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = {
    operation: one(searchParams.operation),
    type: one(searchParams.type),
    minPrice: one(searchParams.minPrice),
    maxPrice: one(searchParams.maxPrice),
    bedrooms: one(searchParams.bedrooms),
    bathrooms: one(searchParams.bathrooms),
    parking: one(searchParams.parking),
    minArea: one(searchParams.minArea),
    maxArea: one(searchParams.maxArea),
    q: one(searchParams.q),
    sort: one(searchParams.sort) || 'relevancia',
    view: one(searchParams.view) || 'grid',
    page: one(searchParams.page) || '1',
  };

  const page = Math.max(1, Number(params.page) || 1);
  const numParam = (v: string) => {
    const n = Number(v);
    return v && Number.isFinite(n) && n > 0 ? n : undefined;
  };
  // Filtros compartidos por listado y mapa. El mapa añade el bbox visible y no
  // usa page/limit/sort (§6.2), así que estos se agregan solo para el listado.
  const sharedFilters: MapSearchFilters = {
    ...(params.operation ? { operation: params.operation as 'venta' | 'renta' } : {}),
    ...(params.type ? { type: params.type as PropertyType } : {}),
    ...(numParam(params.minPrice) ? { minPrice: numParam(params.minPrice) } : {}),
    ...(numParam(params.maxPrice) ? { maxPrice: numParam(params.maxPrice) } : {}),
    ...(numParam(params.bedrooms) ? { bedrooms: numParam(params.bedrooms) } : {}),
    ...(numParam(params.bathrooms) ? { bathrooms: numParam(params.bathrooms) } : {}),
    ...(numParam(params.parking) ? { parking: numParam(params.parking) } : {}),
    ...(numParam(params.minArea) ? { minArea: numParam(params.minArea) } : {}),
    ...(numParam(params.maxArea) ? { maxArea: numParam(params.maxArea) } : {}),
    ...(params.q ? { q: params.q } : {}),
  };

  const filters: PublicPropertyFilters = {
    page,
    limit: PER_PAGE,
    sort: params.sort as PublicPropertyFilters['sort'],
    ...sharedFilters,
  };

  const [result, locations] = await Promise.all([
    fetchProperties(filters, 60),
    fetchLocations(),
  ]);
  const suggestions = buildSuggestions(locations);
  const { data, meta } = result;
  const totalPages = Math.max(1, Math.ceil(meta.total / PER_PAGE));

  // Constructor de href de paginación preservando los filtros actuales.
  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === 'page' || k === 'view') continue;
      if (v && !(k === 'sort' && v === 'relevancia')) sp.set(k, v);
    }
    if (params.view !== 'grid') sp.set('view', params.view);
    if (n > 1) sp.set('page', String(n));
    const qs = sp.toString();
    return qs ? `/propiedades?${qs}` : '/propiedades';
  };

  return (
    <div className="min-h-screen bg-canvas pt-[88px] lg:pt-[112px]">
      {/* Barra superior */}
      <div className="border-b border-[#F1F1F0] bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div>
            <div className="font-display text-2xl font-semibold tracking-[-0.5px] text-navy">
              Propiedades
            </div>
            <div className="mt-0.5 text-[13px] text-muted">
              <strong className="text-navy">{meta.total}</strong> resultado
              {meta.total !== 1 ? 's' : ''}
            </div>
          </div>
          <ListingControls params={params} />
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-6 lg:flex-row lg:gap-7 lg:px-8 lg:py-8">
          {/* Filtros móvil */}
          <MobileFilters params={params} suggestions={suggestions} />

          {/* Sidebar escritorio */}
          <aside className="hidden w-[240px] shrink-0 lg:block">
            <div className="sticky top-[100px] rounded-2xl border border-[#F1F1F0] bg-white p-5">
              <div className="mb-4 font-display text-base font-bold text-navy">Filtros</div>
              <ListingSidebar params={params} suggestions={suggestions} />
            </div>
          </aside>

          {/* Resultados */}
          <div className="min-w-0 flex-1">
            {data.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mb-2 font-display text-2xl text-navy">Sin resultados</div>
                <div className="text-sm text-muted">Prueba ajustando los filtros.</div>
              </div>
            ) : params.view === 'list' ? (
              <div className="flex flex-col gap-3.5">
                {data.map((p) => (
                  <PropertyRow key={p.id} p={p} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.map((p) => (
                  <PropertyCard key={p.id} p={p} />
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-9 flex flex-wrap justify-center gap-1.5">
                {paginationRange(page, totalPages).map((n, i) =>
                  n === '…' ? (
                    <span
                      key={`gap-${i}`}
                      className="flex h-10 w-10 items-center justify-center text-[13px] text-muted"
                    >
                      …
                    </span>
                  ) : (
                    <Link
                      key={n}
                      href={pageHref(n)}
                      scroll
                      aria-current={n === page ? 'page' : undefined}
                      className={[
                        'flex h-10 w-10 items-center justify-center rounded-full border text-[13px]',
                        n === page
                          ? 'border-navy bg-navy font-semibold text-white'
                          : 'border-line bg-white text-ink hover:border-navy',
                      ].join(' ')}
                    >
                      {n}
                    </Link>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
