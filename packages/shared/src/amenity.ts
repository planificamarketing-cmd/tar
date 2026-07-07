import { z } from 'zod';

// Alta de amenidad desde el backoffice. El nombre es único (case-insensitive en el
// servicio); el ícono es opcional (clave de ícono/emoji).
export const createAmenitySchema = z.object({
  name: z.string().trim().min(2).max(60),
  icon: z.string().trim().max(60).optional(),
});
export type CreateAmenityInput = z.infer<typeof createAmenitySchema>;
