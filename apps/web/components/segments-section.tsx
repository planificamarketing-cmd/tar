'use client';

import { useState } from 'react';
import {
  FEATURED_LEVELS,
  PROPERTY_TYPES,
  type FeedFormat,
  type SegmentFilters,
} from '@tar/shared';
import {
  useCreateSegment,
  useDeleteSegment,
  useSegments,
  useUpdateSegment,
} from '@/lib/queries';
import { apiUrl } from '@/lib/api';
import { PROPERTY_TYPE_LABEL } from '@/lib/format';
import type { PropertySegment } from '@/lib/types';

const inputCls =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand';
const labelCls = 'mb-1 block text-xs font-semibold text-muted';

// Resumen legible de los filtros de un segmento.
function summarize(f: SegmentFilters): string {
  const parts: string[] = [];
  if (f.operation) parts.push(f.operation === 'venta' ? 'Venta' : 'Renta');
  if (f.type) parts.push(PROPERTY_TYPE_LABEL[f.type]);
  if (f.minPrice != null) parts.push(`≥ $${f.minPrice.toLocaleString('es-MX')}`);
  if (f.maxPrice != null) parts.push(`≤ $${f.maxPrice.toLocaleString('es-MX')}`);
  if (f.minBedrooms != null) parts.push(`${f.minBedrooms}+ rec`);
  if (f.estado) parts.push(f.estado);
  if (f.municipio) parts.push(f.municipio);
  if (f.colonia) parts.push(f.colonia);
  if (f.featured) parts.push(f.featured);
  if (f.remate) parts.push('En remate');
  return parts.length ? parts.join(' · ') : 'Sin filtros (todo el catálogo)';
}

