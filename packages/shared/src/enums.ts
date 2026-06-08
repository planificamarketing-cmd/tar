// Enums del dominio, espejo de los enums Postgres de packages/db (PRD §4.1).
// Fuente única para validación Zod (API) y tipados del frontend.
import { z } from 'zod';

export const USER_ROLES = ['admin', 'editor'] as const;
export const userRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof userRoleSchema>;

export const PROPERTY_TYPES = [
  'casa',
  'departamento',
  'oficina',
  'local_comercial',
  'bodega_industrial',
  'terreno_industrial',
  'edificio',
  'terreno',
] as const;
export const propertyTypeSchema = z.enum(PROPERTY_TYPES);
export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const PROPERTY_STATUSES = [
  'borrador',
  'disponible',
  'apartado',
  'rentado',
  'vendido',
  'pausado',
] as const;
export const propertyStatusSchema = z.enum(PROPERTY_STATUSES);
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;

// Estatus comerciales válidos para PATCH /properties/:id/status (excluye `borrador`).
export const COMMERCIAL_STATUSES = [
  'disponible',
  'apartado',
  'rentado',
  'vendido',
  'pausado',
] as const;
export const commercialStatusSchema = z.enum(COMMERCIAL_STATUSES);

export const FEATURED_LEVELS = ['normal', 'destacada', 'premium'] as const;
export const featuredLevelSchema = z.enum(FEATURED_LEVELS);
export type FeaturedLevel = z.infer<typeof featuredLevelSchema>;

export const LEAD_TYPES = ['contacto', 'cita'] as const;
export const leadTypeSchema = z.enum(LEAD_TYPES);
export type LeadType = z.infer<typeof leadTypeSchema>;

// Pipeline de leads del negocio inmobiliario (decisión del cliente, ronda 1).
export const LEAD_STATUSES = [
  'nuevo',
  'cita_agendada',
  'cita_concretada',
  'apartado',
  'firma_contrato',
  'descartado',
] as const;
export const leadStatusSchema = z.enum(LEAD_STATUSES);
export type LeadStatus = z.infer<typeof leadStatusSchema>;

export const SCRIPT_PLACEMENTS = ['head', 'body', 'footer'] as const;
export const scriptPlacementSchema = z.enum(SCRIPT_PLACEMENTS);
export type ScriptPlacement = z.infer<typeof scriptPlacementSchema>;

export const CURRENCIES = ['MXN', 'USD'] as const;
export const currencySchema = z.enum(CURRENCIES);
export type Currency = z.infer<typeof currencySchema>;

// Eventos de webhooks salientes (PRD §5.5).
export const WEBHOOK_EVENTS = [
  'lead.created',
  'lead.status_changed',
  'property.published',
  'property.status_changed',
] as const;
export const webhookEventSchema = z.enum(WEBHOOK_EVENTS);
export type WebhookEvent = z.infer<typeof webhookEventSchema>;

// Scopes de API keys para webhooks entrantes (PRD §4.1 / §5.5).
export const API_KEY_SCOPES = ['leads:write', 'properties:write'] as const;
export const apiKeyScopeSchema = z.enum(API_KEY_SCOPES);
export type ApiKeyScope = z.infer<typeof apiKeyScopeSchema>;
