import { defineConfig } from 'tsup';

// Bundle CommonJS para producción. Los paquetes del workspace (@tar/*) son
// solo fuente TS → se inlinan con noExternal; sus deps runtime quedan externas.
export default defineConfig({
  // `migrate` es el runner de migraciones del contenedor (§11); se compila
  // aparte para poder ejecutarlo antes de levantar el servidor.
  entry: ['src/index.ts', 'src/migrate.ts', 'src/create-admin.ts'],
  format: ['cjs'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@tar/shared', '@tar/db'],
});
