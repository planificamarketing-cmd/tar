import { pool } from './index';

// Seed de datos de muestra (PRD §4.2). Se implementa en la Fase 1 a partir del
// CSV real (10 propiedades representativas + amenidades + 1 admin).
async function main() {
  // eslint-disable-next-line no-console
  console.log('Seed pendiente — se implementa en la Fase 1.');
  await pool.end();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('✖ Falló el seed:', err);
  process.exit(1);
});
