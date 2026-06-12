import { z } from 'zod';
import { userRoleSchema } from './enums';
import { paginationSchema } from './common';

// PRD §5.6 — listado de operadores (admin): paginación + filtros opcionales.
export const userQuerySchema = paginationSchema.extend({
  role: userRoleSchema.optional(),
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  q: z.string().trim().min(1).optional(),
});
export type UserQuery = z.infer<typeof userQuerySchema>;

// PRD §5.6 — CRUD de operadores (admin/broker).
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
  role: userRoleSchema.default('editor'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(120),
    password: z.string().min(8),
    role: userRoleSchema,
    isActive: z.boolean(),
  })
  .partial();
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
