import { z } from 'zod';

// Videos de propiedad, en orientación horizontal o vertical (petición del cliente).
export const VIDEO_ORIENTATIONS = ['horizontal', 'vertical'] as const;
export const videoOrientationSchema = z.enum(VIDEO_ORIENTATIONS);
export type VideoOrientation = z.infer<typeof videoOrientationSchema>;

// Metadatos que acompañan la subida (multipart): la orientación. El archivo lo
// valida el backend por tipo/tamaño; aquí solo el campo de texto del formulario.
export const uploadVideoSchema = z.object({
  orientation: videoOrientationSchema.default('horizontal'),
});
export type UploadVideoInput = z.infer<typeof uploadVideoSchema>;

// Actualización de un video (reordenar / cambiar orientación).
export const updateVideoSchema = z
  .object({
    position: z.coerce.number().int().nonnegative().optional(),
    orientation: videoOrientationSchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'Debe especificar al menos un campo a actualizar.',
  });
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;

// Tipos de video aceptados y límite de tamaño (sin transcodificación en el stack).
export const ALLOWED_VIDEO_MIME = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
