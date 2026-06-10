import type { LeadStatus, LeadType } from '@tar/shared';

// Etiquetas + colores del pipeline de leads (decisión del cliente, ronda 1).
export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; className: string }
> = {
  nuevo: { label: 'Nuevo', className: 'bg-blue-50 text-blue-700 ring-blue-600/15' },
  cita_agendada: {
    label: 'Cita agendada',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  cita_concretada: {
    label: 'Cita concretada',
    className: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  },
  apartado: {
    label: 'Apartado',
    className: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  },
  firma_contrato: {
    label: 'Firma de contrato',
    className: 'bg-green-50 text-green-700 ring-green-600/20',
  },
  descartado: {
    label: 'Descartado',
    className: 'bg-gray-100 text-gray-500 ring-gray-500/20',
  },
};

export const LEAD_TYPE_LABEL: Record<LeadType, string> = {
  contacto: 'Contacto',
  cita: 'Cita',
};

const dateFmt = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const dateTimeFmt = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFmt.format(d);
}

// "hace 2 h", "hace 3 d" — para listas de actividad reciente.
export function timeAgo(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return '';
  const diff = Date.now() - d;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.round(h / 24);
  return `hace ${days} d`;
}
