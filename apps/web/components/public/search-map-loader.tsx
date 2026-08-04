'use client';

// Carga diferida del mapa (§9): `ssr:false` + import dinámico para que el SDK de
// Google Maps y supercluster NO entren en el bundle de las vistas de cuadrícula
// y lista, ni bloqueen el LCP. `ssr:false` solo es válido en un Client Component,
// por eso este wrapper existe.
import dynamic from 'next/dynamic';
import type { MapSearchFilters } from '@/lib/maps';

const SearchMap = dynamic(() => import('./search-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-2xl border border-line bg-white">
      <span className="text-sm text-muted">Cargando mapa…</span>
    </div>
  ),
});

export function SearchMapPanel({
  filters,
  className,
}: {
  filters: MapSearchFilters;
  className?: string;
}) {
  return <SearchMap filters={filters} className={className} />;
}
