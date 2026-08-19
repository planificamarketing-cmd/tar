'use client';

// Vista de mapa con split layout (§7.1, diseño de referencia prototipo-v3 · Map3):
// panel de lista a la izquierda + mapa a la derecha, sincronizados. En pantallas
// estrechas se apila (mapa arriba ~46vh, lista abajo). Reutiliza los price-pill y
// el clustering (supercluster) del proyecto, pero se alimenta de un ÚNICO fetch de
// `/properties/map` (enriquecido con portada/recámaras) para que lista y mapa
// muestren exactamente el mismo conjunto filtrado.
//
// Se monta SIEMPRE vía next/dynamic ssr:false (Leaflet toca `window` al importarse).
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import Supercluster from 'supercluster';
import type { ClusterFeature, PointFeature } from 'supercluster';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_TILES_ATTRIBUTION,
  MAP_TILES_URL,
  fetchMapPoints,
  pillPrice,
  type Bbox,
  type MapPoint,
  type MapSearchFilters,
} from '@/lib/maps';
import { clusterBubbleHtml, pricePillHtml } from './map-marker';
import { TYPE_LABEL_SINGULAR, locationLabel, type Suggestion } from '@/lib/public';
import { LocationAutocomplete } from './location-autocomplete';
import { useSetParams, type ListingParams } from './use-listing-params';
import { IBed, IBath, IRuler, IPin, IChevD } from './icons';

// Opciones de los filtros del mapa (fieles al prototipo-v3 · Map3).
const OP_TABS: [string, string][] = [
  ['', 'Todo'],
  ['venta', 'Venta'],
  ['renta', 'Renta'],
];
const TYPE_OPTS: [string, string][] = [
  ['', 'Tipo'],
  ['departamento', 'Departamentos'],
  ['casa', 'Casas'],
  ['oficina', 'Oficinas'],
  ['local_comercial', 'Locales'],
  ['bodega_industrial', 'Bodegas'],
  ['edificio', 'Edificios'],
  ['terreno', 'Terrenos'],
];
const BED_OPTS: [string, string][] = [
  ['', 'Recámaras'],
  ['1', '1+ rec.'],
  ['2', '2+ rec.'],
  ['3', '3+ rec.'],
];
const maxPriceOpts = (op: string): [string, string][] =>
  op === 'renta'
    ? [
        ['', 'Precio'],
        ['15000', 'Hasta $15k/mes'],
        ['30000', 'Hasta $30k/mes'],
        ['60000', 'Hasta $60k/mes'],
        ['120000', 'Hasta $120k/mes'],
      ]
    : [
        ['', 'Precio'],
        ['3000000', 'Hasta $3 MDP'],
        ['6000000', 'Hasta $6 MDP'],
        ['12000000', 'Hasta $12 MDP'],
        ['30000000', 'Hasta $30 MDP'],
      ];

// Píldora-select flotante sobre el mapa (precio/tipo/recámaras).
function PillSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  const active = !!value;
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'h-10 cursor-pointer appearance-none rounded-full py-2 pl-3.5 pr-8 text-[13px] font-medium outline-none shadow-[0_2px_10px_rgba(0,0,0,0.12)] backdrop-blur',
          active ? 'bg-navy text-white' : 'bg-white/95 text-navy',
        ].join(' ')}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v} className="text-navy">
            {l}
          </option>
        ))}
      </select>
      <span
        className={[
          'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2',
          active ? 'text-white' : 'text-navy',
        ].join(' ')}
      >
        <IChevD s={14} />
      </span>
    </div>
  );
}

type PointProps = { point: MapPoint };
type Feature = PointFeature<PointProps> | ClusterFeature<Record<string, never>>;

const isCluster = (f: Feature): f is ClusterFeature<Record<string, never>> =>
  (f.properties as { cluster?: boolean }).cluster === true;

function latLng(f: Feature): [number, number] {
  const [lng = 0, lat = 0] = f.geometry.coordinates;
  return [lat, lng];
}

const icon = (html: string) =>
  L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Contenido HTML de la burbuja (popup) de la propiedad activa. Es HTML porque los
