'use client';

// Carga diferida del split de mapa (§9): `ssr:false` + import dinámico para que
// Leaflet y supercluster NO entren en el bundle de las vistas de cuadrícula/lista.
import dynamic from 'next/dynamic';
import type { MapSearchFilters } from '@/lib/maps';
import type { ListingParams } from './use-listing-params';
import type { Suggestion } from '@/lib/public';

const MapSplit = dynamic(() => import('./map-split'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[520px] items-center justify-center bg-white">
      <span className="text-sm text-muted">Cargando mapa…</span>
    </div>
  ),
});

export function MapSplitPanel({
  filters,
  params,
  suggestions,
}: {
  filters: MapSearchFilters;
  params: ListingParams;
  suggestions: Suggestion[];
}) {
  return <MapSplit filters={filters} params={params} suggestions={suggestions} />;
}
