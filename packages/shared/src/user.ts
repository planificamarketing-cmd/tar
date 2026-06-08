import { z } from 'zod';
import { userRoleSchema } from './enums';

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
