'use client';

// SearchMap (§7.1 vista mapa del listado, §7.3, §6.2). Leaflet + mosaicos de
// CARTO/OpenStreetMap (ver la nota de proveedor en `lib/maps.ts`), con clustering
// en cliente (supercluster) sobre los puntos de `GET /properties/map` para el
// bbox visible y los filtros activos.
//
// Se monta SIEMPRE vía `next/dynamic ssr:false` (ver `search-map-loader.tsx`):
// Leaflet toca `window` al importarse y su JS no debe entrar en el bundle de las
// vistas de cuadrícula y lista ni bloquear el LCP (§9).
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import Supercluster from 'supercluster';
import type { ClusterFeature, PointFeature } from 'supercluster';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_TILES_ATTRIBUTION,
  MAP_TILES_URL,
  fetchMapPoints,
  fetchMapPreview,
  pillPrice,
  type Bbox,
  type MapPoint,
  type MapPreview,
  type MapSearchFilters,
} from '@/lib/maps';
import { clusterBubbleHtml, pricePillHtml } from './map-marker';
import { MapPreviewCard } from './map-preview-card';

export type SearchMapFilters = MapSearchFilters;

type PointProps = { point: MapPoint };
type Feature = PointFeature<PointProps> | ClusterFeature<Record<string, never>>;

const isCluster = (f: Feature): f is ClusterFeature<Record<string, never>> =>
  (f.properties as { cluster?: boolean }).cluster === true;

// GeoJSON tipa `coordinates` como `number[]`; los puntos siempre traen par
// [lng, lat] (el endpoint filtra los que no tienen geo).
function latLng(f: Feature): [number, number] {
  const [lng = 0, lat = 0] = f.geometry.coordinates;
  return [lat, lng];
}

// `divIcon` con tamaño 0: el markup se ancla solo (ver `map-marker.ts`).
const icon = (html: string) =>
  L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });

