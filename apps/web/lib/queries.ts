import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { LeadStatus } from '@tar/shared';
import { apiFetch } from './api';
import type { Lead, LeadDetail, Paginated } from './types';

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
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export type DashboardStats = {
  published: number;
  leadsTotal: number;
  leadsNuevos: number;
  citasAgendadas: number;
  recentLeads: Lead[];
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const totalOf = (r: Paginated<unknown>) => r.meta.total;
      const [published, leadsTotal, leadsNuevos, citasAgendadas, recent] =
        await Promise.all([
          apiFetch<Paginated<unknown>>('/properties?limit=1'),
          apiFetch<Paginated<unknown>>('/leads?limit=1'),
          apiFetch<Paginated<unknown>>('/leads?status=nuevo&limit=1'),
          apiFetch<Paginated<unknown>>('/leads?status=cita_agendada&limit=1'),
          apiFetch<Paginated<Lead>>('/leads?limit=5'),
        ]);
      return {
        published: totalOf(published),
        leadsTotal: totalOf(leadsTotal),
        leadsNuevos: totalOf(leadsNuevos),
        citasAgendadas: totalOf(citasAgendadas),
        recentLeads: recent.data,
      };
    },
  });
}
