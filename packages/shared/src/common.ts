import { z } from 'zod';

// Paginación estándar (PRD §5): ?page=&limit= (límite máx 50).
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

// Respuesta paginada: { data, meta: { page, limit, total } }.
export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export const uuidSchema = z.string().uuid();

// Forma de error de la API: { error: { code, message, details? } }.
export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