// popups de Leaflet reciben markup, no JSX. Toda la tarjeta es un enlace a la ficha.
function popupHtml(p: MapPoint): string {
  const price = esc(pillPrice(p.price, p.currency, p.operation));
  const loc = esc(locationLabel(p.location ?? null));
  const type = p.propertyType ? esc(TYPE_LABEL_SINGULAR[p.propertyType]) : '';
  const beds = (p.bedrooms ?? 0) > 0 ? `${p.bedrooms} rec.` : '';
  const baths = (p.bathrooms ?? 0) > 0 ? `${p.bathrooms} baño${p.bathrooms === 1 ? '' : 's'}` : '';
  const area = p.areaM2 != null && Number(p.areaM2) > 0 ? `${Math.round(Number(p.areaM2))} m²` : '';
  const stats = [beds, baths, area].filter(Boolean).join('  ·  ');
  const imgHtml = p.cover?.urlWebp
    ? `<img src="${esc(p.cover.urlWebp)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />`
    : `<div style="position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,transparent,transparent 10px,rgba(255,255,255,0.05) 10px,rgba(255,255,255,0.05) 20px)"></div>`;
  const badge =
    p.featured !== 'normal'
      ? `<div style="position:absolute;top:8px;left:8px;background:linear-gradient(135deg,#E4C66A,#BE8C3C);color:#3A2A08;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700">★ Destacado</div>`
      : '';
  return `<a href="/propiedades/${p.slug}" style="display:block;width:216px;text-decoration:none;color:inherit">
    <div style="position:relative;height:118px;background:#0F1B2D;overflow:hidden">${imgHtml}${badge}</div>
    <div style="padding:10px 13px 13px">
      <div style="font-weight:700;font-size:17px;letter-spacing:-0.3px;color:#0F1B2D;margin-bottom:3px">${price}</div>
      <div style="font-size:11px;color:#6B7280;margin-bottom:8px;line-height:1.35">${type ? type + ' · ' : ''}${loc}</div>
      ${stats ? `<div style="font-size:11px;color:#0F1B2D;margin-bottom:9px">${stats}</div>` : ''}
      <span style="display:inline-flex;align-items:center;gap:4px;background:#0F1B2D;color:#fff;padding:6px 13px;border-radius:20px;font-size:12px;font-weight:600">Ver ficha →</span>
    </div>
  </a>`;
}

