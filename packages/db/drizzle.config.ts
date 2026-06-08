import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Carga el .env de la raíz (para drizzle-kit generate/studio, que no usan tsx).
config({ path: '../../.env' });

// PostGIS 16-3.4. El esquema se implementa en la Fase 1 (PRD §4.1).
export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
});
