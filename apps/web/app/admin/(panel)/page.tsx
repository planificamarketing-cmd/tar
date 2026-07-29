'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useDashboard, type DashboardData } from '@/lib/queries';
import { LeadStatusBadge } from '@/components/lead-status-badge';
import { ExportCsvButton } from '@/components/export-csv-button';
import { LEAD_TYPE_LABEL, formatDate, initials } from '@/lib/format';
import {
  NBuilding,
  NTenant,
  NMsg,
  NRent,
  NUpload,
  type IconProps,
} from '@/components/icons';

const card = 'rounded-2xl border border-line bg-white p-5 shadow-sm';

function Kpi({
  Icon,
  chipBg,
  chipColor,
  value,
  label,
  hint,
  loading,
}: {
  Icon: (p: IconProps) => React.ReactNode;
  chipBg: string;
  chipColor: string;
  value: number | undefined;
  label: string;
  hint: string;
  loading: boolean;
}) {
  return (
    <div className={card}>
      <div className="mb-3.5 flex items-start justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: chipBg, color: chipColor }}
        >
          <Icon s={18} />
        </div>
      </div>
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="font-display text-[32px] font-bold leading-none tracking-tight text-navy">
        {loading ? (
          <span className="inline-block h-8 w-10 animate-pulse rounded bg-line align-middle" />
        ) : (
          (value ?? 0).toLocaleString('es-MX')
        )}
      </div>
      <div className="mt-1 text-[11px] font-medium text-muted">{hint}</div>
    </div>
  );
}

