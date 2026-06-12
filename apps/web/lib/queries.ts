import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  CommercialStatus,
  FeaturedLevel,
  LeadStatus,
  PropertyAdminSort,
  PropertyStatus,
  PropertyType,
} from '@tar/shared';
import type {
  CreateApiKeyInput,
  CreatePropertyInput,
  CreateScriptInput,
  CreateUserInput,
  CreateWebhookSubscriptionInput,
  UpdatePropertyInput,
  UpdateScriptInput,
  UpdateUserInput,
  UpdateWebhookSubscriptionInput,
  UserRole,
} from '@tar/shared';
import { apiFetch, apiUpload } from './api';
import type {
  Amenity,
  ApiKey,
  ApiKeyCreated,
  Lead,
  LeadDetail,
  MarketingScript,
  Paginated,
  PropertyDetail,
  PropertyImage,
  PropertyListItem,
  User,
  WebhookDelivery,
  WebhookSubscription,
} from './types';
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

// ── Propiedades (backoffice) ────────────────────────────────────────────────────
export type AdminPropertiesParams = {
  status?: PropertyStatus;
  type?: PropertyType;
  featured?: FeaturedLevel;
  q?: string;
  sort?: PropertyAdminSort;
  page?: number;
  limit?: number;
};

export function useAdminProperties(params: AdminPropertiesParams) {
  return useQuery({
    queryKey: ['admin-properties', params],
    queryFn: () =>
      apiFetch<Paginated<PropertyListItem>>(`/properties/admin${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function usePropertyStatusCounts() {
  return useQuery({
    queryKey: ['property-status-counts'],
    queryFn: () =>
      apiFetch<{ data: Record<string, number> }>(
        '/properties/admin/status-counts',
      ),
    select: (r) => r.data,
  });
}

function invalidateProperties(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['admin-properties'] });
  void qc.invalidateQueries({ queryKey: ['property-status-counts'] });
  void qc.invalidateQueries({ queryKey: ['dashboard'] });
}

export function usePublishProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/properties/${id}/publish`, { method: 'POST' }),
    onSuccess: () => invalidateProperties(qc),
  });
}

export function useUpdatePropertyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CommercialStatus }) =>
      apiFetch(`/properties/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => invalidateProperties(qc),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/properties/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateProperties(qc),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['admin-property', id],
    queryFn: () =>
      apiFetch<{ data: PropertyDetail }>(`/properties/admin/${id}`),
    select: (r) => r.data,
  });
}

export function useAmenities() {
  return useQuery({
    queryKey: ['amenities'],
    queryFn: () => apiFetch<{ data: Amenity[] }>('/amenities'),
    select: (r) => r.data,
    staleTime: 5 * 60_000,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePropertyInput) =>
      apiFetch<{ data: PropertyDetail }>('/properties', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => invalidateProperties(qc),
  });
}

export function useUpdateProperty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePropertyInput) =>
      apiFetch<{ data: PropertyDetail }>(`/properties/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      invalidateProperties(qc);
      void qc.invalidateQueries({ queryKey: ['admin-property', id] });
    },
  });
}

export function useUploadImages(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => {
      const form = new FormData();
      for (const f of files) form.append('images', f);
      return apiUpload<{ data: PropertyImage[] }>(
        `/properties/${id}/images`,
        form,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-property', id] });
      void qc.invalidateQueries({ queryKey: ['admin-properties'] });
    },
  });
}

export function useDeleteImage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imgId: string) =>
      apiFetch(`/properties/${id}/images/${imgId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-property', id] });
      void qc.invalidateQueries({ queryKey: ['admin-properties'] });
    },
  });
}

export function useUpdateImage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      imgId,
      body,
    }: {
      imgId: string;
      body: { isCover?: boolean; alt?: string | null; position?: number };
    }) =>
      apiFetch(`/properties/${id}/images/${imgId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-property', id] });
      void qc.invalidateQueries({ queryKey: ['admin-properties'] });
    },
  });
}

