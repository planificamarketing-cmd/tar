import { defineConfig } from 'tsup';

// Bundle CommonJS para producción. Los paquetes del workspace (@tar/*) son
// solo fuente TS → se inlinan con noExternal; sus deps runtime quedan externas.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@tar/shared', '@tar/db'],
});
