import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { LeadStatus } from '@tar/shared';
import { apiFetch } from './api';
import type { Lead, LeadDetail, Paginated, PropertyListItem } from './types';
import { PROPERTY_TYPE_LABEL } from './format';

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ── Leads ─────────────────────────────────────────────────────────────────────
export type LeadsParams = {
  status?: LeadStatus;
  page?: number;
  limit?: number;
};

export function useLeads(params: LeadsParams) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => apiFetch<Paginated<Lead>>(`/leads${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => apiFetch<{ data: LeadDetail } | LeadDetail>(`/leads/${id}`),
    select: (r) => ('data' in (r as { data?: unknown }) ? (r as { data: LeadDetail }).data : (r as LeadDetail)),
  });
}

export function useUpdateLead(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { status?: LeadStatus; assignedTo?: string | null }) =>
      apiFetch(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lead', id] });
      void qc.invalidateQueries({ queryKey: ['leads'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export type DashboardData = {
  kpis: {
    published: number;
    leadsMonth: number;
    enSeguimiento: number;
    cierres: number;
  };
  monthlyLeads: { label: string; count: number }[];
  typeMix: { label: string; count: number; pct: number; color: string }[];
  statusMix: { label: string; count: number; color: string }[];
  totalProperties: number;
  recentLeads: Lead[];
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TYPE_COLORS = ['#0F1B2D', '#D2103E', '#CA8A04', '#2563EB', '#16A34A', '#7C3AED', '#EA580C', '#0D9488'];
const STATUS_META: { key: string; label: string; color: string }[] = [
  { key: 'disponible', label: 'Disponibles', color: '#16A34A' },
  { key: 'apartado', label: 'Apartadas', color: '#EA580C' },
  { key: 'rentado', label: 'Rentadas', color: '#2563EB' },
  { key: 'vendido', label: 'Vendidas', color: '#D2103E' },
  { key: 'pausado', label: 'Pausadas', color: '#CA8A04' },
  { key: 'borrador', label: 'Borradores', color: '#9CA3AF' },
];

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      // El límite máximo de paginación de la API es 50. `meta.total` da el total
      // real; el mix por tipo y los buckets mensuales se calculan sobre la muestra
      // (suficiente hoy; con más volumen se añadirá un endpoint de agregados).
      const [props, leadsRes] = await Promise.all([
        apiFetch<Paginated<PropertyListItem>>('/properties?limit=50'),
        apiFetch<Paginated<Lead>>('/leads?limit=50'),
      ]);
      const properties = props.data;
      const leads = leadsRes.data;

      // KPIs
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const leadsMonth = leads.filter((l) => {
        const d = new Date(l.createdAt);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }).length;
      const enSeguimiento = leads.filter((l) =>
        ['nuevo', 'cita_agendada', 'cita_concretada', 'apartado'].includes(l.status),
      ).length;
      const cierres = leads.filter((l) => l.status === 'firma_contrato').length;

      // Leads por mes — últimos 12 meses
      const buckets = new Map<string, number>();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(thisYear, thisMonth - i, 1);
        buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
      }
      for (const l of leads) {
        const d = new Date(l.createdAt);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
      }
      const monthlyLeads = [...buckets.keys()].map((k) => ({
        label: MONTHS[Number(k.split('-')[1])] ?? '',
        count: buckets.get(k) ?? 0,
      }));

      // Mix por tipo
      const typeCounts = new Map<string, number>();
      for (const p of properties) {
        typeCounts.set(p.propertyType, (typeCounts.get(p.propertyType) ?? 0) + 1);
      }
      const totalProps = properties.length || 1;
      const typeMix = [...typeCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([type, count], i) => ({
          label: PROPERTY_TYPE_LABEL[type as keyof typeof PROPERTY_TYPE_LABEL] ?? type,
          count,
          pct: Math.round((count / totalProps) * 100),
          color: TYPE_COLORS[i % TYPE_COLORS.length] ?? '#0F1B2D',
        }));

      // Estado de propiedades
      const statusCounts = new Map<string, number>();
      for (const p of properties) {
        statusCounts.set(p.status, (statusCounts.get(p.status) ?? 0) + 1);
      }
      const statusMix = STATUS_META.filter(
        (s) => (statusCounts.get(s.key) ?? 0) > 0,
      ).map((s) => ({ label: s.label, count: statusCounts.get(s.key) ?? 0, color: s.color }));

      return {
        kpis: { published: props.meta.total, leadsMonth, enSeguimiento, cierres },
        monthlyLeads,
        typeMix,
        statusMix,
        totalProperties: props.meta.total,
        recentLeads: leads.slice(0, 5),
      };
    },
  });
}
