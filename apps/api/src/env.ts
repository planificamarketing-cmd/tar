import { z } from 'zod';

// Env tipado y validado (la guía del proyecto regla 4/5; PRD §12). Defaults solo para dev;
// en producción se exige configuración real (ver superRefine).
const DEV_ACCESS_PLACEHOLDER = 'dev-access-secret-cambia-esto';
const DEV_REFRESH_PLACEHOLDER = 'dev-refresh-secret-cambia-esto';

const EnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z
      .string()
      .url()
      .default('postgres://tar:tar@localhost:5432/tar_portal'),
    JWT_ACCESS_SECRET: z.string().min(1).default(DEV_ACCESS_PLACEHOLDER),
    JWT_REFRESH_SECRET: z.string().min(1).default(DEV_REFRESH_PLACEHOLDER),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    STORAGE_DRIVER: z.enum(['local']).default('local'),
    MEDIA_DIR: z.string().default('./uploads'),
    MEDIA_BASE_URL: z.string().url().default('http://localhost:4000/media'),
    USD_MXN_RATE: z.coerce.number().positive().default(18.5),
    SENDGRID_API_KEY: z.string().optional(),
    LEADS_NOTIFY_TO: z.string().email().optional(),
    // Geocoding del importador (servidor). Sin key → las propiedades quedan en
    // borrador para fijar el pin a mano (PRD §4.3).
    GOOGLE_GEOCODING_API_KEY: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    // En producción no se permiten los placeholders de dev.
    if (env.JWT_ACCESS_SECRET === DEV_ACCESS_PLACEHOLDER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ACCESS_SECRET'],
        message: 'Debe definirse un secreto real en producción.',
      });
    }
    if (env.JWT_REFRESH_SECRET === DEV_REFRESH_PLACEHOLDER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'Debe definirse un secreto real en producción.',
      });
    }
  });

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    '✖ Variables de entorno inválidas:',
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
