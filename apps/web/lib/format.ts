import type {
  FeaturedLevel,
  LeadStatus,
  LeadType,
  PropertyStatus,
  PropertyType,
} from '@tar/shared';

// Pipeline de leads con los colores exactos del prototipo (v3-admin.jsx).
export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; color: string }
> = {
  nuevo: { label: 'Nuevo', color: '#2563EB' },
  cita_agendada: { label: 'Cita agendada', color: '#CA8A04' },
  cita_concretada: { label: 'Cita concretada', color: '#7C3AED' },
  apartado: { label: 'Apartado', color: '#EA580C' },
  firma_contrato: { label: 'Firma de contrato', color: '#16A34A' },
  descartado: { label: 'Descartado', color: '#9CA3AF' },
};

export const LEAD_TYPE_LABEL: Record<LeadType, string> = {
  contacto: 'Contacto',
  cita: 'Cita',
};

// Etiquetas de tipo de propiedad (igual que TYPE_LABELS del prototipo).
export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  casa: 'Casas',
  departamento: 'Departamentos',
  oficina: 'Oficinas',
  local_comercial: 'Locales comerciales',
  bodega_industrial: 'Bodegas industriales',
  terreno_industrial: 'Terrenos industriales',
  edificio: 'Edificios',
  terreno: 'Terrenos',
};

// Estatus comercial de una propiedad — colores alineados al dashboard (queries.ts).
export const PROPERTY_STATUS_META: Record<
  PropertyStatus,
  { label: string; color: string }
> = {
  borrador: { label: 'Borrador', color: '#9CA3AF' },
  disponible: { label: 'Disponible', color: '#16A34A' },
  apartado: { label: 'Apartado', color: '#EA580C' },
  rentado: { label: 'Rentado', color: '#2563EB' },
  vendido: { label: 'Vendido', color: '#D2103E' },
  pausado: { label: 'Pausado', color: '#CA8A04' },
};

// Nivel de destaque (Premium / Destacada / normal).
export const FEATURED_META: Record<
  FeaturedLevel,
  { label: string; color: string } | null
> = {
  normal: null,
  destacada: { label: 'Destacada', color: '#CA8A04' },
  premium: { label: 'Premium', color: '#BE8C3C' },
};

// Formatea un precio en su moneda ORIGINAL (la guía del proyecto: nunca convertir
// para mostrar). `price` llega como string numérico de Postgres.
export function formatPrice(
  price: string | null | undefined,
  currency: string | null | undefined,
): string | null {
  if (price == null) return null;
  const n = Number(price);
  if (Number.isNaN(n)) return null;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency ?? 'MXN',
    maximumFractionDigits: 0,
  }).format(n);
}

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

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}
