import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { eq, like } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';

const app = createApp();
const ADMIN_EMAIL = 'scripts-test-admin@tar.local';
const EDITOR_EMAIL = 'scripts-test-editor@tar.local';
const PASS = 'scripts-admin-123';

let adminToken: string;
let editorToken: string;
let adminId: string;
let editorId: string;
let scriptId: string;

async function seedUser(email: string, role: 'admin' | 'editor') {
  const passwordHash = await argon2.hash(PASS);
  const [u] = await db
    .insert(schema.users)
    .values({ email, passwordHash, name: `Scripts ${role}`, role })
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
  if (scriptId)
    await db.delete(schema.marketingScripts).where(eq(schema.marketingScripts.id, scriptId));
  await db.delete(schema.marketingScripts).where(like(schema.marketingScripts.name, 'Test GA4%'));
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, adminId));
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, editorId));
  await db.delete(schema.users).where(like(schema.users.email, 'scripts-test-%@tar.local'));
  await pool.end();
});

const auth = (req: request.Test, token: string) =>
  req.set('Authorization', `Bearer ${token}`);

describe('Scripts /api/v1/scripts', () => {
  it('exige autenticación (401)', async () => {
    const res = await request(app).get('/api/v1/scripts');
    expect(res.status).toBe(401);
  });

  it('un editor NO puede gestionar scripts (403)', async () => {
    const res = await auth(request(app).get('/api/v1/scripts'), editorToken);
    expect(res.status).toBe(403);
  });

  it('crea un script (201, activo por defecto)', async () => {
    const res = await auth(request(app).post('/api/v1/scripts'), adminToken).send({
      name: 'Test GA4',
      placement: 'head',
      code: '<script>/* gtag */</script>',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.placement).toBe('head');
    expect(res.body.data.isActive).toBe(true);
    scriptId = res.body.data.id;
  });

  it('filtra por placement', async () => {
    const res = await auth(
      request(app).get('/api/v1/scripts').query({ placement: 'head' }),
      adminToken,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.some((s: { id: string }) => s.id === scriptId)).toBe(true);
    expect(res.body.data.every((s: { placement: string }) => s.placement === 'head')).toBe(true);
  });

  it('desactiva el script (PATCH isActive=false)', async () => {
    const res = await auth(
      request(app).patch(`/api/v1/scripts/${scriptId}`),
      adminToken,
    ).send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('elimina el script (204) y luego 404', async () => {
    const del = await auth(
      request(app).delete(`/api/v1/scripts/${scriptId}`),
      adminToken,
    );
    expect(del.status).toBe(204);
    const res = await auth(
      request(app).get(`/api/v1/scripts/${scriptId}`),
      adminToken,
    );
    expect(res.status).toBe(404);
    scriptId = '';
  });
});
