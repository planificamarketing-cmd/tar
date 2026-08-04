'use client';

// Mapa de ubicación de la ficha (§7.1: "detalle: galería, mapa, amenidades…").
// Un solo pin, sin clustering ni búsqueda: es contexto de la propiedad, no un
// buscador. Se monta con `ssr:false` desde `property-map-loader.tsx` para no
// pesar en el LCP de la ficha (§9).
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import {
  MAP_MAX_ZOOM,
  MAP_TILES_ATTRIBUTION,
  MAP_TILES_URL,
} from '@/lib/maps';
import { pinHtml } from './map-marker';
import { IPin } from './icons';

export type PropertyMapProps = {
  lat: number;
  lng: number;
  title: string;
  address: string;
};

export default function PropertyMap({ lat, lng, title, address }: PropertyMapProps) {
  // Enlace de indicaciones: se apoya en Google Maps del lado del visitante (no
  // requiere cuenta ni llave nuestra) porque es lo que casi todo el mundo usa
  // para navegar.
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="space-y-3">
      <div className="relative h-[320px] overflow-hidden rounded-2xl border border-line">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          maxZoom={MAP_MAX_ZOOM}
          // Sin zoom con la rueda: en móvil y al hacer scroll por la ficha, el
          // mapa "secuestraría" el desplazamiento de la página.
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer url={MAP_TILES_URL} attribution={MAP_TILES_ATTRIBUTION} />
          <Marker
            position={[lat, lng]}
            title={title}
            icon={L.divIcon({
              html: pinHtml(),
              className: '',
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            })}
          />
        </MapContainer>
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