// ── Usuarios (solo admin) ───────────────────────────────────────────────────────
export type UsersParams = {
  role?: UserRole;
  active?: 'true' | 'false';
  q?: string;
  page?: number;
  limit?: number;
};

export function useUsers(params: UsersParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => apiFetch<Paginated<User>>(`/users${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserInput) =>
      apiFetch<{ data: User }>('/users', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserInput }) =>
      apiFetch<{ data: User }>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

// ── Webhooks salientes + API keys entrantes (solo admin, §5.5) ──────────────────
export function useWebhookSubscriptions() {
  return useQuery({
    queryKey: ['webhook-subscriptions'],
    queryFn: () =>
      apiFetch<{ data: WebhookSubscription[] }>('/webhooks/subscriptions'),
    select: (r) => r.data,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWebhookSubscriptionInput) =>
      apiFetch('/webhooks/subscriptions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['webhook-subscriptions'] }),
  });
}

export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateWebhookSubscriptionInput;
    }) =>
      apiFetch(`/webhooks/subscriptions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['webhook-subscriptions'] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/webhooks/subscriptions/${id}`, { method: 'DELETE' }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['webhook-subscriptions'] }),
  });
}

export function useWebhookDeliveries() {
  return useQuery({
    queryKey: ['webhook-deliveries'],
    queryFn: () =>
      apiFetch<{ data: WebhookDelivery[] }>('/webhooks/deliveries'),
    select: (r) => r.data,
  });
}

export function useRetryDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/webhooks/deliveries/${id}/retry`, { method: 'POST' }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['webhook-deliveries'] }),
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiFetch<{ data: ApiKey[] }>('/webhooks/api-keys'),
    select: (r) => r.data,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateApiKeyInput) =>
      apiFetch<{ data: ApiKeyCreated }>('/webhooks/api-keys', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/webhooks/api-keys/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

// ── Scripts de marketing (solo admin, §6.5) ─────────────────────────────────────
export function useScripts() {
  return useQuery({
    queryKey: ['scripts'],
    queryFn: () => apiFetch<{ data: MarketingScript[] }>('/scripts'),
    select: (r) => r.data,
  });
}

export function useCreateScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateScriptInput) =>
      apiFetch<{ data: MarketingScript }>('/scripts', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['scripts'] }),
  });
}

export function useUpdateScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateScriptInput }) =>
      apiFetch<{ data: MarketingScript }>(`/scripts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['scripts'] }),
  });
}

export function useDeleteScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/scripts/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['scripts'] }),
  });
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export type DashboardData = {
  kpis: {
    published: number;
    drafts: number;
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
      const [props, leadsRes, counts] = await Promise.all([
        apiFetch<Paginated<PropertyListItem>>('/properties?limit=50'),
        apiFetch<Paginated<Lead>>('/leads?limit=50'),
        apiFetch<{ data: Record<string, number> }>(
          '/properties/admin/status-counts',
        ),
      ]);
      const properties = props.data;
      const leads = leadsRes.data;
      const byStatus = counts.data;

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

      // Estado de propiedades — conteos REALES por estatus (incl. borrador,
      // rentado, vendido), no la muestra pública del listado.
      const statusMix = STATUS_META.filter(
        (s) => (byStatus[s.key] ?? 0) > 0,
      ).map((s) => ({ label: s.label, count: byStatus[s.key] ?? 0, color: s.color }));
      const totalProperties = Object.values(byStatus).reduce((a, b) => a + b, 0);
      const drafts = byStatus.borrador ?? 0;
      const published =
        (byStatus.disponible ?? 0) + (byStatus.apartado ?? 0);

      return {
        kpis: { published, drafts, leadsMonth, enSeguimiento, cierres },
        monthlyLeads,
        typeMix,
        statusMix,
        totalProperties,
        recentLeads: leads.slice(0, 5),
      };
    },
  });
}
