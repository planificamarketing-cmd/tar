import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index';

async function main() {
  await migrate(db, { migrationsFolder: './migrations' });
  // eslint-disable-next-line no-console
  console.log('✔ Migraciones aplicadas.');
  await pool.end();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('✖ Falló la migración:', err);
  process.exit(1);
});
