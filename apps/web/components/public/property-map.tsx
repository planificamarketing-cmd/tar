'use client';

// Mapa de ubicación de la ficha (§7.1: "detalle: galería, mapa, amenidades…").
// Un solo pin, sin clustering ni búsqueda: es contexto de la propiedad, no un
// buscador. Se monta con `ssr:false` desde `property-map-loader.tsx` para no
// pesar en el LCP de la ficha (§9).
import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { MAPS_API_KEY, MAPS_MAP_ID, mapsEnabled } from '@/lib/maps';
import { IPin } from './icons';

export type PropertyMapProps = {
  lat: number;
  lng: number;
  title: string;
  address: string;
};

export default function PropertyMap({ lat, lng, title, address }: PropertyMapProps) {
  // Enlace de indicaciones: funciona aunque no haya API key (abre Google Maps).
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  if (!mapsEnabled) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line bg-canvas/60 p-5">
        <p className="text-sm text-muted">
          El mapa interactivo se activa al configurar la llave de Google Maps. Mientras
          tanto puedes abrir la ubicación directamente:
        </p>
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-navy-soft"
        >
          <IPin s={13} /> Ver en Google Maps
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative h-[320px] overflow-hidden rounded-2xl border border-line">
        <APIProvider apiKey={MAPS_API_KEY} language="es" region="MX">
          <GoogleMap
            mapId={MAPS_MAP_ID}
            defaultCenter={{ lat, lng }}
            defaultZoom={15}
            gestureHandling="cooperative"
            disableDefaultUI
            zoomControl
            clickableIcons={false}
            className="h-full w-full"
          >
            <AdvancedMarker position={{ lat, lng }} title={title}>
              <div className="relative -translate-y-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-[0_3px_12px_rgba(210,16,62,0.45)] ring-[3px] ring-white">
                  <IPin s={16} />
                </div>
                <div className="absolute left-1/2 top-full -mt-[5px] h-[10px] w-[10px] -translate-x-1/2 rotate-45 bg-brand" />
              </div>
            </AdvancedMarker>
          </GoogleMap>
        </APIProvider>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[13px] text-muted">
          <IPin s={12} /> {address}
        </p>
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-semibold text-brand hover:text-brand-hover"
        >
          Cómo llegar →
        </a>
      </div>
    </div>
  );
}
