import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';

// Integración real contra la BD de dev (Docker). Crea su propio usuario y limpia.
const app = createApp();
const TEST_EMAIL = 'auth-test@tar.local';
const TEST_PASS = 'test-password-123';
let userId: string;

beforeAll(async () => {
  const passwordHash = await argon2.hash(TEST_PASS);
  const [user] = await db
    .insert(schema.users)
    .values({
      email: TEST_EMAIL,
      passwordHash,
      name: 'Auth Test',
      role: 'editor',
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { passwordHash, isActive: true },
    })
    .returning();
  userId = user!.id;
});

afterAll(async () => {
  await db
    .delete(schema.refreshTokens)
    .where(eq(schema.refreshTokens.userId, userId));
  await db.delete(schema.users).where(eq(schema.users.id, userId));
  await pool.end();
});

describe('Auth /api/v1/auth', () => {
  it('rechaza credenciales inválidas con 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('invalid_credentials');
  });

  it('valida el body con Zod (400)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'no-es-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('login correcto devuelve access + refresh + user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASS });
    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user.role).toBe('editor');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('/me requiere token (401 sin él) y devuelve el usuario con él', async () => {
    const noAuth = await request(app).get('/api/v1/auth/me');
    expect(noAuth.status).toBe(401);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASS });
    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(TEST_EMAIL);
  });

  it('refresh rota el token: el viejo deja de servir', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASS });
    const oldRefresh = login.body.refreshToken;

    const refreshed = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.refreshToken).not.toBe(oldRefresh);
    expect(typeof refreshed.body.accessToken).toBe('string');

    // El refresh viejo ya fue revocado → 401.
    const reuse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('invalid_refresh');
  });

  it('logout revoca el refresh', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASS });
    const refreshToken = login.body.refreshToken;

    const out = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken });
    expect(out.status).toBe(204);

    const after = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(after.status).toBe(401);
  });
});
