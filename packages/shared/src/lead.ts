import { z } from 'zod';
import { leadStatusSchema, leadTypeSchema } from './enums';
import { paginationSchema } from './common';

// PRD §5.4 / §6.7 — captación pública POST /leads.
// honeypot: campo señuelo anti-spam; si llega con valor, es bot.
export const createLeadSchema = z
  .object({
    propertyId: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(120),
    email: z.string().email(),
    phone: z.string().trim().min(7).max(25).optional(),
    message: z.string().trim().max(2000).optional(),
    type: leadTypeSchema.default('contacto'),
    preferredAt: z.coerce.date().optional(),
    source: z.string().trim().max(255).optional(),
    utm: z.record(z.string()).optional(),
    // Consentimiento LFPDPPP: obligatorio marcarlo (true) para enviar.
    consent: z.literal(true),
    // Honeypot: debe llegar vacío.
    website: z.string().max(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'cita' && !data.preferredAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['preferredAt'],
        message: 'preferredAt es requerido para una cita.',
      });
    }
  });
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

// PRD §5.4 — GET /leads (admin): filtros.
export const leadQuerySchema = paginationSchema.extend({
  status: leadStatusSchema.optional(),
  propertyId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
});
export type LeadQuery = z.infer<typeof leadQuerySchema>;

// PRD §5.4 — PATCH /leads/:id: cambiar status / asignar.
export const updateLeadSchema = z
  .object({
    status: leadStatusSchema,
    assignedTo: z.string().uuid().nullable(),
  })
  .partial();
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

// POST /leads/bulk — cambio de etapa masivo del backoffice.
export const bulkLeadsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  status: leadStatusSchema,
});
export type BulkLeadsInput = z.infer<typeof bulkLeadsSchema>;

// PRD §5.4 — POST /events/track (analítica).
export const trackEventSchema = z.object({
  propertyId: z.string().uuid(),
  type: z.literal('view'),
  meta: z.record(z.unknown()).optional(),
});
export type TrackEventInput = z.infer<typeof trackEventSchema>;
