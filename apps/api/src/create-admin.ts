// Alta del primer administrador en una instalación NUEVA (§11).
//
// En desarrollo el usuario lo crea `pnpm db:seed` junto con los datos de muestra.
// En producción no se corre el seed (metería inventario falso), así que hace
// falta una vía mínima para poder entrar al panel la primera vez. Se compila
// con tsup a `dist/create-admin.cjs` y se ejecuta dentro del contenedor:
//
//   docker compose -f infra/docker-compose.prod.yml run --rm \
//     -e ADMIN_EMAIL=persona@empresa.com -e ADMIN_PASSWORD='...' \
//     -e ADMIN_NAME='Nombre Apellido' api node dist/create-admin.cjs
//
// Es idempotente: si el correo ya existe, actualiza la contraseña y reactiva la
// cuenta en vez de fallar (sirve también para recuperar el acceso perdido).
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { db, pool, schema } from '@tar/db';

const { users } = schema;

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'Administrador';

function fail(message: string): never {
  // eslint-disable-next-line no-console
  console.error(`✖ ${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fail('Falta ADMIN_EMAIL o no es un correo válido.');
  }
  if (!password || password.length < 10) {
    fail('Falta ADMIN_PASSWORD o tiene menos de 10 caracteres.');
  }

  const passwordHash = await argon2.hash(password);
  const [existing] = await db.select().from(users).where(eq(users.email, email));

  if (existing) {
    await db
      .update(users)
      .set({ passwordHash, role: 'admin', isActive: true, name })
      .where(eq(users.id, existing.id));
    // eslint-disable-next-line no-console
    console.log(`✔ Cuenta existente actualizada: ${email} (rol admin, activa).`);
  } else {
    await db.insert(users).values({ email, passwordHash, name, role: 'admin' });
    // eslint-disable-next-line no-console
    console.log(`✔ Administrador creado: ${email}`);
  }

  // eslint-disable-next-line no-console
  console.log('  Entra en /admin y cambia la contraseña si fue provisional.');
  await pool.end();
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('✖ No se pudo crear el administrador:', err);
  process.exit(1);
});
