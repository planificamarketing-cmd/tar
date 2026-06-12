import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { eq, inArray, like } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';

const app = createApp();
const ADMIN_EMAIL = 'users-test-admin@tar.local';
const EDITOR_EMAIL = 'users-test-editor@tar.local';
const PASS = 'users-admin-123';
const NEW_EMAIL = 'users-test-new@tar.local';

let adminToken: string;
let editorToken: string;
let adminId: string;
let editorId: string;
let createdId: string;

async function seedUser(email: string, role: 'admin' | 'editor') {
  const passwordHash = await argon2.hash(PASS);
  const [u] = await db
    .insert(schema.users)
    .values({ email, passwordHash, name: `Test ${role}`, role })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { passwordHash, role, isActive: true },
    })
    .returning();
  return u!.id;
}

async function loginAs(email: string) {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: PASS });
  return res.body.accessToken as string;
}

beforeAll(async () => {
  adminId = await seedUser(ADMIN_EMAIL, 'admin');
  editorId = await seedUser(EDITOR_EMAIL, 'editor');
  adminToken = await loginAs(ADMIN_EMAIL);
  editorToken = await loginAs(EDITOR_EMAIL);
});

afterAll(async () => {
  const ids = [adminId, editorId, createdId].filter(Boolean);
  await db.delete(schema.refreshTokens).where(inArray(schema.refreshTokens.userId, ids));
  await db.delete(schema.users).where(like(schema.users.email, 'users-test-%@tar.local'));
  await pool.end();
});

const auth = (req: request.Test, token: string) =>
  req.set('Authorization', `Bearer ${token}`);

describe('Users /api/v1/users', () => {
  it('exige autenticación (401)', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });

  it('un editor NO puede acceder (403)', async () => {
    const res = await auth(request(app).get('/api/v1/users'), editorToken);
    expect(res.status).toBe(403);
  });

  it('crea un usuario (201) sin exponer passwordHash', async () => {
    const res = await auth(request(app).post('/api/v1/users'), adminToken).send({
      email: NEW_EMAIL,
      password: 'una-clave-segura',
      name: 'Nuevo Operador',
      role: 'editor',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(res.body.data.role).toBe('editor');
    createdId = res.body.data.id;
  });

  it('rechaza correo duplicado (409 email_taken)', async () => {
    const res = await auth(request(app).post('/api/v1/users'), adminToken).send({
      email: NEW_EMAIL,
      password: 'otra-clave-segura',
      name: 'Duplicado',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('email_taken');
  });

  it('lista y filtra por rol/búsqueda', async () => {
    const res = await auth(
      request(app).get('/api/v1/users').query({ role: 'editor', q: 'Nuevo' }),
      adminToken,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.some((u: { id: string }) => u.id === createdId)).toBe(true);
    expect(res.body.data.every((u: { role: string }) => u.role === 'editor')).toBe(true);
  });

  it('actualiza nombre y rol (200)', async () => {
    const res = await auth(
      request(app).patch(`/api/v1/users/${createdId}`),
      adminToken,
    ).send({ name: 'Operador Renombrado', role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Operador Renombrado');
    expect(res.body.data.role).toBe('admin');
  });

  it('un admin NO puede desactivarse a sí mismo (409 self_lockout)', async () => {
    const res = await auth(
      request(app).delete(`/api/v1/users/${adminId}`),
      adminToken,
    );
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('self_lockout');
  });

  it('da de baja a un usuario (204) y revoca sus sesiones', async () => {
    await loginAs(NEW_EMAIL).catch(() => undefined); // crea un refresh token vivo
    const del = await auth(
      request(app).delete(`/api/v1/users/${createdId}`),
      adminToken,
    );
    expect(del.status).toBe(204);

    const [u] = await db
      .select({ isActive: schema.users.isActive })
      .from(schema.users)
      .where(eq(schema.users.id, createdId))
      .limit(1);
    expect(u?.isActive).toBe(false);

    const tokens = await db
      .select({ id: schema.refreshTokens.id })
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.userId, createdId));
    expect(tokens.length).toBe(0);
  });
});
