'use client';

// Mapa del LocationPicker del backoffice (§7.2: "CRUD propiedades con asistente:
// datos → ubicación (mapa para fijar `geo`)"). Fija `geo` con clic en el mapa o
// arrastrando el pin. Es un complemento de los campos lat/lng y del pegado de
// enlaces de Maps, que siguen funcionando como respaldo.
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_TILES_ATTRIBUTION,
  MAP_TILES_URL,
} from '@/lib/maps';
import { pinHtml } from './public/map-marker';

export type LocationMapProps = {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
};

const pinIcon = () =>
  L.divIcon({ html: pinHtml(), className: '', iconSize: [0, 0], iconAnchor: [0, 0] });

// Clic en cualquier punto del mapa → fija la ubicación ahí.
function ClickToPick({ onPick }: { onPick: LocationMapProps['onPick'] }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

// Recentra el mapa cuando el punto cambia desde FUERA (pegar un enlace de Maps,
// escribir coordenadas a mano). No recentra al arrastrar el pin: sería un salto
// molesto justo después de soltarlo.
function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (lat == null || lng == null) return;
    const key = `${lat},${lng}`;
    if (last.current === key) return;
    last.current = key;
    map.setView([lat, lng], Math.max(map.getZoom(), 16));
  }, [map, lat, lng]);

  return null;
}

export default function LocationMap({ lat, lng, onPick }: LocationMapProps) {
  const hasPoint = lat != null && lng != null;
  const center: [number, number] = hasPoint ? [lat, lng] : DEFAULT_CENTER;

  return (
    <div className="relative h-[300px] overflow-hidden rounded-xl border border-line">
      <MapContainer
        center={center}
        zoom={hasPoint ? 16 : DEFAULT_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer url={MAP_TILES_URL} attribution={MAP_TILES_ATTRIBUTION} />
        <ClickToPick onPick={onPick} />
        <Recenter lat={lat} lng={lng} />
        {hasPoint && (
          <Marker
            position={[lat, lng]}
            icon={pinIcon()}
            draggable
            title="Arrastra para ajustar la ubicación"
            eventHandlers={{
              dragend: (e) => {
                const { lat: nlat, lng: nlng } = (
                  e.target as L.Marker
                ).getLatLng();
                onPick(nlat, nlng);
              },
            }}
          />
        )}
      </MapContainer>

      {!hasPoint && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] rounded-lg bg-navy/90 px-3 py-2 text-center text-[12px] font-medium text-white">
          Haz clic en el mapa para fijar la ubicación de la propiedad
        </div>
      )}
    </div>
  );
}
