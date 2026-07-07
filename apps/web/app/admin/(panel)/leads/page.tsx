'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LEAD_STATUSES, type LeadStatus } from '@tar/shared';
import { useBulkLeads, useLeads } from '@/lib/queries';
import { LeadStatusBadge } from '@/components/lead-status-badge';
import {
  LEAD_STATUS_META,
  LEAD_TYPE_LABEL,
  formatDate,
  initials,
} from '@/lib/format';

const PER_PAGE = 20;

export default function LeadsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const bulk = useBulkLeads();

  const { data, isLoading, isError } = useLeads({
    status: status === 'all' ? undefined : status,
    page,
    limit: PER_PAGE,
  });

  const total = data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const rows = data?.data ?? [];
  const allOnPage = rows.length > 0 && rows.every((l) => selected.has(l.id));

  function pick(s: LeadStatus | 'all') {
    setStatus(s);
    setPage(1);
    setSelected(new Set());
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) =>
      rows.every((l) => prev.has(l.id)) ? new Set() : new Set(rows.map((l) => l.id)),
    );
  }

  async function bulkStatus(s: LeadStatus) {
    const ids = [...selected];
    if (!ids.length) return;
    await bulk.mutateAsync({ ids, status: s });
    setSelected(new Set());
  }

  const tab = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-navy text-white'
        : 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-canvas'
    }`;

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-navy">Leads</h1>
        <p className="mt-1 text-sm text-muted">
          {total} {total === 1 ? 'lead' : 'leads'} en el pipeline.
        </p>
      </header>

      {/* Filtros por status */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button className={tab(status === 'all')} onClick={() => pick('all')}>
          Todos
        </button>
        {LEAD_STATUSES.map((s) => (
          <button key={s} className={tab(status === s)} onClick={() => pick(s)}>
            {LEAD_STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Barra de acciones masivas */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft/50 px-4 py-2.5 text-sm">
          <span className="font-semibold text-navy">
            {selected.size} seleccionado{selected.size === 1 ? '' : 's'}
          </span>
          <div className="mx-1 h-4 w-px bg-line" />
          <select
            disabled={bulk.isPending}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                void bulkStatus(e.target.value as LeadStatus);
                e.target.value = '';
              }
            }}
            className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink outline-none focus:border-brand"
          >
            <option value="">Cambiar etapa a…</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_META[s].label}
              </option>
            ))}
          </select>
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
            No se pudieron cargar los leads.
          </div>
        ) : isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-muted">Cargando…</div>
        ) : !data?.data.length ? (
          <div className="px-6 py-16 text-center text-sm text-muted">
            No hay leads con este filtro.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPage}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                    aria-label="Seleccionar todos"
                  />
                </th>
                <th className="px-5 py-3 font-semibold">Nombre</th>
                <th className="px-5 py-3 font-semibold">Contacto</th>
                <th className="px-5 py-3 font-semibold">Tipo</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Recibido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => router.push(`/admin/leads/${lead.id}`)}
                  className={`cursor-pointer transition hover:bg-canvas/60 ${
                    selected.has(lead.id) ? 'bg-brand-soft/30' : ''
                  }`}
                >
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggleOne(lead.id)}
                      className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                      aria-label={`Seleccionar ${lead.name}`}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-[12px] font-bold text-brand">
                        {initials(lead.name)}
                      </div>
                      <span className="font-medium text-navy">{lead.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    <div className="text-ink">{lead.email}</div>
                    {lead.phone && <div className="text-xs">{lead.phone}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {LEAD_TYPE_LABEL[lead.type]}
                  </td>
                  <td className="px-5 py-3.5">
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="px-5 py-3.5 text-muted">{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
