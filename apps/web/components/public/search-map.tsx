'use client';

// SearchMap (§7.1 vista mapa del listado, §7.3, §6.2). Google Maps Platform con
// clustering en cliente (supercluster) sobre los puntos de `GET /properties/map`
// para el bbox visible + los filtros activos del listado.
//
// Se monta SIEMPRE vía `next/dynamic ssr:false` (ver `search-map-loader.tsx`):
// el JS de Google Maps no debe entrar en el bundle de la vista de cuadrícula ni
// bloquear el LCP (§9).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
// `Map` se importa con alias: el componente de Google chocaría con el `Map` nativo.
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import Supercluster from 'supercluster';
import type { ClusterFeature, PointFeature } from 'supercluster';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAPS_API_KEY,
  MAPS_MAP_ID,
  fetchMapPoints,
  fetchMapPreview,
  mapsEnabled,
  pillPrice,
  type Bbox,
  type MapPoint,
  type MapPreview,
  type MapSearchFilters,
} from '@/lib/maps';
import { ClusterBubble, PricePill } from './map-marker';
import { MapPreviewCard } from './map-preview-card';

export type SearchMapFilters = MapSearchFilters;

type PointProps = { point: MapPoint };
type Feature = PointFeature<PointProps> | ClusterFeature<Record<string, never>>;

const isCluster = (f: Feature): f is ClusterFeature<Record<string, never>> =>
  (f.properties as { cluster?: boolean }).cluster === true;

// GeoJSON tipa `coordinates` como `number[]`; los puntos siempre traen par
// [lng, lat] (el endpoint filtra los que no tienen geo).
function latLng(f: Feature): google.maps.LatLngLiteral {
  const [lng = 0, lat = 0] = f.geometry.coordinates;
  return { lat, lng };
}

// ── Capa de datos + marcadores (vive DENTRO de <Map>, usa su instancia) ───────
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

  const readBbox = useCallback((): Bbox | null => {
    const b = map?.getBounds();
    if (!b) return null;
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    return {
      minLng: sw.lng(),
      minLat: sw.lat(),
      maxLng: ne.lng(),
      maxLat: ne.lat(),
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
    if (!map) return;
    let cancelled = false;
    setReady(false);
    setSelected(null);
    void (async () => {
      const data = await load();
      if (cancelled || !data) {
        if (!cancelled) setReady(true);
        return;
      }
      if (data.length > 0) {
        const b = new google.maps.LatLngBounds();
        for (const p of data) b.extend({ lat: p.lat as number, lng: p.lng as number });
        if (data.length === 1) {
          map.setCenter(b.getCenter());
          map.setZoom(15);
        } else {
          map.fitBounds(b, 48);
        }
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // `filtersKey` serializa los filtros: evita re-encuadrar por identidad de objeto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, filtersKey]);

  // Cámara: mantiene bbox/zoom para el clustering y dispara la búsqueda por
  // desplazamiento cuando el usuario deja de mover el mapa.
  useEffect(() => {
    if (!map) return;
    const onIdle = () => {
      setBbox(readBbox());
      setZoom(Math.round(map.getZoom() ?? DEFAULT_ZOOM));
      if (!ready) return;
      if (autoSearch) void load(readBbox() ?? undefined);
      else setMoved(true);
    };
    const l = map.addListener('idle', onIdle);
    return () => l.remove();
  }, [map, ready, autoSearch, load, readBbox]);

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
    if (!map) return;
    const id = f.properties.cluster_id as unknown as number;
    const next = Math.min(index.getClusterExpansionZoom(id), 20);
    map.setZoom(next);
    map.panTo(latLng(f));
  }

  return (
    <>
      {clusters.map((f) => {
        if (isCluster(f)) {
          const count = f.properties.point_count as unknown as number;
          return (
            <AdvancedMarker
              key={`cluster-${String(f.properties.cluster_id)}`}
              position={latLng(f)}
              zIndex={1}
              onClick={() => expandCluster(f)}
              title={`${count} propiedades`}
            >
              <ClusterBubble count={count} />
            </AdvancedMarker>
          );
        }
        const p = f.properties.point;
        const isSel = selected?.id === p.id;
        return (
          <AdvancedMarker
            key={p.id}
            position={latLng(f)}
            zIndex={isSel ? 4 : p.featured !== 'normal' ? 3 : 2}
            onClick={() => void selectPoint(p)}
            title={pillPrice(p.price, p.currency)}
          >
            <PricePill
              label={pillPrice(p.price, p.currency)}
              featured={p.featured}
              selected={isSel}
            />
          </AdvancedMarker>
        );
      })}

      {/* Barra de estado: conteo, carga y control de búsqueda por desplazamiento */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[6] flex flex-wrap items-start justify-between gap-2">
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
              if (e.target.checked) void load(readBbox() ?? undefined);
            }}
            className="h-3.5 w-3.5 accent-[#D2103E]"
          />
          Buscar al mover el mapa
        </label>
      </div>

      {!autoSearch && moved && (
        <button
          type="button"
          onClick={() => void load(readBbox() ?? undefined)}
          className="absolute left-1/2 top-14 z-[6] -translate-x-1/2 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(210,16,62,0.4)] transition hover:bg-brand-hover"
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

// Respaldo si se llega aquí sin mapa disponible. Normalmente es inalcanzable:
// el botón de mapa se oculta y `?view=map` cae a la cuadrícula (ver
// `listing-controls.tsx` y la página del listado). Queda por si alguien fuerza
// la ruta, y sin mencionar detalles de configuración: es una pantalla pública.
function MapUnavailable() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-white px-6 py-16 text-center">
      <div className="font-display text-xl font-semibold text-navy">
        La vista de mapa no está disponible
      </div>
      <p className="max-w-md text-sm text-muted">
        Puedes explorar todo el catálogo desde el listado, con filtros por zona,
        tipo de inmueble y precio.
      </p>
      <Link
        href="/propiedades"
        className="mt-1 rounded-full bg-navy px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-navy-soft"
      >
        Ver el listado
      </Link>
    </div>
  );
}

export default function SearchMap({
  filters,
  className = '',
}: {
  filters: SearchMapFilters;
  className?: string;
}) {
  if (!mapsEnabled) {
    return (
      <div className={className}>
        <MapUnavailable />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-line ${className}`}>
      <APIProvider apiKey={MAPS_API_KEY} language="es" region="MX">
        <GoogleMap
          mapId={MAPS_MAP_ID}
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          className="h-full w-full"
        >
          <MapLayer filters={filters} />
        </GoogleMap>
      </APIProvider>
    </div>
  );
}
