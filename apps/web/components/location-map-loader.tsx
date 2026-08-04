'use client';

// Carga diferida del mapa del backoffice: el SDK de Google solo se descarga al
// abrir el editor de una propiedad, no en el resto del panel.
import dynamic from 'next/dynamic';
import type { LocationMapProps } from './location-map';

const LocationMap = dynamic(() => import('./location-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-xl border border-line bg-white">
      <span className="text-sm text-muted">Cargando mapa…</span>
    </div>
  ),
});

export function LocationMapPanel(props: LocationMapProps) {
  return <LocationMap {...props} />;
}
