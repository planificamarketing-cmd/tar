import argon2 from 'argon2';
import { and, asc, desc, eq, ne, sql, type SQL } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import type {
  CreateUserInput,
  Paginated,
  UpdateUserInput,
  UserQuery,
} from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';

const { users } = schema;

// Columnas públicas (NUNCA exponer passwordHash).
const userColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  isActive: users.isActive,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

// Cuántos administradores activos quedan aparte de `exceptId` (para no dejar el
// sistema sin acceso). Evita degradar/desactivar al último admin.
async function otherActiveAdmins(exceptId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(
      and(eq(users.role, 'admin'), eq(users.isActive, true), ne(users.id, exceptId)),
    );
  return row?.count ?? 0;
}

export async function listUsers(q: UserQuery): Promise<Paginated<unknown>> {
  const c: SQL[] = [];
  if (q.role) c.push(eq(users.role, q.role));
  if (q.active !== undefined) c.push(eq(users.isActive, q.active));
  if (q.q) c.push(sql`(${users.name} ILIKE ${`%${q.q}%`} OR ${users.email} ILIKE ${`%${q.q}%`})`);
  const where = c.length ? and(...c) : undefined;
  const offset = (q.page - 1) * q.limit;

  const rows = await db
    .select(userColumns)
    .from(users)
    .where(where)
    .orderBy(desc(users.isActive), asc(users.name))
    .limit(q.limit)
    .offset(offset);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(where);

  return {
    data: rows,
    meta: { page: q.page, limit: q.limit, total: countRow?.count ?? 0 },
  };
}

export async function getUser(id: string) {
  const [row] = await db.select(userColumns).from(users).where(eq(users.id, id)).limit(1);
  if (!row) throw new ApiError(404, 'not_found', 'Usuario no encontrado.');
  return row;
}

export async function createUser(input: CreateUserInput) {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  if (existing)
    throw new ApiError(409, 'email_taken', 'Ya existe un usuario con ese correo.');

  const passwordHash = await argon2.hash(input.password);
  const [created] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
    })
    .returning(userColumns);
  return created!;
}

export async function updateUser(id: string, input: UpdateUserInput, actorId: string) {
  const [current] = await db
    .select({ id: users.id, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!current) throw new ApiError(404, 'not_found', 'Usuario no encontrado.');

  // Anti-lockout: no degradar de admin ni desactivar al último admin activo.
  const losesAdmin = input.role !== undefined && input.role !== 'admin';
  const getsDeactivated = input.isActive === false;
  if (
    current.role === 'admin' &&
    current.isActive &&
    (losesAdmin || getsDeactivated) &&
    (await otherActiveAdmins(id)) === 0
  ) {
    throw new ApiError(
      409,
      'last_admin',
      'Debe quedar al menos un administrador activo.',
    );
  }
  // El usuario no puede quitarse a sí mismo el acceso (rol o estado).
  if (id === actorId && (losesAdmin || getsDeactivated)) {
    throw new ApiError(
      409,
      'self_lockout',
      'No puedes cambiar tu propio rol ni desactivarte.',
    );
  }

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) set.name = input.name;
  if (input.role !== undefined) set.role = input.role;
  if (input.isActive !== undefined) set.isActive = input.isActive;
  if (input.password !== undefined) set.passwordHash = await argon2.hash(input.password);

  const [updated] = await db
    .update(users)
    .set(set)
    .where(eq(users.id, id))
    .returning(userColumns);
  return updated!;
}

// "Baja" = desactivar (no hard delete). Revoca sus refresh tokens para cerrar
// sesiones vivas.
export async function deactivateUser(id: string, actorId: string) {
  if (id === actorId)
    throw new ApiError(409, 'self_lockout', 'No puedes desactivarte a ti mismo.');

  const [current] = await db
    .select({ id: users.id, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!current) throw new ApiError(404, 'not_found', 'Usuario no encontrado.');

  if (
    current.role === 'admin' &&
    current.isActive &&
    (await otherActiveAdmins(id)) === 0
  ) {
    throw new ApiError(
      409,
      'last_admin',
      'Debe quedar al menos un administrador activo.',
    );
  }

  await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id));
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, id));
}
