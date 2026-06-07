import { z } from 'zod';
import { scriptPlacementSchema } from './enums';

// PRD §5.6 / §6.5 — Gestor de scripts de marketing.
export const createScriptSchema = z.object({
  name: z.string().trim().min(1).max(120),
  placement: scriptPlacementSchema,
  code: z.string().min(1),
  isActive: z.boolean().default(true),
});
export type CreateScriptInput = z.infer<typeof createScriptSchema>;

export const updateScriptSchema = createScriptSchema.partial();
export type UpdateScriptInput = z.infer<typeof updateScriptSchema>;
