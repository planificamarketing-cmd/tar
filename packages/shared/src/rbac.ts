// Control de acceso por capacidades (RBAC) — PRD §4.1/§5.6.
// Fuente ÚNICA de verdad del mapa rol → capacidades: la consumen el backend
// (middleware `requirePermission`) y el panel (filtra navegación y botones),
// de modo que el servidor y la pantalla nunca se contradicen.
import { z } from 'zod';
import type { UserRole } from './enums';

// Capacidades de grano fino: separan lectura de escritura por módulo.
export const CAPABILITIES = [
  'properties:read',
  'properties:write',
  'properties:delete',
  'media:write',
  'amenities:write',
  'geo:write',
  'leads:read',
  'leads:write',
  'users:manage',
  'webhooks:manage',
  'scripts:manage',
  'segments:manage',
] as const;
export const capabilitySchema = z.enum(CAPABILITIES);
export type Capability = z.infer<typeof capabilitySchema>;

// Mapa rol → capacidades.
//  - admin:  todas.
//  - editor: catálogo completo + prospectos (sin usuarios/integraciones/scripts).
//  - ventas: consulta el catálogo y opera los prospectos.
//  - lector: solo lectura de propiedades y prospectos.
export const ROLE_CAPABILITIES: Record<UserRole, readonly Capability[]> = {
  admin: [...CAPABILITIES],
  editor: [
    'properties:read',
    'properties:write',
    'properties:delete',
    'media:write',
    'amenities:write',
    'geo:write',
    'leads:read',
    'leads:write',
  ],
  ventas: ['properties:read', 'leads:read', 'leads:write'],
  lector: ['properties:read', 'leads:read'],
};
// Nota: 'segments:manage' es admin-only (queda cubierto por admin: todas).

// ¿El rol tiene la capacidad? Única función de decisión (API + panel la usan).
export function roleCan(role: UserRole, cap: Capability): boolean {
  return ROLE_CAPABILITIES[role]?.includes(cap) ?? false;
}

// Etiquetas humanas del rol (para el panel).
export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  ventas: 'Ventas',
  lector: 'Lector',
};
