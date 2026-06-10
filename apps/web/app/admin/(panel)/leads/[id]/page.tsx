'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LEAD_STATUSES, type LeadStatus } from '@tar/shared';
import { useLead, useUpdateLead } from '@/lib/queries';
import { LeadStatusBadge } from '@/components/lead-status-badge';
import {
  LEAD_STATUS_META,
  LEAD_TYPE_LABEL,
  formatDateTime,
} from '@/lib/format';
import type { LeadEvent } from '@/lib/types';

function describeEvent(ev: LeadEvent): string {
  const p = (ev.payload ?? {}) as {
    status?: { from?: string; to?: string };
    assignedTo?: string | null;
  };
  if (ev.type === 'status_changed' && p.status) {
    const from = p.status.from as LeadStatus | undefined;
    const to = p.status.to as LeadStatus | undefined;
    const lbl = (s?: LeadStatus) => (s ? LEAD_STATUS_META[s].label : '—');
    return `Cambió de "${lbl(from)}" a "${lbl(to)}"`;
  }
  if (ev.type === 'assigned') return 'Reasignación de responsable';
  if (ev.type === 'created') return 'Lead recibido';
  return ev.type;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading, isError } = useLead(id);
  const update = useUpdateLead(id);

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-muted">Cargando…</div>;
  }
  if (isError || !lead) {
    return (
      <div className="py-16 text-center text-sm text-red-600">
        No se encontró el lead.{' '}
        <Link href="/admin/leads" className="text-brand underline">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/leads"
        className="mb-4 inline-block text-sm text-muted transition hover:text-brand"
      >
        ← Leads
      </Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-navy">{lead.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {LEAD_TYPE_LABEL[lead.type]} · recibido {formatDateTime(lead.createdAt)}
          </p>
        </div>
        <LeadStatusBadge status={lead.status} />
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Datos del contacto */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-display text-lg text-navy">Contacto</h2>
            <Row label="Correo" value={<a href={`mailto:${lead.email}`} className="text-brand hover:underline">{lead.email}</a>} />
            <Row label="Teléfono" value={lead.phone ?? '—'} />
            <Row label="Origen" value={lead.source ?? '—'} />
            <Row
              label="Cita preferida"
              value={lead.preferredAt ? formatDateTime(lead.preferredAt) : '—'}
            />
            <Row
              label="Propiedad"
              value={lead.propertyId ? 'Vinculada a un inmueble' : 'Consulta general'}
            />
            <Row
              label="Consentimiento LFPDPPP"
              value={lead.consentAt ? `Sí · ${formatDateTime(lead.consentAt)}` : '—'}
            />
          </section>

          {lead.message && (
            <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <h2 className="mb-3 font-display text-lg text-navy">Mensaje</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {lead.message}
              </p>
            </section>
          )}

          {/* Bitácora */}
          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-display text-lg text-navy">Bitácora</h2>
            {lead.events.length === 0 ? (
              <p className="text-sm text-muted">Sin actividad registrada.</p>
            ) : (
              <ol className="space-y-4">
                {lead.events.map((ev) => (
                  <li key={ev.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    <div>
                      <p className="text-sm text-navy">{describeEvent(ev)}</p>
                      <p className="text-xs text-muted">{formatDateTime(ev.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Cambiar estado */}
        <aside>
          <section className="sticky top-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h2 className="mb-1 font-display text-lg text-navy">Estado del lead</h2>
            <p className="mb-4 text-xs text-muted">
              Cada cambio queda en la bitácora y dispara el webhook configurado.
            </p>
            <div className="flex flex-col gap-2">
              {LEAD_STATUSES.map((s) => {
                const active = s === lead.status;
                return (
                  <button
                    key={s}
                    disabled={active || update.isPending}
                    onClick={() => update.mutate({ status: s })}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition disabled:cursor-default ${
                      active
                        ? 'border-brand bg-brand-soft font-semibold text-brand'
                        : 'border-line text-ink hover:border-navy hover:bg-canvas disabled:opacity-60'
                    }`}
                  >
                    {LEAD_STATUS_META[s].label}
                    {active && ' ·  actual'}
                  </button>
                );
              })}
            </div>
            {update.isError && (
              <p className="mt-3 text-xs text-red-600">
                No se pudo actualizar. Intenta de nuevo.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
