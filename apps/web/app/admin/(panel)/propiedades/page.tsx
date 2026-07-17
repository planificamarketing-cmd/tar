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
  useBulkProperties,
  useDeleteProperty,
  useDuplicateProperty,
  usePublishProperty,
  useRestoreProperty,
  useUnpublishProperty,
  useUpdatePropertyStatus,
  testWebhookEvent,
  type WebhookEventTest,
} from '@/lib/queries';
import { mediaUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  FeaturedBadge,
  PropertyStatusBadge,
  RemateBadge,
} from '@/components/property-status-badge';
import { NPlus, NSearch } from '@/components/icons';
import {
  PROPERTY_STATUS_META,
  PROPERTY_TYPE_LABEL,
  formatDate,
  formatPrice,
} from '@/lib/format';

const PER_PAGE = 20;

// 'all' + estatus reales + 'archived' (pseudo-filtro: soft-deleted).
type Tab = PropertyStatus | 'all' | 'archived';

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
  const { can } = useAuth();
  // ventas/lector solo tienen properties:read → ven el catálogo pero sin acciones.
  const canWrite = can('properties:write');
  const canWebhooks = can('webhooks:manage');
  const [tabSel, setTabSel] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [remateOnly, setRemateOnly] = useState(false);
  const [webhookTest, setWebhookTest] = useState<WebhookEventTest | null>(null);
  const [testing, setTesting] = useState(false);

  const archived = tabSel === 'archived';
  const { data, isLoading, isError } = useAdminProperties({
    status: tabSel === 'all' || archived ? undefined : (tabSel as PropertyStatus),
    q: search || undefined,
    page,
    limit: PER_PAGE,
    archived: archived ? 'true' : undefined,
    remate: remateOnly ? 'true' : undefined,
  });

  const publish = usePublishProperty();
  const unpublish = useUnpublishProperty();
  const changeStatus = useUpdatePropertyStatus();
  const duplicate = useDuplicateProperty();
  const restore = useRestoreProperty();
  const del = useDeleteProperty();
  const bulk = useBulkProperties();

  const total = data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const rows = data?.data ?? [];

  const busy =
    publish.isPending ||
    unpublish.isPending ||
    changeStatus.isPending ||
    duplicate.isPending ||
    restore.isPending ||
    del.isPending ||
    bulk.isPending;

  function pick(t: Tab) {
    setTabSel(t);
    setPage(1);
    setSelected(new Set());
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(q.trim());
    setPage(1);
  }

  // ── Selección múltiple ──
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) => {
      if (rows.every((r) => prev.has(r.id))) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }

  async function runBulk(
    action: 'publish' | 'unpublish' | 'archive' | 'restore' | 'status',
    status?: CommercialStatus,
  ) {
    const ids = [...selected];
    if (!ids.length) return;
    const res = await bulk.mutateAsync({ ids, action, status });
    setSelected(new Set());
    const failed = res.data.failed.length;
    if (failed) {
      window.alert(
        `${res.data.ok} aplicadas, ${failed} con error (p. ej. publicar requiere ubicación y precio).`,
      );
    }
  }

  async function onDelete(id: string, title: string) {
    if (!window.confirm(`¿Archivar «${title}»? Podrás restaurarla desde la pestaña Archivadas.`))
      return;
    await del.mutateAsync(id);
  }

  async function onProbeWebhooks() {
    setTesting(true);
    setWebhookTest(null);
    try {
      const r = await testWebhookEvent('property.published');
      setWebhookTest(r);
    } catch {
      setWebhookTest({ event: 'property.published', count: 0, results: [] });
    } finally {
      setTesting(false);
    }
  }

  const tab = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-navy text-white'
        : 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-canvas'
    }`;

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-navy sm:text-3xl">Propiedades</h1>
          <p className="mt-1 text-sm text-muted">
            {total} {total === 1 ? 'propiedad' : 'propiedades'}
            {archived ? ' archivadas' : ' en el inventario'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canWebhooks && (
            <button
              onClick={() => void onProbeWebhooks()}
              disabled={testing}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:bg-canvas disabled:opacity-50"
              title="Envía un evento property.published de prueba a los webhooks suscritos"
            >
              {testing ? 'Probando…' : 'Probar webhooks'}
            </button>
          )}
          {canWrite && (
            <Link
              href="/admin/propiedades/nueva"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
            >
              <NPlus s={16} /> Nueva propiedad
            </Link>
          )}
        </div>
      </header>

      {/* Resultado de la prueba de webhooks */}
      {webhookTest && (
        <div className="mb-4 rounded-xl border border-line bg-white p-4 text-sm shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-navy">
              Prueba de webhooks · evento <code>property.published</code>
            </span>
            <button
              onClick={() => setWebhookTest(null)}
              className="text-xs text-muted hover:text-ink"
            >
              Cerrar ✕
            </button>
          </div>
          {webhookTest.count === 0 ? (
            <p className="text-muted">
              No hay webhooks activos suscritos a este evento. Créalos en{' '}
              <Link href="/admin/ajustes" className="text-brand hover:underline">
                Ajustes → Integraciones
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-1">
              {webhookTest.results.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      r.ok ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-medium text-navy">{r.name}</span>
                  <span className="truncate text-xs text-muted">{r.targetUrl}</span>
                  <span className="ml-auto font-mono text-xs text-muted">
                    {r.ok ? `HTTP ${r.status}` : r.error ?? `HTTP ${r.status}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Filtros: estatus + Archivadas + búsqueda */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button className={tab(tabSel === 'all')} onClick={() => pick('all')}>
          Todas
        </button>
        {PROPERTY_STATUSES.map((s) => (
          <button key={s} className={tab(tabSel === s)} onClick={() => pick(s)}>
            {PROPERTY_STATUS_META[s].label}
          </button>
        ))}
        <button className={tab(archived)} onClick={() => pick('archived')}>
          Archivadas
        </button>
        <div className="mx-1 h-5 w-px bg-line" />
        <button
          className={tab(remateOnly)}
          onClick={() => {
            setRemateOnly((v) => !v);
            setPage(1);
          }}
          title="Mostrar solo propiedades marcadas en remate"
        >
          En remate
        </button>
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

      {/* Barra de acciones masivas (solo con permiso de escritura) */}
      {canWrite && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft/50 px-4 py-2.5 text-sm">
          <span className="font-semibold text-navy">
            {selected.size} seleccionada{selected.size === 1 ? '' : 's'}
          </span>
          <div className="mx-1 h-4 w-px bg-line" />
          {archived ? (
            <button
              disabled={busy}
              onClick={() => void runBulk('restore')}
              className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:bg-canvas disabled:opacity-50"
            >
              Restaurar
            </button>
          ) : (
            <>
              <button
                disabled={busy}
                onClick={() => void runBulk('publish')}
                className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
              >
                Publicar
              </button>
              <button
                disabled={busy}
                onClick={() => void runBulk('unpublish')}
                className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:bg-canvas disabled:opacity-50"
              >
                Regresar a borrador
              </button>
              <select
                disabled={busy}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    void runBulk('status', e.target.value as CommercialStatus);
                    e.target.value = '';
                  }
                }}
                className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink outline-none focus:border-brand"
              >
                <option value="">Cambiar estatus a…</option>
                {COMMERCIAL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROPERTY_STATUS_META[s].label}
                  </option>
                ))}
              </select>
              <button
                disabled={busy}
                onClick={() => void runBulk('archive')}
                className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-semibold text-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
              >
                Archivar
              </button>
            </>
          )}
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-muted hover:text-ink"
          >
            Limpiar selección
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {isError ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">
            No se pudieron cargar las propiedades.
          </div>
        ) : isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-muted">Cargando…</div>
        ) : !rows.length ? (
          <div className="px-6 py-16 text-center text-sm text-muted">
            {archived ? 'No hay propiedades archivadas.' : 'No hay propiedades con este filtro.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-line bg-canvas/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                {canWrite && (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allOnPage}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                      aria-label="Seleccionar todas"
                    />
                  </th>
                )}
                <th className="px-5 py-3 font-semibold">Propiedad</th>
                <th className="px-5 py-3 font-semibold">Tipo</th>
                <th className="px-5 py-3 font-semibold">Precio</th>
                <th className="px-5 py-3 font-semibold">Estatus</th>
                <th className="px-5 py-3 font-semibold">Creada</th>
                <th className="px-5 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className={`transition hover:bg-canvas/60 ${
                    selected.has(p.id) ? 'bg-brand-soft/30' : ''
                  }`}
                >
                  {canWrite && (
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                        className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                        aria-label={`Seleccionar ${p.title}`}
                      />
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-canvas ring-1 ring-line">
                        {p.cover ? (
                          <Image
                            src={mediaUrl(p.cover.urlThumb)}
                            alt=""
                            fill
                            sizes="56px"
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
                          <RemateBadge isRemate={p.isRemate} />
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
                    {!canWrite || archived || p.status === 'borrador' ? (
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
                      {!canWrite ? (
                        <Link
                          href={`/admin/propiedades/${p.id}`}
                          className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-canvas"
                        >
                          Ver
                        </Link>
                      ) : archived ? (
                        <button
                          disabled={busy}
                          onClick={() => void restore.mutate(p.id)}
                          className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:border-green-300 hover:text-green-700 disabled:opacity-50"
                        >
                          Restaurar
                        </button>
                      ) : (
                        <>
                          {p.status === 'borrador' ? (
                            <button
                              disabled={busy}
                              onClick={() => void publish.mutate(p.id)}
                              className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
                            >
                              Publicar
                            </button>
                          ) : (
                            <button
                              disabled={busy}
                              onClick={() => void unpublish.mutate(p.id)}
                              className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-canvas disabled:opacity-50"
                              title="Regresar a borrador (despublicar)"
                            >
                              A borrador
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
                            onClick={() => void duplicate.mutate(p.id)}
                            className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-canvas disabled:opacity-50"
                            title="Duplicar como borrador"
                          >
                            Duplicar
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => void onDelete(p.id, p.title)}
                            className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                          >
                            Archivar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {(publish.isError ||
        unpublish.isError ||
        changeStatus.isError ||
        duplicate.isError ||
        restore.isError ||
        del.isError) && (
        <p className="mt-3 text-sm text-red-600">
          No se pudo completar la acción. Para publicar, la propiedad necesita
          ubicación y precio.
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
