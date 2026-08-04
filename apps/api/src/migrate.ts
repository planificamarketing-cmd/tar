// Runner de migraciones para PRODUCCIÓN (§11). En desarrollo se usa
// `pnpm db:migrate`, que corre `packages/db/src/migrate.ts` con tsx y lee el
// `.env` del repo. En el contenedor no hay tsx ni `.env`: las variables llegan
// del entorno de Docker y este archivo se compila con tsup a `dist/migrate.cjs`
// (el bundle inlina @tar/db, igual que el servidor).
//
// La carpeta de migraciones se pasa por `MIGRATIONS_DIR` porque en la imagen
// vive en `/app/migrations`, no junto al código como en el repo.
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '@tar/db';

const migrationsFolder = process.env.MIGRATIONS_DIR ?? './migrations';

async function main(): Promise<void> {
  await migrate(db, { migrationsFolder });
  // eslint-disable-next-line no-console
  console.log(`✔ Migraciones aplicadas desde ${migrationsFolder}`);
  await pool.end();
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('✖ Falló la migración:', err);
  process.exit(1);
});
