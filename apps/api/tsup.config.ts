import { defineConfig } from 'tsup';

// Bundle CommonJS para producción. Los paquetes del workspace (@tar/*) son
// solo fuente TS → se inlinan con noExternal; sus deps runtime quedan externas.
export default defineConfig({
  // `migrate` es el runner de migraciones del contenedor (§11); se compila
  // aparte para poder ejecutarlo antes de levantar el servidor.
  // Los scripts de la migración única del inventario (§4.3) también se compilan:
  // la imagen de producción no lleva `tsx`, así que sin esto el inventario no se
  // podría importar ni geocodificar en el servidor.
  // Mapa (no lista): al mezclar entradas de `src/` y `scripts/` tsup replicaría
  // la estructura de carpetas (dist/src/index.cjs) y rompería el CMD del
  // contenedor. Nombrarlas deja la salida plana: dist/<nombre>.cjs
  entry: {
    index: 'src/index.ts',
    migrate: 'src/migrate.ts',
    'create-admin': 'src/create-admin.ts',
    'import-inventario': 'scripts/import-inventario.ts',
    'geocode-borrador': 'scripts/geocode-borrador.ts',
  },
  format: ['cjs'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@tar/shared', '@tar/db'],
});