// ── Capa de datos + marcadores (vive DENTRO de <MapContainer>) ───────────────
function MapLayer({ filters }: { filters: SearchMapFilters }) {
  const map = useMap();
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false); // encuadre inicial resuelto
  const [autoSearch, setAutoSearch] = useState(true);
  const [moved, setMoved] = useState(false); // hubo desplazamiento sin buscar
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [preview, setPreview] = useState<MapPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // La petición en vuelo se aborta al desplazarse otra vez (o al desmontar).
  const inFlight = useRef<AbortController | null>(null);
  const previewCache = useRef(new Map<string, MapPreview>());
  const filtersKey = JSON.stringify(filters);

  const readBbox = useCallback((): Bbox => {
    const b = map.getBounds();
    return {
      minLng: b.getWest(),
      minLat: b.getSouth(),
      maxLng: b.getEast(),
      maxLat: b.getNorth(),
    };
  }, [map]);

  const load = useCallback(
    async (box?: Bbox) => {
      inFlight.current?.abort();
      const ac = new AbortController();
      inFlight.current = ac;
      setLoading(true);
      setError(false);
      try {
        const data = await fetchMapPoints(filters, box, ac.signal);
        if (ac.signal.aborted) return;
        setPoints(data);
        setMoved(false);
        return data;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        setError(true);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
      return undefined;
    },
    [filters],
  );

  // Carga inicial (y al cambiar los filtros de la URL): se piden TODOS los puntos
  // que cumplen los filtros —sin bbox— para poder encuadrar el mapa sobre el
  // inventario real. A partir de ahí manda el bbox visible.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setSelected(null);
    void (async () => {
      const data = await load();
      if (cancelled) return;
      if (data && data.length > 0) {
        const bounds = L.latLngBounds(
          data.map((p) => [p.lat as number, p.lng as number] as [number, number]),
        );
        if (data.length === 1) map.setView(bounds.getCenter(), 15);
        else map.fitBounds(bounds, { padding: [48, 48] });
      }
      setBbox(readBbox());
      setZoom(Math.round(map.getZoom()));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // `filtersKey` serializa los filtros: evita re-encuadrar por identidad de objeto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, filtersKey]);

  // Cámara: `moveend` cubre arrastre y zoom. Mantiene bbox/zoom para el
  // clustering y dispara la búsqueda por desplazamiento.
  useMapEvents({
    moveend: () => {
      setBbox(readBbox());
      setZoom(Math.round(map.getZoom()));
      if (!ready) return;
      if (autoSearch) void load(readBbox());
      else setMoved(true);
    },
  });

  useEffect(() => () => inFlight.current?.abort(), []);

  // Índice de clustering. `maxZoom` 16: más allá se muestran pines individuales.
  const index = useMemo(() => {
    const sc = new Supercluster<PointProps, Record<string, never>>({
      radius: 64,
      maxZoom: 16,
      minPoints: 3,
    });
    sc.load(
      points.map((point) => ({
        type: 'Feature' as const,
        properties: { point },
        geometry: {
          type: 'Point' as const,
          coordinates: [point.lng as number, point.lat as number],
        },
      })),
    );
    return sc;
  }, [points]);

  const clusters = useMemo<Feature[]>(() => {
    const box: [number, number, number, number] = bbox
      ? [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat]
      : [-180, -85, 180, 85];
    return index.getClusters(box, zoom) as Feature[];
  }, [index, bbox, zoom]);

  async function selectPoint(point: MapPoint) {
    setSelected(point);
    const cached = previewCache.current.get(point.slug);
    if (cached) {
      setPreview(cached);
      setPreviewLoading(false);
      return;
    }
    setPreview(null);
    setPreviewLoading(true);
    try {
      const data = await fetchMapPreview(point.slug);
      previewCache.current.set(point.slug, data);
      setPreview(data);
    } catch {
      setSelected(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  function expandCluster(f: ClusterFeature<Record<string, never>>) {
    const id = f.properties.cluster_id as unknown as number;
    const next = Math.min(index.getClusterExpansionZoom(id), MAP_MAX_ZOOM);
    map.setView(latLng(f), next);
  }

  return (
    <>
      {clusters.map((f) => {
        if (isCluster(f)) {
          const count = f.properties.point_count as unknown as number;
          return (
            <Marker
              key={`cluster-${String(f.properties.cluster_id)}`}
              position={latLng(f)}
              icon={icon(clusterBubbleHtml(count))}
              zIndexOffset={0}
              title={`${count} propiedades`}
              eventHandlers={{ click: () => expandCluster(f) }}
            />
          );
        }
        const p = f.properties.point;
        const isSel = selected?.id === p.id;
        const label = pillPrice(p.price, p.currency);
        return (
          <Marker
            key={p.id}
            position={latLng(f)}
            icon={icon(pricePillHtml(label, p.featured, isSel))}
            zIndexOffset={isSel ? 1000 : p.featured !== 'normal' ? 500 : 100}
            title={label}
            eventHandlers={{ click: () => void selectPoint(p) }}
          />
        );
      })}

      {/* Barra de estado: conteo, carga y control de búsqueda por desplazamiento.
          z-[500] va por encima de los paneles de Leaflet (que llegan a 400). */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex flex-wrap items-start justify-between gap-2">
        <span className="pointer-events-auto rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-navy shadow-[0_2px_10px_rgba(0,0,0,0.14)]">
          {loading
            ? 'Buscando…'
            : error
              ? 'No se pudieron cargar las propiedades'
              : points.length === 0
                ? 'Sin propiedades en esta zona'
                : `${points.length} propiedad${points.length === 1 ? '' : 'es'} en esta zona`}
        </span>
        <label className="pointer-events-auto flex cursor-pointer items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-medium text-ink shadow-[0_2px_10px_rgba(0,0,0,0.14)]">
          <input
            type="checkbox"
            checked={autoSearch}
            onChange={(e) => {
              setAutoSearch(e.target.checked);
              if (e.target.checked) void load(readBbox());
            }}
            className="h-3.5 w-3.5 accent-[#D2103E]"
          />
          Buscar al mover el mapa
        </label>
      </div>

      {!autoSearch && moved && (
        <button
          type="button"
          onClick={() => void load(readBbox())}
          className="absolute left-1/2 top-14 z-[500] -translate-x-1/2 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(210,16,62,0.4)] transition hover:bg-brand-hover"
        >
          Buscar en esta zona
        </button>
      )}

      {selected && (
        <MapPreviewCard
          preview={preview}
          loading={previewLoading}
          onClose={() => {
            setSelected(null);
            setPreview(null);
          }}
        />
      )}
    </>
  );
}

export default function SearchMap({
  filters,
  className = '',
}: {
  filters: SearchMapFilters;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-line ${className}`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        scrollWheelZoom
        // El zoom va abajo a la derecha: arriba a la izquierda taparía el
        // contador de propiedades.
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer url={MAP_TILES_URL} attribution={MAP_TILES_ATTRIBUTION} />
        <ZoomControl position="bottomright" />
        <MapLayer filters={filters} />
      </MapContainer>
    </div>
  );
}
