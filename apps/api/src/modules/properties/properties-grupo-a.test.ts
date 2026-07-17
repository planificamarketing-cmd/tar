import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { inArray } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';

// Campos del "Grupo A" pedidos por el cliente: m² útil/rentable de oficina,
// áreas exteriores (patio/terraza/balcón/jardín) con metraje, y la etiqueta de
// remate (flag booleano + filtro admin).
const app = createApp();
const ADMIN_EMAIL = 'grupoa-test-admin@tar.local';
const PASS = 'grupoa-admin-123';
const COLONIA = 'Colonia Grupo A';

let token: string;
let adminId: string;
let officeId: string;

beforeAll(async () => {
  const passwordHash = await argon2.hash(PASS);
  const [admin] = await db
    .insert(schema.users)
    .values({ email: ADMIN_EMAIL, passwordHash, name: 'Grupo A', role: 'admin' })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { passwordHash, role: 'admin', isActive: true },
    })
    .returning();
  adminId = admin!.id;
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: ADMIN_EMAIL, password: PASS });
  token = login.body.accessToken;
});

afterAll(async () => {
  // Borra cualquier propiedad que referencie la location de prueba (robusto ante
  // corridas previas), y después la location.
  const locs = await db
    .select({ id: schema.locations.id })
    .from(schema.locations)
    .where(eq(schema.locations.colonia, COLONIA));
  const locIds = locs.map((l) => l.id);
  if (locIds.length)
    await db
      .delete(schema.properties)
      .where(inArray(schema.properties.locationId, locIds));
  await db.delete(schema.locations).where(eq(schema.locations.colonia, COLONIA));
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, adminId));
  await db.delete(schema.users).where(eq(schema.users.id, adminId));
  await pool.end();
});

const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

describe('Grupo A — metraje de oficina, áreas exteriores y remate', () => {
  it('crea una oficina con m² útil/rentable, áreas exteriores y remate', async () => {
    const res = await auth(request(app).post('/api/v1/properties')).send({
      title: 'Oficina de prueba Grupo A',
      propertyType: 'oficina',
      priceRent: 30_000,
      currencyRent: 'MXN',
      areaM2: 120,
      usableAreaM2: 100,
      rentableAreaM2: 110,
      patioM2: 15,
      terraceM2: 20,
      balconyM2: 5,
      isRemate: true,
      estado: 'Ciudad de México',
      municipio: 'Cuauhtémoc',
      colonia: COLONIA,
    });
    expect(res.status).toBe(201);
    officeId = res.body.data.id;
    expect(res.body.data.usableAreaM2).toBe('100.00');
    expect(res.body.data.rentableAreaM2).toBe('110.00');
    expect(res.body.data.patioM2).toBe('15.00');
    expect(res.body.data.terraceM2).toBe('20.00');
    expect(res.body.data.balconyM2).toBe('5.00');
    expect(res.body.data.isRemate).toBe(true);
  });

  it('el filtro remate=true incluye la oficina en remate', async () => {
    const res = await auth(
      request(app).get('/api/v1/properties/admin?remate=true&limit=50'),
    );
    expect(res.status).toBe(200);
    const ids = (res.body.data as { id: string }[]).map((p) => p.id);
    expect(ids).toContain(officeId);
  });

  it('actualiza el remate a false y cambia un área exterior', async () => {
    const res = await auth(request(app).patch(`/api/v1/properties/${officeId}`)).send(
      { isRemate: false, balconyM2: 8 },
    );
    expect(res.status).toBe(200);
    expect(res.body.data.isRemate).toBe(false);
    expect(res.body.data.balconyM2).toBe('8.00');
  });

  it('tras quitar el remate, el filtro remate=true ya no la incluye', async () => {
    const res = await auth(
      request(app).get('/api/v1/properties/admin?remate=true&limit=50'),
    );
    const ids = (res.body.data as { id: string }[]).map((p) => p.id);
    expect(ids).not.toContain(officeId);
  });
});

describe('Flyer — GET /properties/:id/flyer', () => {
  it('exige autenticación (401)', async () => {
    const res = await request(app).get(`/api/v1/properties/${officeId}/flyer`);
    expect(res.status).toBe(401);
  });

  it('genera un PNG del flyer (200, image/png)', async () => {
    const res = await auth(
      request(app).get(`/api/v1/properties/${officeId}/flyer`),
    ).buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    // Firma PNG (\x89PNG) al inicio del cuerpo.
    expect(res.body.slice(0, 4).toString('latin1')).toBe('\x89PNG');
  });
});
