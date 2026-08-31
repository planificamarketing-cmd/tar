import { defineConfig } from 'vitest/config';

// La BD local puede correr en otro puerto (DB_PORT del .env raíz); en CI no hay .env.
try {
  process.loadEnvFile(new URL('../../.env', import.meta.url).pathname);
} catch {
  // sin .env (CI): se usa el fallback de abajo
}

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      // Sin BD real en CI: el cliente se conecta a localhost y /health reporta db:false.
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgres://tar:tar@localhost:5432/tar_portal',
    },
  },
});
