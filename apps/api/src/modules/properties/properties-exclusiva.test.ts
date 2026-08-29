import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { eq, inArray } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';

// Propiedades EN EXCLUSIVA con TAR: insignia propia y, sobre todo, entran solas
// a las destacadas de la portada (orden por relevancia) sin marcarlas a mano.
const app = createApp();
const ADMIN_EMAIL = 'exclusiva-test-admin@tar.local';
const PASS = 'exclusiva-admin-123';
const COLONIA = 'Colonia Exclusiva Test';

let token: string;
let adminId: string;
let exclusiveId: string;
let plainId: string;

const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

beforeAll(async () => {
  const passwordHash = await argon2.hash(PASS);
  const [admin] = await db
    .insert(schema.users)
    .values({ email: ADMIN_EMAIL, passwordHash, name: 'Exclusiva', role: 'admin' })
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

  const base = {
    propertyType: 'departamento',
    priceSale: 3_000_000,
    currencySale: 'MXN',
    estado: 'Ciudad de México',
    municipio: 'Cuauhtémoc',
    colonia: COLONIA,
    lat: 19.4,
    lng: -99.16,
  };
  // La normal se crea y publica ANTES: si la exclusiva no pesara en el orden,
  // la normal (más reciente) saldría primero.
  const plain = await auth(request(app).post('/api/v1/properties')).send({
    ...base,
    title: 'Departamento normal (exclusiva test)',
  });
  plainId = plain.body.data.id;
  const exclusive = await auth(request(app).post('/api/v1/properties')).send({
    ...base,
    title: 'Departamento en exclusiva (exclusiva test)',
    isExclusive: true,
  });
  exclusiveId = exclusive.body.data.id;
  await auth(request(app).post(`/api/v1/properties/${exclusiveId}/publish`));
  await auth(request(app).post(`/api/v1/properties/${plainId}/publish`));
});

afterAll(async () => {
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

describe('Exclusiva — campo, filtro y peso en destacados', () => {
  it('crea la propiedad marcada como exclusiva', async () => {
    const res = await auth(request(app).get(`/api/v1/properties/admin/${exclusiveId}`));
    expect(res.status).toBe(200);
    expect(res.body.data.isExclusive).toBe(true);
    expect(res.body.data.featured).toBe('normal');
  });

  it('el filtro exclusiva=true la incluye y deja fuera a la normal', async () => {
    const res = await auth(
      request(app).get('/api/v1/properties/admin?exclusiva=true&limit=50'),
    );
    expect(res.status).toBe(200);
    const ids = (res.body.data as { id: string }[]).map((p) => p.id);
    expect(ids).toContain(exclusiveId);
    expect(ids).not.toContain(plainId);
  });

  it('en el orden por relevancia la exclusiva va por delante de una normal', async () => {
    const res = await request(app).get(
      `/api/v1/properties?sort=relevancia&colonia=${encodeURIComponent(COLONIA)}&limit=50`,
    );
    expect(res.status).toBe(200);
    const ids = (res.body.data as { id: string }[]).map((p) => p.id);
    expect(ids).toContain(exclusiveId);
    expect(ids).toContain(plainId);
    expect(ids.indexOf(exclusiveId)).toBeLessThan(ids.indexOf(plainId));
  });

  it('al quitar la exclusiva pierde la insignia y el filtro deja de incluirla', async () => {
    const upd = await auth(request(app).patch(`/api/v1/properties/${exclusiveId}`)).send({
      isExclusive: false,
    });
    expect(upd.status).toBe(200);
    expect(upd.body.data.isExclusive).toBe(false);
    const res = await auth(
      request(app).get('/api/v1/properties/admin?exclusiva=true&limit=50'),
    );
    const ids = (res.body.data as { id: string }[]).map((p) => p.id);
    expect(ids).not.toContain(exclusiveId);
  });
});
