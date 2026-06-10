'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useDashboardStats } from '@/lib/queries';
import { LeadStatusBadge } from '@/components/lead-status-badge';
import { LEAD_TYPE_LABEL, timeAgo } from '@/lib/format';

function KpiCard({
  value,
  label,
  hint,
  loading,
}: {
  value: number | undefined;
  label: string;
  hint: string;
  loading: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="absolute left-5 top-0 h-0.5 w-9 bg-brand" />
      <p className="font-display text-4xl text-navy">
        {loading ? (
          <span className="inline-block h-9 w-12 animate-pulse rounded bg-line align-middle" />
        ) : (
          (value ?? 0).toLocaleString('es-MX')
        )}
      </p>
      <p className="mt-2 text-sm font-semibold text-navy">{label}</p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboardStats();

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-navy">
          Hola, {user?.name?.split(' ')[0] ?? 'equipo'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Resumen del portal en tiempo real.
        </p>
      </header>

      {isError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar los indicadores. Revisa que la API esté activa.
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard value={data?.published} label="Propiedades publicadas" hint="Visibles al público" loading={isLoading} />
        <KpiCard value={data?.leadsNuevos} label="Leads nuevos" hint="Sin atender" loading={isLoading} />
        <KpiCard value={data?.citasAgendadas} label="Citas agendadas" hint="Por concretar" loading={isLoading} />
        <KpiCard value={data?.leadsTotal} label="Leads totales" hint="Histórico" loading={isLoading} />
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-navy">Leads recientes</h2>
          <Link href="/admin/leads" className="text-sm font-medium text-brand hover:text-brand-hover">
            Ver todos →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted">
            Cargando…
          </div>
        ) : !data?.recentLeads.length ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
            Aún no hay leads.
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {data.recentLeads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center justify-between gap-4 py-3 transition hover:bg-canvas/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy">{lead.name}</p>
                    <p className="truncate text-xs text-muted">
                      {LEAD_TYPE_LABEL[lead.type]} · {lead.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <LeadStatusBadge status={lead.status} />
                    <span className="w-16 text-right text-xs text-muted">
                      {timeAgo(lead.createdAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
