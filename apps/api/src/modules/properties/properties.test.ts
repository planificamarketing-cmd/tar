import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';

const app = createApp();
const ADMIN_EMAIL = 'props-test-admin@tar.local';
const ADMIN_PASS = 'props-admin-123';
const COLONIA = 'Colonia Prueba Props';

let token: string;
let adminId: string;
let propId: string;
let slug: string;

beforeAll(async () => {
  const passwordHash = await argon2.hash(ADMIN_PASS);
  const [admin] = await db
    .insert(schema.users)
    .values({
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'Props Admin',
      role: 'admin',
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { passwordHash, role: 'admin', isActive: true },
    })
    .returning();
  adminId = admin!.id;

  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASS });
  token = login.body.accessToken;
});

afterAll(async () => {
  if (propId) await db.delete(schema.properties).where(eq(schema.properties.id, propId));
  await db.delete(schema.locations).where(eq(schema.locations.colonia, COLONIA));
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, adminId));
  await db.delete(schema.users).where(eq(schema.users.id, adminId));
  await pool.end();
});

const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

describe('Properties /api/v1/properties', () => {
  it('exige autenticación para crear (401)', async () => {
    const res = await request(app).post('/api/v1/properties').send({ title: 'x' });
    expect(res.status).toBe(401);
  });

  it('crea un borrador (201, status borrador, sin slug)', async () => {
    const res = await auth(request(app).post('/api/v1/properties')).send({
      title: 'Departamento de prueba en Props',
      propertyType: 'departamento',
      priceSale: 5_000_000,
      currencySale: 'MXN',
      bedrooms: 2,
      bathrooms: 2,
      areaM2: 90,
      estado: 'Ciudad de México',
      municipio: 'Cuauhtémoc',
      colonia: COLONIA,
      address: 'Calle de Prueba 123',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('borrador');
    expect(res.body.data.slug).toBeNull();
    expect(res.body.data.location.colonia).toBe(COLONIA);
    propId = res.body.data.id;
  });

  it('no publica sin geo (422 geo_required)', async () => {
    const res = await auth(
      request(app).post(`/api/v1/properties/${propId}/publish`),
    );
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('geo_required');
  });

  it('agrega ubicación con patch y publica (slug + disponible)', async () => {
    const patch = await auth(
      request(app).patch(`/api/v1/properties/${propId}`),
    ).send({ lat: 19.42, lng: -99.16, featured: 'premium' });
    expect(patch.status).toBe(200);
    expect(patch.body.data.lat).toBeCloseTo(19.42, 3);

    const pub = await auth(
      request(app).post(`/api/v1/properties/${propId}/publish`),
    );
    expect(pub.status).toBe(200);
    expect(pub.body.data.status).toBe('disponible');
    expect(typeof pub.body.data.slug).toBe('string');
    slug = pub.body.data.slug;
  });

  it('aparece en el listado público filtrando por colonia', async () => {
    const res = await request(app)
      .get('/api/v1/properties')
      .query({ colonia: 'Colonia Prueba' });
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.some((p: { id: string }) => p.id === propId)).toBe(true);
  });

  it('devuelve el detalle por slug con imágenes y amenidades', async () => {
    const res = await request(app).get(`/api/v1/properties/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(propId);
    expect(Array.isArray(res.body.data.images)).toBe(true);
    expect(Array.isArray(res.body.data.amenities)).toBe(true);
  });

  it('aparece en el mapa dentro del bbox (ST_Within)', async () => {
    const res = await request(app)
      .get('/api/v1/properties/map')
      .query({ bbox: '-99.30,19.30,-99.10,19.50' });
    expect(res.status).toBe(200);
    const found = res.body.data.find((p: { id: string }) => p.id === propId);
    expect(found).toBeTruthy();
    expect(found.currency).toBe('MXN');
  });

  it('cambia el estatus comercial y deja de listarse en público', async () => {
    const res = await auth(
      request(app).patch(`/api/v1/properties/${propId}/status`),
    ).send({ status: 'rentado' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rentado');

    const list = await request(app)
      .get('/api/v1/properties')
      .query({ colonia: 'Colonia Prueba' });
    expect(list.body.data.some((p: { id: string }) => p.id === propId)).toBe(
      false,
    );
  });

  it('el listado admin exige autenticación (401)', async () => {
    const res = await request(app).get('/api/v1/properties/admin');
    expect(res.status).toBe(401);
  });

  it('el listado admin muestra la propiedad aunque el público la oculte', async () => {
    const res = await auth(
      request(app).get('/api/v1/properties/admin').query({ status: 'rentado' }),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.some((p: { id: string }) => p.id === propId)).toBe(
      true,
    );
  });

  it('el detalle admin por id ve la propiedad (no requiere slug)', async () => {
    const res = await auth(
      request(app).get(`/api/v1/properties/admin/${propId}`),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(propId);
  });

  it('el conteo por estatus incluye rentado', async () => {
    const res = await auth(
      request(app).get('/api/v1/properties/admin/status-counts'),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.rentado).toBeGreaterThanOrEqual(1);
  });

  it('el conteo por tipo incluye departamento (mix del dashboard)', async () => {
    const res = await auth(
      request(app).get('/api/v1/properties/admin/type-counts'),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.departamento).toBeGreaterThanOrEqual(1);
  });

  it('soft delete (204) y luego 404 por slug', async () => {
    const del = await auth(request(app).delete(`/api/v1/properties/${propId}`));
    expect(del.status).toBe(204);
    // republicar para que fuese visible no aplica; verificamos por id admin vía slug:
    const res = await request(app).get(`/api/v1/properties/${slug}`);
    expect(res.status).toBe(404);
  });
});
