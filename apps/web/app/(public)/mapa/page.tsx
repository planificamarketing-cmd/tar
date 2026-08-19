import type { Metadata } from 'next';
import { MapSplitPanel } from '@/components/public/map-split-loader';
import { fetchLocations, buildSuggestions } from '@/lib/public';
import type { MapSearchFilters } from '@/lib/maps';
import type { ListingParams } from '@/components/public/use-listing-params';
import type { PropertyType } from '@tar/shared';

export const metadata: Metadata = {
  title: 'Mapa de propiedades',
  description:
    'Explora en el mapa departamentos, oficinas, locales y bodegas en venta y renta en las mejores zonas de México con TAR Internacional.',
};

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

// Página de mapa dedicada (diseño de referencia prototipo-v3 · Map): a pantalla
// completa, con panel de lista + mapa sincronizados. Vive aparte del listado para
// que sea un destino claro del menú, no una vista escondida tras un botón.
export default async function MapaPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params: ListingParams = {
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
    sort: 'relevancia',
    view: 'map',
    page: '1',
  };

  const numParam = (v: string) => {
    const n = Number(v);
    return v && Number.isFinite(n) && n > 0 ? n : undefined;
  };

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

  const locations = await fetchLocations();
  const suggestions = buildSuggestions(locations);

  // Mapa a pantalla completa bajo el header fijo. Los filtros (buscador, tabs de
  // operación y píldoras de precio/tipo/recámaras) viven DENTRO del split, como el
  // prototipo-v3, no en una barra aparte.
  return (
    <div className="h-[100svh] pt-[64px] lg:pt-[76px]">
      <MapSplitPanel filters={sharedFilters} params={params} suggestions={suggestions} />
    </div>
  );
}
