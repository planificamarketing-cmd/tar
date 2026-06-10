import type { LeadStatus, LeadType } from '@tar/shared';

// Respuesta paginada estándar de la API (§5): { data, meta }.
export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number };
};

export type LeadEvent = {
  id: string;
  leadId: string;
  type: string;
  payload: Record<string, unknown> | null;
  userId: string | null;
  createdAt: string;
};

export type Lead = {
  id: string;
  propertyId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  type: LeadType;
  preferredAt: string | null;
  source: string | null;
  utm: Record<string, string> | null;
  status: LeadStatus;
  assignedTo: string | null;
  consentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadDetail = Lead & { events: LeadEvent[] };
