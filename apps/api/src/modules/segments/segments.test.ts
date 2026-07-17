import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { eq, inArray, like } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';

// Segmentación para Meta: CRUD (admin), feed CSV público por token y permisos.
const app = createApp();
const ADMIN_EMAIL = 'seg-test-admin@tar.local';
const VENTAS_EMAIL = 'seg-test-ventas@tar.local';
const PASS = 'seg-admin-123';
const COLONIA = 'Colonia Segmento';

let adminToken: string;
let ventasToken: string;
let adminId: string;
let ventasId: string;
let propId: string;
let segId: string;
let feedToken: string;

async function seedUser(email: string, role: 'admin' | 'ventas') {
  const passwordHash = await argon2.hash(PASS);
  const [u] = await db
    .insert(schema.users)
    .values({ email, passwordHash, name: `Seg ${role}`, role })
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
  adminId = await seedUser(ADMIN_EMAIL, 'admin');
  ventasId = await seedUser(VENTAS_EMAIL, 'ventas');
  adminToken = await loginAs(ADMIN_EMAIL);
  ventasToken = await loginAs(VENTAS_EMAIL);

  const [loc] = await db
    .insert(schema.locations)
    .values({
      estado: 'Ciudad de México',
      municipio: 'Benito Juárez',
      colonia: COLONIA,
      slugEstado: 'ciudad-de-mexico',
      slugColonia: 'colonia-segmento',
    })
    .returning();
  const [prop] = await db
    .insert(schema.properties)
    .values({
      slug: 'segmento-depto-prueba',
      title: 'Depto en segmento de prueba',
      description: 'Bonito depto',
      propertyType: 'departamento',
      priceSale: '3000000',
      currencySale: 'MXN',
      priceSaleMxn: '3000000',
      status: 'disponible',
      publishedAt: new Date(),
      locationId: loc!.id,
    })
    .returning();
  propId = prop!.id;
});

afterAll(async () => {
  await db.delete(schema.propertySegments).where(like(schema.propertySegments.name, 'Seg prueba%'));
  await db.delete(schema.properties).where(eq(schema.properties.id, propId));
  await db.delete(schema.locations).where(eq(schema.locations.colonia, COLONIA));
  await db
    .delete(schema.refreshTokens)
    .where(inArray(schema.refreshTokens.userId, [adminId, ventasId]));
  await db.delete(schema.users).where(like(schema.users.email, 'seg-test-%@tar.local'));
  await pool.end();
});

describe('Segmentos /api/v1/segments', () => {
  it('ventas NO puede gestionar segmentos (403)', async () => {
    const res = await auth(request(app).get('/api/v1/segments'), ventasToken);
    expect(res.status).toBe(403);
  });

  it('crea un segmento (201, con feedToken)', async () => {
    const res = await auth(request(app).post('/api/v1/segments'), adminToken).send({
      name: 'Seg prueba deptos venta',
      filters: { operation: 'venta', type: 'departamento', maxPrice: 5000000 },
    });
    expect(res.status).toBe(201);
    segId = res.body.data.id;
    feedToken = res.body.data.feedToken;
    expect(feedToken).toMatch(/^[0-9a-f]{32}$/);
  });

  it('lista con conteo de coincidencias (incluye el depto de prueba)', async () => {
    const res = await auth(request(app).get('/api/v1/segments'), adminToken);
    expect(res.status).toBe(200);
    const seg = (res.body.data as { id: string; matchCount: number }[]).find(
      (s) => s.id === segId,
    );
    expect(seg?.matchCount).toBeGreaterThanOrEqual(1);
  });
});

describe('Feed público /api/v1/feeds/meta/:token', () => {
  it('devuelve CSV con la propiedad que casa (sin auth)', async () => {
    const res = await request(app).get(`/api/v1/feeds/meta/${feedToken}.csv`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text.split('\n')[0]).toBe(
      'id,title,description,availability,condition,price,link,image_link,brand',
    );
    expect(res.text).toContain('Depto en segmento de prueba');
    expect(res.text).toContain('3000000 MXN');
  });

  it('token inválido → 404', async () => {
    const res = await request(app).get('/api/v1/feeds/meta/deadbeef.csv');
    expect(res.status).toBe(404);
  });

  it('un segmento inactivo no sirve feed (404)', async () => {
    await auth(request(app).patch(`/api/v1/segments/${segId}`), adminToken).send({
      isActive: false,
    });
    const res = await request(app).get(`/api/v1/feeds/meta/${feedToken}.csv`);
    expect(res.status).toBe(404);
  });
});
