import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { inArray, like } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { roleCan } from '@tar/shared';
import { createApp } from '../../app';

// Límites del RBAC de 4 roles (admin/editor/ventas/lector) sobre las rutas reales.
// Complementa users.test.ts (que ya cubre admin/editor); aquí el foco es que
// ventas opere prospectos pero no el catálogo, y que lector sea de solo lectura.
const app = createApp();
const PASS = 'rbac-test-123';
const VENTAS_EMAIL = 'rbac-test-ventas@tar.local';
const LECTOR_EMAIL = 'rbac-test-lector@tar.local';

let ventasId: string;
let lectorId: string;
let ventasToken: string;
let lectorToken: string;
let leadId: string;

async function seedUser(email: string, role: 'ventas' | 'lector') {
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

const auth = (req: request.Test, token: string) =>
  req.set('Authorization', `Bearer ${token}`);

beforeAll(async () => {
  ventasId = await seedUser(VENTAS_EMAIL, 'ventas');
  lectorId = await seedUser(LECTOR_EMAIL, 'lector');
  ventasToken = await loginAs(VENTAS_EMAIL);
  lectorToken = await loginAs(LECTOR_EMAIL);
  const [lead] = await db
    .insert(schema.leads)
    .values({ name: 'RBAC Lead', email: 'rbac-lead@tar.local' })
    .returning();
  leadId = lead!.id;
});

afterAll(async () => {
  const ids = [ventasId, lectorId].filter(Boolean);
  await db.delete(schema.refreshTokens).where(inArray(schema.refreshTokens.userId, ids));
  await db.delete(schema.leadEvents).where(inArray(schema.leadEvents.leadId, [leadId]));
  await db.delete(schema.leads).where(inArray(schema.leads.id, [leadId]));
  await db.delete(schema.users).where(like(schema.users.email, 'rbac-test-%@tar.local'));
  await pool.end();
});

describe('mapa rol → capacidad (@tar/shared)', () => {
  it('ventas: lee catálogo y opera prospectos; no escribe catálogo ni administra', () => {
    expect(roleCan('ventas', 'properties:read')).toBe(true);
    expect(roleCan('ventas', 'leads:write')).toBe(true);
    expect(roleCan('ventas', 'properties:write')).toBe(false);
    expect(roleCan('ventas', 'users:manage')).toBe(false);
  });
  it('lector: solo lectura de catálogo y prospectos', () => {
    expect(roleCan('lector', 'properties:read')).toBe(true);
    expect(roleCan('lector', 'leads:read')).toBe(true);
    expect(roleCan('lector', 'leads:write')).toBe(false);
    expect(roleCan('lector', 'properties:write')).toBe(false);
  });
});

describe('RBAC — rol ventas', () => {
  it('lee el catálogo admin (200)', async () => {
    const res = await auth(request(app).get('/api/v1/properties/admin'), ventasToken);
    expect(res.status).toBe(200);
  });
  it('lee los prospectos (200)', async () => {
    const res = await auth(request(app).get('/api/v1/leads'), ventasToken);
    expect(res.status).toBe(200);
  });
  it('cambia la etapa de un prospecto (200)', async () => {
    const res = await auth(
      request(app).patch(`/api/v1/leads/${leadId}`),
      ventasToken,
    ).send({ status: 'cita_agendada' });
    expect(res.status).toBe(200);
  });
  it('NO puede crear propiedades (403)', async () => {
    const res = await auth(
      request(app).post('/api/v1/properties'),
      ventasToken,
    ).send({ title: 'x', propertyType: 'casa' });
    expect(res.status).toBe(403);
  });
  it('NO puede administrar usuarios (403)', async () => {
    const res = await auth(request(app).get('/api/v1/users'), ventasToken);
    expect(res.status).toBe(403);
  });
});

describe('RBAC — rol lector', () => {
  it('lee el catálogo admin (200)', async () => {
    const res = await auth(request(app).get('/api/v1/properties/admin'), lectorToken);
    expect(res.status).toBe(200);
  });
  it('lee los prospectos (200)', async () => {
    const res = await auth(request(app).get('/api/v1/leads'), lectorToken);
    expect(res.status).toBe(200);
  });
  it('NO puede cambiar la etapa de un prospecto (403)', async () => {
    const res = await auth(
      request(app).patch(`/api/v1/leads/${leadId}`),
      lectorToken,
    ).send({ status: 'descartado' });
    expect(res.status).toBe(403);
  });
  it('NO puede crear propiedades (403)', async () => {
    const res = await auth(
      request(app).post('/api/v1/properties'),
      lectorToken,
    ).send({ title: 'x', propertyType: 'casa' });
    expect(res.status).toBe(403);
  });
  it('NO puede gestionar scripts ni webhooks (403)', async () => {
    const scripts = await auth(request(app).get('/api/v1/scripts'), lectorToken);
    const webhooks = await auth(
      request(app).get('/api/v1/webhooks/subscriptions'),
      lectorToken,
    );
    expect(scripts.status).toBe(403);
    expect(webhooks.status).toBe(403);
  });
});
