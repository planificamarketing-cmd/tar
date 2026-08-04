'use client';

// Carga diferida del mapa de la ficha (§9): fuera del bundle inicial para no
// competir con la galería por el LCP.
import dynamic from 'next/dynamic';
import type { PropertyMapProps } from './property-map';

const PropertyMap = dynamic(() => import('./property-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-2xl border border-line bg-canvas/60">
      <span className="text-sm text-muted">Cargando mapa…</span>
    </div>
  ),
});

export function PropertyMapPanel(props: PropertyMapProps) {
  return <PropertyMap {...props} />;
}
