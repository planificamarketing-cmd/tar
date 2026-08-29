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
    // Base del sitio público (para armar el enlace de la propiedad en los webhooks).
    PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
    // Base PÚBLICA de la API (para armar enlaces descargables en los webhooks, p. ej.
    // la ficha PDF del prospecto). En producción la API vive en el mismo dominio
    // detrás de Caddy, así que basta `https://dominio/api/v1`; si se deja vacía se
    // deriva de PUBLIC_SITE_URL.
    PUBLIC_API_URL: z.string().url().optional(),
    // Secreto compartido con el sitio Next.js para disparar la revalidación
    // on-demand (ISR) al publicar/despublicar/cambiar estatus. Sin él, la
    // revalidación queda desactivada y el sitio se refresca solo por tiempo.
    REVALIDATE_SECRET: z.string().optional(),
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

// Base pública de la API para enlaces que se comparten fuera (webhooks). En
// producción, Caddy sirve API y web en el mismo dominio bajo /api/v1.
export const publicApiUrl: string = (
  env.PUBLIC_API_URL ?? `${env.PUBLIC_SITE_URL}/api/v1`
).replace(/\/$/, '');

const corsAllowlist = env.CORS_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Orígenes de desarrollo local: localhost y rangos de IP privada de LAN. La IP
// de WSL (172.16–31.x) cambia entre arranques, así que en dev se aceptan por
// patrón para abrir el panel desde Windows sin reconfigurar CORS cada vez.
function isPrivateDevOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
}

// Producción: allowlist estricta (CORS_ORIGINS). Desarrollo/test: allowlist +
// cualquier origen local/LAN privado.
export const corsOrigin =
  env.NODE_ENV === 'production'
    ? corsAllowlist
    : (
        origin: string | undefined,
        cb: (err: Error | null, allow?: boolean) => void,
      ): void => {
        if (!origin) return cb(null, true); // same-origin / curl sin Origin
        if (corsAllowlist.includes(origin) || isPrivateDevOrigin(origin)) {
          return cb(null, true);
        }
        cb(null, false);
      };