// ── Capa de mapa (dentro de <MapContainer>): clustering + pines + cámara ───────
function MapCanvas({
  points,
  activeId,
  onSelect,
}: {
  points: MapPoint[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const map = useMap();
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const popupRef = useRef<L.Popup | null>(null);
  const suppressClose = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const readBbox = useCallback((): Bbox => {
    const b = map.getBounds();
    return { minLng: b.getWest(), minLat: b.getSouth(), maxLng: b.getEast(), maxLat: b.getNorth() };
  }, [map]);

  // Encuadre sobre el inventario cuando cambian los puntos (carga / filtros).
  useEffect(() => {
    if (!points.length) return;
    const coords = points
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => [p.lat as number, p.lng as number] as [number, number]);
    if (!coords.length) return;
    const bounds = L.latLngBounds(coords);
    if (coords.length === 1) map.setView(bounds.getCenter(), 15);
    else map.fitBounds(bounds, { padding: [56, 56] });
    setBbox(readBbox());
    setZoom(Math.round(map.getZoom()));
  }, [points, map, readBbox]);

  useMapEvents({
    moveend: () => {
      setBbox(readBbox());
      setZoom(Math.round(map.getZoom()));
    },
  });

  // Al activar una propiedad (desde la lista o un pin), vuela hacia ella.
  useEffect(() => {
    if (!activeId) return;
    const p = points.find((x) => x.id === activeId);
    if (p && p.lat != null && p.lng != null) {
      map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 14), { duration: 0.7 });
    }
  }, [activeId, points, map]);

  // Burbuja (popup) anclada SOBRE el pin de la propiedad activa, con su foto,
  // precio y datos — como el diseño de referencia (prototipo-v3 · map-card). Se
  // maneja con la API imperativa de Leaflet porque su contenido es HTML.
  useEffect(() => {
    // Cierra el popup anterior sin que ese cierre se interprete como deselección.
    if (popupRef.current) {
      suppressClose.current = true;
      map.closePopup(popupRef.current);
      popupRef.current = null;
      suppressClose.current = false;
    }
    if (!activeId) return;
    const p = points.find((x) => x.id === activeId);
    if (!p || p.lat == null || p.lng == null) return;
    const popup = L.popup({
      closeButton: true,
      autoClose: false,
      closeOnClick: false,
      autoPan: false, // ya hacemos flyTo al punto
      offset: [0, -12],
      className: 'tar-map-popup',
      minWidth: 216,
      maxWidth: 240,
    })
      .setLatLng([p.lat, p.lng])
      .setContent(popupHtml(p));
    // Cierre por el usuario (botón × o al seleccionar otra) → deselecciona.
    popup.on('remove', () => {
      if (!suppressClose.current) onSelectRef.current(null);
    });
    popup.openOn(map);
    popupRef.current = popup;
  }, [activeId, points, map]);

  const index = useMemo(() => {
    const sc = new Supercluster<PointProps, Record<string, never>>({
      radius: 64,
      maxZoom: 16,
      minPoints: 3,
    });
    sc.load(
      points
        .filter((p) => p.lat != null && p.lng != null)
        .map((point) => ({
          type: 'Feature' as const,
          properties: { point },
          geometry: { type: 'Point' as const, coordinates: [point.lng as number, point.lat as number] },
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

  return (
    <>
      {clusters.map((f) => {
        if (isCluster(f)) {
          const count = f.properties.point_count as unknown as number;
          const id = f.properties.cluster_id as unknown as number;
          return (
            <Marker
              key={`cluster-${String(id)}`}
              position={latLng(f)}
              icon={icon(clusterBubbleHtml(count))}
              title={`${count} propiedades`}
              eventHandlers={{
                click: () => {
                  const next = Math.min(index.getClusterExpansionZoom(id), MAP_MAX_ZOOM);
                  map.setView(latLng(f), next);
                },
              }}
            />
          );
        }
        const p = f.properties.point;
        const isSel = activeId === p.id;
        const label = pillPrice(p.price, p.currency, p.operation);
        return (
          <Marker
            key={p.id}
            position={latLng(f)}
            icon={icon(pricePillHtml(label, p.featured, isSel))}
            zIndexOffset={isSel ? 1000 : p.featured !== 'normal' ? 500 : 100}
            title={label}
            eventHandlers={{ click: () => onSelect(p.id) }}
          />
        );
      })}
    </>
  );
}

// ── Tarjeta de la lista ────────────────────────────────────────────────────────
function ListCard({
  p,
  active,
  onSelect,
  cardRef,
}: {
  p: MapPoint;
  active: boolean;
  onSelect: () => void;
  cardRef: (el: HTMLButtonElement | null) => void;
}) {
  const premium = p.featured === 'premium';
  const featured = p.featured !== 'normal';
  const area = p.areaM2 != null && Number(p.areaM2) > 0 ? Math.round(Number(p.areaM2)) : null;
  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onSelect}
      className={[
        'group relative flex scroll-mt-3 flex-col overflow-hidden rounded-xl bg-white text-left transition-all',
        active
          ? 'border-2 border-brand ring-2 ring-brand/35 shadow-[0_12px_28px_rgba(210,16,62,0.32)]'
          : premium
            ? 'border-[1.5px] border-[#D9B65E] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]'
            : 'border border-line hover:border-navy/30 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]',
      ].join(' ')}
    >
      <div className="relative h-[124px] shrink-0 overflow-hidden bg-navy">
        {p.cover?.urlWebp ? (
          <Image
            src={p.cover.urlWebp}
            alt={p.title ?? ''}
            fill
            sizes="270px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_12px,rgba(255,255,255,0.04)_12px,rgba(255,255,255,0.04)_24px)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[60%] to-black/40" />
        {featured && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-premium-from to-premium-to px-2 py-[3px] text-[10px] font-bold text-[#3A2A08]">
            ★ Destacado
          </span>
        )}
        {active && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-[3px] text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_2px_10px_rgba(210,16,62,0.55)]">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Seleccionada
          </span>
        )}
      </div>
      <div className={['px-3.5 pb-3.5 pt-2.5', active ? 'bg-brand-soft/60' : ''].join(' ')}>
        <div
          className={[
            'mb-1 font-display text-[17px] font-bold tracking-[-0.3px]',
            active ? 'text-brand' : 'text-navy',
          ].join(' ')}
        >
          {pillPrice(p.price, p.currency, p.operation)}
        </div>
        <div className="mb-2 flex items-start gap-1 text-[11px] leading-tight text-muted">
          <span className="mt-px shrink-0">
            <IPin s={11} />
          </span>
          <span className="line-clamp-2">{locationLabel(p.location ?? null)}</span>
        </div>
        <div className="flex items-center gap-2.5 border-t border-[#F1F1F0] pt-2 text-[11px] text-ink">
          {(p.bedrooms ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <IBed s={11} />
              {p.bedrooms}
            </span>
          )}
          {(p.bathrooms ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <IBath s={11} />
              {p.bathrooms}
            </span>
          )}
          {area != null && (
            <span className="ml-auto flex items-center gap-1">
              <IRuler s={11} />
              {area} m²
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Componente principal ────────────────────────────────────────────────────────
export default function MapSplit({
  filters,
  params,
  suggestions,
}: {
  filters: MapSearchFilters;
  params: ListingParams;
  suggestions: Suggestion[];
}) {
  const setParams = useSetParams();
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [q, setQ] = useState(params.q);
  const [sort, setSort] = useState<'recent' | 'price-asc' | 'price-desc'>('recent');

  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const filtersKey = JSON.stringify(filters);

  // Mantiene el texto del buscador en sync con la URL (p. ej. al limpiar filtros).
  useEffect(() => {
    setQ(params.q);
  }, [params.q]);

  // Orden SOLO de la lista (los marcadores no dependen del orden). Los precios
  // vienen en la moneda de la operación filtrada; comparar el número basta.
  const listPoints = useMemo(() => {
    if (sort === 'recent') return points;
    const num = (p: MapPoint) => {
      const n = Number(p.price);
      return Number.isFinite(n) ? n : 0;
    };
    return [...points].sort((a, b) => (sort === 'price-asc' ? num(a) - num(b) : num(b) - num(a)));
  }, [points, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setActiveId(null);
    void (async () => {
      try {
        const data = await fetchMapPoints(filters);
        if (!cancelled) setPoints(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  // Al activar (por ejemplo desde un pin), asegura que la tarjeta sea visible.
  useEffect(() => {
    if (!activeId) return;
    cardRefs.current.get(activeId)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeId]);

  return (
    <div className="flex h-full min-h-[520px] w-full flex-col-reverse overflow-hidden bg-white lg:flex-row">
      {/* ── Panel de lista ── */}
      <div className="flex min-h-0 w-full flex-1 flex-col border-line lg:w-[380px] lg:flex-none lg:shrink-0 lg:border-r xl:w-[440px]">
        {/* Buscador + tabs de operación (como el prototipo) */}
        <div className="border-b border-line px-4 py-3.5">
          <LocationAutocomplete
            value={q}
            onChange={setQ}
            onPick={(v) => setParams({ q: v })}
            suggestions={suggestions}
            placeholder="Colonia, alcaldía, zona…"
            className="box-border w-full rounded-full border border-line bg-white py-2.5 pl-9 pr-3.5 text-[13px] text-navy outline-none transition-colors hover:border-navy/30 focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <div className="mt-2.5 flex gap-1.5">
            {OP_TABS.map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setParams({ operation: v, minPrice: '', maxPrice: '' })}
                className={[
                  'rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors',
                  params.operation === v
                    ? 'bg-brand-soft text-brand'
                    : 'bg-[#F7F7F6] text-muted hover:text-navy',
                ].join(' ')}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de resultados + orden */}
        <div className="flex items-baseline justify-between border-b border-line px-4 py-2.5">
          <div className="text-[13px] text-muted">
            <strong className="font-display text-base font-bold text-navy">
              {loading ? '…' : points.length}
            </strong>{' '}
            {points.length === 1 ? 'propiedad' : 'propiedades'}
          </div>
          <button
            type="button"
            onClick={() =>
              setSort((s) => (s === 'price-asc' ? 'price-desc' : s === 'price-desc' ? 'recent' : 'price-asc'))
            }
            className="flex items-center gap-1 text-[12px] font-medium text-muted transition-colors hover:text-navy"
          >
            Ordenar por precio
            <span className="text-navy">
              {sort === 'price-asc' ? '↑' : sort === 'price-desc' ? '↓' : '↕'}
            </span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted">Cargando propiedades…</div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-muted">
              No se pudieron cargar las propiedades.
            </div>
          ) : listPoints.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">
              Sin propiedades — ajusta los filtros.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {listPoints.map((p) => (
                <ListCard
                  key={p.id}
                  p={p}
                  active={activeId === p.id}
                  onSelect={() => setActiveId(p.id)}
                  cardRef={(el) => {
                    if (el) cardRefs.current.set(p.id, el);
                    else cardRefs.current.delete(p.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mapa ── */}
      <div className="relative h-[46vh] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          maxZoom={MAP_MAX_ZOOM}
          scrollWheelZoom
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer url={MAP_TILES_URL} attribution={MAP_TILES_ATTRIBUTION} />
          <ZoomControl position="bottomright" />
          <MapCanvas points={points} activeId={activeId} onSelect={setActiveId} />
        </MapContainer>

        {/* Píldoras de filtro flotantes sobre el mapa (precio/tipo/recámaras). */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex flex-wrap items-center gap-2 p-3">
          <div className="pointer-events-auto">
            <PillSelect
              value={params.maxPrice}
              onChange={(v) => setParams({ maxPrice: v })}
              options={maxPriceOpts(params.operation)}
            />
          </div>
          <div className="pointer-events-auto">
            <PillSelect value={params.type} onChange={(v) => setParams({ type: v })} options={TYPE_OPTS} />
          </div>
          <div className="pointer-events-auto">
            <PillSelect
              value={params.bedrooms}
              onChange={(v) => setParams({ bedrooms: v })}
              options={BED_OPTS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