function MonthlyChart({ data }: { data: DashboardData['monthlyLeads'] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((a, b) => a + b.count, 0);
  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-display text-[17px] font-bold text-navy">Leads por mes</div>
          <div className="mt-0.5 text-xs text-muted">
            Por fecha de registro · últimos 12 meses · Total:{' '}
            <strong className="text-navy">{total}</strong>
          </div>
        </div>
      </div>
      <div className="flex h-[180px] items-end justify-between gap-2 px-1">
        {data.map((d, i) => {
          const h = Math.max(4, Math.round((d.count / max) * 150));
          const isMax = d.count === max && d.count > 0;
          return (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span
                className={`font-mono text-[10px] ${isMax ? 'font-bold text-brand' : 'text-muted'}`}
                style={{ opacity: isMax || h > 60 ? 1 : 0 }}
              >
                {d.count}
              </span>
              <div
                className="w-full rounded-t"
                style={{ height: `${h}px`, backgroundColor: isMax ? '#D2103E' : '#0F1B2D' }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between px-1">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-muted">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function MixChart({ data, total }: { data: DashboardData['typeMix']; total: number }) {
  return (
    <div className={card}>
      <div className="font-display text-[17px] font-bold text-navy">Mix de inventario</div>
      <div className="mb-5 text-xs text-muted">Por tipo de propiedad</div>
      <div className="flex flex-col gap-4">
        {data.map((m) => (
          <div key={m.label}>
            <div className="mb-1.5 flex justify-between">
              <span className="text-[13px] font-medium text-ink">{m.label}</span>
              <span className="font-display text-[15px] font-bold text-navy">{m.pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-line">
              <div className="h-full rounded" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between border-t border-line pt-4">
        <span className="text-xs text-muted">Total inventario</span>
        <span className="font-display text-lg font-bold text-navy">{total} propiedades</span>
      </div>
    </div>
  );
}

function StatusChart({ data, total }: { data: DashboardData['statusMix']; total: number }) {
  return (
    <div className={card}>
      <div className="font-display text-[17px] font-bold text-navy">Estado de propiedades</div>
      <div className="mb-5 text-xs text-muted">Distribución del inventario</div>
      <div className="flex flex-col gap-4">
        {data.map((s) => (
          <div key={s.label}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: s.color }} />
                <span className="text-[13px] font-medium text-ink">{s.label}</span>
              </div>
              <span className="font-display text-lg font-bold text-navy">{s.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded bg-line">
              <div
                className="h-full rounded"
                style={{ width: `${total ? (s.count / total) * 100 : 0}%`, backgroundColor: s.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, can } = useAuth();
  const { data, isLoading, isError } = useDashboard();

  function exportCsv() {
    if (!data) return;
    const rows = [
      ['Indicador', 'Valor'],
      ['Propiedades publicadas', data.kpis.published],
      ['Leads del mes', data.kpis.leadsMonth],
      ['En seguimiento', data.kpis.enSeguimiento],
      ['Cierres', data.kpis.cierres],
      [],
      ['Tipo de propiedad', 'Cantidad'],
      ...data.typeMix.map((t) => [t.label, t.count]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resumen-tar.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header de bienvenida */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] leading-tight tracking-tight text-navy sm:text-[34px]">
            Bienvenido,{' '}
            <span className="italic text-muted">{user?.name?.split(' ')[0] ?? 'equipo'}</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted">Resumen general de actividad.</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          {can('leads:read') && (
            <ExportCsvButton
              path="/leads/export.csv"
              filename="leads-tar.csv"
              label="Leads"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-ink transition hover:bg-canvas disabled:opacity-50"
            />
          )}
          {can('properties:read') && (
            <ExportCsvButton
              path="/properties/admin/export.csv"
              filename="inventario-tar.csv"
              label="Inventario"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-ink transition hover:bg-canvas disabled:opacity-50"
            />
          )}
          <button
            onClick={exportCsv}
            disabled={!data}
            className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-ink transition hover:bg-canvas disabled:opacity-50"
            title="Descarga un resumen de indicadores (KPIs y mix de inventario)"
          >
            <NUpload s={14} /> Resumen
          </button>
        </div>
      </div>

      {isError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar los indicadores. Revisa que la API esté activa.
        </div>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi Icon={NBuilding} chipBg="#FFF0F2" chipColor="#D2103E" value={data?.kpis.published} label="Propiedades publicadas" hint={`${data?.kpis.drafts ?? 0} en borrador`} loading={isLoading} />
        <Kpi Icon={NTenant} chipBg="#EFF6FF" chipColor="#2563EB" value={data?.kpis.leadsMonth} label="Leads del mes" hint="Registrados este mes" loading={isLoading} />
        <Kpi Icon={NMsg} chipBg="#FEF3C7" chipColor="#CA8A04" value={data?.kpis.enSeguimiento} label="En seguimiento" hint="Pipeline activo" loading={isLoading} />
        <Kpi Icon={NRent} chipBg="#DCFCE7" chipColor="#16A34A" value={data?.kpis.cierres} label="Cierres" hint="Firma de contrato" loading={isLoading} />
      </div>

      {/* Charts row 1 */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        {data ? <MonthlyChart data={data.monthlyLeads} /> : <div className={`${card} h-[300px]`} />}
        {data ? <MixChart data={data.typeMix} total={data.totalProperties} /> : <div className={`${card} h-[300px]`} />}
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
        {data ? <StatusChart data={data.statusMix} total={data.totalProperties} /> : <div className={`${card} h-[240px]`} />}

        <div className={card}>
          <div className="mb-3.5 flex items-center justify-between">
            <div className="font-display text-[17px] font-bold text-navy">Leads recientes</div>
            <Link href="/admin/leads" className="text-xs font-semibold text-brand hover:text-brand-hover">
              Ver todos ↗
            </Link>
          </div>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted">Cargando…</div>
          ) : !data?.recentLeads.length ? (
            <div className="py-10 text-center text-sm text-muted">Aún no hay leads.</div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  {['Cliente', 'Interés', 'Fecha', 'Estado'].map((h) => (
                    <th key={h} className="px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentLeads.map((l) => (
                  <tr key={l.id} className="border-b border-line/60 last:border-0">
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft font-display text-[12px] font-bold text-brand">
                          {initials(l.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-navy">{l.name}</div>
                          <div className="truncate text-[11px] text-muted">{l.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-xs text-ink">{LEAD_TYPE_LABEL[l.type]}</td>
                    <td className="px-2 py-2.5 text-xs text-muted">{formatDate(l.createdAt)}</td>
                    <td className="px-2 py-2.5">
                      <LeadStatusBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
