'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  COMMERCIAL_STATUSES,
  PROPERTY_STATUSES,
  type CommercialStatus,
  type PropertyStatus,
} from '@tar/shared';
import {
  useAdminProperties,
  useDeleteProperty,
  usePublishProperty,
  useUpdatePropertyStatus,
} from '@/lib/queries';
import {
  FeaturedBadge,
  PropertyStatusBadge,
} from '@/components/property-status-badge';
import { NPlus, NSearch } from '@/components/icons';
import {
  PROPERTY_STATUS_META,
  PROPERTY_TYPE_LABEL,
  formatDate,
  formatPrice,
} from '@/lib/format';

const PER_PAGE = 20;

// Precio a mostrar: venta si existe; si no, renta con sufijo «/mes». Moneda ORIGINAL.
function priceLabel(p: {
  priceSale: string | null;
  currencySale: string | null;
  priceRent: string | null;
  currencyRent: string | null;
}): string {
  const sale = formatPrice(p.priceSale, p.currencySale);
  if (sale) return sale;
  const rent = formatPrice(p.priceRent, p.currencyRent);
  return rent ? `${rent}/mes` : '—';
}

export default function PropertiesPage() {
  const [status, setStatus] = useState<PropertyStatus | 'all'>('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminProperties({
    status: status === 'all' ? undefined : status,
    q: search || undefined,
    page,
    limit: PER_PAGE,
  });

  const publish = usePublishProperty();
  const changeStatus = useUpdatePropertyStatus();
  const del = useDeleteProperty();

  const total = data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  function pick(s: PropertyStatus | 'all') {
    setStatus(s);
    setPage(1);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(q.trim());
    setPage(1);
  }

  async function onDelete(id: string, title: string) {
    if (!window.confirm(`¿Archivar «${title}»? Podrás recuperarla después.`)) return;
    await del.mutateAsync(id);
  }

  const tab = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-navy text-white'
        : 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-canvas'
    }`;

  const busy = publish.isPending || changeStatus.isPending || del.isPending;

  return (
    <div>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-navy">Propiedades</h1>
          <p className="mt-1 text-sm text-muted">
            {total} {total === 1 ? 'propiedad' : 'propiedades'} en el inventario.
          </p>
        </div>
        <Link
          href="/admin/propiedades/nueva"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
        >
          <NPlus s={16} /> Nueva propiedad
        </Link>
      </header>

      {/* Filtros: estatus + búsqueda */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button className={tab(status === 'all')} onClick={() => pick('all')}>
          Todas
        </button>
        {PROPERTY_STATUSES.map((s) => (
          <button key={s} className={tab(status === s)} onClick={() => pick(s)}>
            {PROPERTY_STATUS_META[s].label}
          </button>
        ))}
        <form onSubmit={submitSearch} className="ml-auto flex items-center">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <NSearch s={15} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título…"
              className="w-60 rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-brand"
            />
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {isError ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">
            No se pudieron cargar las propiedades.
          </div>
        ) : isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-muted">Cargando…</div>
        ) : !data?.data.length ? (
          <div className="px-6 py-16 text-center text-sm text-muted">
            No hay propiedades con este filtro.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Propiedad</th>
                <th className="px-5 py-3 font-semibold">Tipo</th>
                <th className="px-5 py-3 font-semibold">Precio</th>
                <th className="px-5 py-3 font-semibold">Estatus</th>
                <th className="px-5 py-3 font-semibold">Creada</th>
                <th className="px-5 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.data.map((p) => (
                <tr key={p.id} className="transition hover:bg-canvas/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-canvas ring-1 ring-line">
                        {p.cover ? (
                          <Image
                            src={p.cover.urlThumb}
                            alt=""
                            fill
                            sizes="56px"
                            // Panel interno (sin métricas §9) + host de media dinámico
                            // (WSL/localhost) → se evita el optimizador y remotePatterns.
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                            sin foto
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/propiedades/${p.id}`}
                          className="flex items-center gap-2 font-medium text-navy hover:text-brand"
                        >
                          <span className="truncate">{p.title}</span>
                          <FeaturedBadge level={p.featured} />
                        </Link>
                        <div className="truncate text-xs text-muted">
                          {p.location?.colonia
                            ? `${p.location.colonia}, ${p.location.municipio ?? ''}`
                            : 'Sin ubicación'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {PROPERTY_TYPE_LABEL[p.propertyType]}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-ink">{priceLabel(p)}</td>
                  <td className="px-5 py-3.5">
                    {p.status === 'borrador' ? (
                      <PropertyStatusBadge status={p.status} />
                    ) : (
                      <select
                        value={p.status}
                        disabled={busy}
                        onChange={(e) =>
                          void changeStatus.mutate({
                            id: p.id,
                            status: e.target.value as CommercialStatus,
                          })
                        }
                        className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink outline-none focus:border-brand"
                      >
                        {COMMERCIAL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {PROPERTY_STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{formatDate(p.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === 'borrador' && (
                        <button
                          disabled={busy}
                          onClick={() => void publish.mutate(p.id)}
                          className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
                        >
                          Publicar
                        </button>
                      )}
                      <Link
                        href={`/admin/propiedades/${p.id}`}
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-canvas"
                      >
                        Editar
                      </Link>
                      <button
                        disabled={busy}
                        onClick={() => void onDelete(p.id, p.title)}
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                      >
                        Archivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(publish.isError || changeStatus.isError || del.isError) && (
        <p className="mt-3 text-sm text-red-600">
          No se pudo completar la acción. Verifica que la propiedad tenga ubicación
          y precio antes de publicar.
        </p>
      )}

      {pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-ink transition enabled:hover:bg-canvas disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-muted">
            Página {page} de {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-ink transition enabled:hover:bg-canvas disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
