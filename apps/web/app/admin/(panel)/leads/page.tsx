'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LEAD_STATUSES, type LeadStatus } from '@tar/shared';
import { useLeads } from '@/lib/queries';
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

  const { data, isLoading, isError } = useLeads({
    status: status === 'all' ? undefined : status,
    page,
    limit: PER_PAGE,
  });

  const total = data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  function pick(s: LeadStatus | 'all') {
    setStatus(s);
    setPage(1);
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
                <th className="px-5 py-3 font-semibold">Nombre</th>
                <th className="px-5 py-3 font-semibold">Contacto</th>
                <th className="px-5 py-3 font-semibold">Tipo</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Recibido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.data.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => router.push(`/admin/leads/${lead.id}`)}
                  className="cursor-pointer transition hover:bg-canvas/60"
                >
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
