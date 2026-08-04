'use client';

// Mapa del LocationPicker del backoffice (§7.2: "CRUD propiedades con asistente:
// datos → ubicación (mapa para fijar `geo`)"). Fija `geo` con clic en el mapa o
// arrastrando el pin. Es un complemento de los campos lat/lng y del pegado de
// enlaces de Maps, que siguen funcionando como respaldo.
import { useEffect, useRef } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import { DEFAULT_CENTER, MAPS_API_KEY, MAPS_MAP_ID } from '@/lib/maps';

export type LocationMapProps = {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
};

// Recentra el mapa cuando el punto cambia desde FUERA (pegar un enlace de Maps,
// escribir coordenadas a mano). No recentra al arrastrar el pin: sería un salto
// molesto justo después de soltarlo.
function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!map || lat == null || lng == null) return;
    const key = `${lat},${lng}`;
    if (last.current === key) return;
    last.current = key;
    map.panTo({ lat, lng });
    if ((map.getZoom() ?? 0) < 15) map.setZoom(16);
  }, [map, lat, lng]);

  return null;
}

export default function LocationMap({ lat, lng, onPick }: LocationMapProps) {
  const hasPoint = lat != null && lng != null;
  const center = hasPoint ? { lat, lng } : DEFAULT_CENTER;

  return (
    <div className="relative h-[300px] overflow-hidden rounded-xl border border-line">
      <APIProvider apiKey={MAPS_API_KEY} language="es" region="MX">
        <GoogleMap
          mapId={MAPS_MAP_ID}
          defaultCenter={center}
          defaultZoom={hasPoint ? 16 : 11}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          className="h-full w-full"
          onClick={(e) => {
            const ll = e.detail.latLng;
            if (ll) onPick(ll.lat, ll.lng);
          }}
        >
          <Recenter lat={lat} lng={lng} />
          {hasPoint && (
            <AdvancedMarker
              position={{ lat, lng }}
              draggable
              title="Arrastra para ajustar la ubicación"
              onDragEnd={(e) => {
                const ll = e.latLng;
                if (ll) onPick(ll.lat(), ll.lng());
              }}
            >
              <div className="relative -translate-y-1 cursor-grab active:cursor-grabbing">
                <div className="h-5 w-5 rounded-full bg-brand shadow-[0_3px_10px_rgba(210,16,62,0.5)] ring-[3px] ring-white" />
                <div className="absolute left-1/2 top-full -mt-[4px] h-2 w-2 -translate-x-1/2 rotate-45 bg-brand" />
              </div>
            </AdvancedMarker>
          )}
        </GoogleMap>
      </APIProvider>

      {!hasPoint && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-navy/90 px-3 py-2 text-center text-[12px] font-medium text-white">
          Haz clic en el mapa para fijar la ubicación de la propiedad
        </div>
      )}
    </div>
  );
}