export function SegmentsSection() {
  const { data: segments, isLoading } = useSegments();
  const del = useDeleteSegment();
  const update = useUpdateSegment();
  const [modal, setModal] = useState<PropertySegment | 'new' | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copyFeed(seg: PropertySegment) {
    const url = apiUrl(`/feeds/meta/${seg.feedToken}.csv`);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(seg.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      window.prompt('Copia la URL del feed:', url);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl text-navy">Segmentos · Meta</h2>
          <p className="mt-0.5 text-sm text-muted">
            Crea conjuntos estrictos de propiedades y comparte su <strong>feed</strong>{' '}
            (catálogo) con Meta. Solo incluye propiedades <strong>disponibles</strong>{' '}
            que cumplan todos los filtros.
          </p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
        >
          Nuevo segmento
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : !segments?.length ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            Aún no hay segmentos. Crea el primero para generar un feed de Meta.
          </p>
        ) : (
          segments.map((seg) => (
            <div
              key={seg.id}
              className="rounded-xl border border-line p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-navy">{seg.name}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={
                    seg.isActive
                      ? { backgroundColor: '#DCFCE7', color: '#15803D' }
                      : { backgroundColor: '#F1F3F5', color: '#6B7280' }
                  }
                >
                  {seg.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
                  {seg.matchCount ?? 0} propiedades
                </span>
                <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-line">
                  {seg.feedFormat === 'commerce' ? 'Comercial' : 'Inmobiliario'}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => copyFeed(seg)}
                    className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-canvas"
                  >
                    {copied === seg.id ? '¡Copiado!' : 'Copiar feed'}
                  </button>
                  <button
                    onClick={() =>
                      void update.mutate({
                        id: seg.id,
                        body: { isActive: !seg.isActive },
                      })
                    }
                    className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-canvas"
                  >
                    {seg.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => setModal(seg)}
                    className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-canvas"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Eliminar el segmento «${seg.name}»?`))
                        void del.mutate(seg.id);
                    }}
                    className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-red-300 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted">{summarize(seg.filters)}</p>
              <code className="mt-2 block truncate rounded-lg bg-canvas px-2.5 py-1.5 font-mono text-[11px] text-ink">
                {apiUrl(`/feeds/meta/${seg.feedToken}.csv`)}
              </code>
            </div>
          ))
        )}
      </div>

      {modal && (
        <SegmentModal
          segment={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}

// ── Modal de alta/edición ──
function SegmentModal({
  segment,
  onClose,
}: {
  segment: PropertySegment | null;
  onClose: () => void;
}) {
  const create = useCreateSegment();
  const update = useUpdateSegment();
  const isNew = !segment;

  const f = segment?.filters ?? {};
  const [name, setName] = useState(segment?.name ?? '');
  const [feedFormat, setFeedFormat] = useState<FeedFormat>(
    segment?.feedFormat ?? 'home_listings',
  );
  const [operation, setOperation] = useState(f.operation ?? '');
  const [type, setType] = useState(f.type ?? '');
  const [minPrice, setMinPrice] = useState(f.minPrice != null ? String(f.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState(f.maxPrice != null ? String(f.maxPrice) : '');
  const [minBedrooms, setMinBedrooms] = useState(
    f.minBedrooms != null ? String(f.minBedrooms) : '',
  );
  const [estado, setEstado] = useState(f.estado ?? '');
  const [municipio, setMunicipio] = useState(f.municipio ?? '');
  const [colonia, setColonia] = useState(f.colonia ?? '');
  const [featured, setFeatured] = useState(f.featured ?? '');
  const [remate, setRemate] = useState(Boolean(f.remate));
  const [error, setError] = useState<string | null>(null);

  const num = (v: string) => {
    const t = v.trim();
    if (t === '') return undefined;
    const n = Number(t);
    return Number.isNaN(n) ? undefined : n;
  };
  const str = (v: string) => (v.trim() === '' ? undefined : v.trim());

  async function save() {
    if (name.trim().length < 1) {
      setError('El nombre es obligatorio.');
      return;
    }
    const filters: SegmentFilters = {
      operation: (operation || undefined) as SegmentFilters['operation'],
      type: (type || undefined) as SegmentFilters['type'],
      minPrice: num(minPrice),
      maxPrice: num(maxPrice),
      minBedrooms: num(minBedrooms),
      estado: str(estado),
      municipio: str(municipio),
      colonia: str(colonia),
      featured: (featured || undefined) as SegmentFilters['featured'],
      remate: remate || undefined,
    };
    // Elimina claves undefined (el backend valida con .strict()).
    (Object.keys(filters) as (keyof SegmentFilters)[]).forEach((k) => {
      if (filters[k] === undefined) delete filters[k];
    });
    try {
      if (isNew)
        await create.mutateAsync({ name: name.trim(), filters, feedFormat, isActive: true });
      else
        await update.mutateAsync({
          id: segment!.id,
          body: { name: name.trim(), filters, feedFormat },
        });
      onClose();
    } catch {
      setError('No se pudo guardar. Revisa los datos.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg text-navy">
          {isNew ? 'Nuevo segmento' : 'Editar segmento'}
        </h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Formato del feed</label>
            <select
              value={feedFormat}
              onChange={(e) => setFeedFormat(e.target.value as FeedFormat)}
              className={inputCls}
            >
              <option value="home_listings">Inmobiliario (Home Listings)</option>
              <option value="commerce">Catálogo comercial</option>
            </select>
            <p className="mt-1 text-[11px] text-muted">
              Usa <strong>Inmobiliario</strong> si tu catálogo en Meta es de bienes
              raíces; <strong>Comercial</strong> para un catálogo genérico.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Operación</label>
              <select value={operation} onChange={(e) => setOperation(e.target.value)} className={inputCls}>
                <option value="">Cualquiera</option>
                <option value="venta">Venta</option>
                <option value="renta">Renta</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                <option value="">Cualquiera</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{PROPERTY_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Precio mín. (MXN)</label>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Precio máx. (MXN)</label>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Recámaras mín.</label>
              <input type="number" value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Destaque</label>
              <select value={featured} onChange={(e) => setFeatured(e.target.value)} className={inputCls}>
                <option value="">Cualquiera</option>
                {FEATURED_LEVELS.filter((l) => l !== 'normal').map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div><label className={labelCls}>Estado</label><input value={estado} onChange={(e) => setEstado(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Municipio</label><input value={municipio} onChange={(e) => setMunicipio(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Colonia</label><input value={colonia} onChange={(e) => setColonia(e.target.value)} className={inputCls} /></div>
          </div>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" checked={remate} onChange={(e) => setRemate(e.target.checked)} className="h-4 w-4 rounded border-line text-brand focus:ring-brand" />
            <span className="text-sm font-medium text-ink">Solo propiedades en remate</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas">
            Cancelar
          </button>
          <button
            onClick={() => void save()}
            disabled={create.isPending || update.isPending}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
