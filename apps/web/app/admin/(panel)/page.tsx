'use client';

import { useAuth } from '@/lib/auth';

const KPIS = [
  { label: 'Propiedades', hint: 'Total en catálogo' },
  { label: 'Publicadas', hint: 'Visibles al público' },
  { label: 'Leads nuevos', hint: 'Sin atender' },
  { label: 'Visitas', hint: 'Últimos 30 días' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-navy">
          Hola, {user?.name?.split(' ')[0] ?? 'equipo'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Resumen del portal. Los indicadores en vivo se conectan en el siguiente
          incremento de la Fase C.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm"
          >
            <div className="absolute left-5 top-0 h-0.5 w-9 bg-brand" />
            <p className="font-display text-4xl text-navy">—</p>
            <p className="mt-2 text-sm font-semibold text-navy">{kpi.label}</p>
            <p className="text-xs text-muted">{kpi.hint}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl text-navy">Leads recientes</h2>
        <p className="mt-2 text-sm text-muted">
          Aquí aparecerá la actividad reciente (contactos y citas) en cuanto se
          conecte el tablero de leads.
        </p>
        <div className="mt-4 flex h-32 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
          Próximamente
        </div>
      </section>
    </div>
  );
}
