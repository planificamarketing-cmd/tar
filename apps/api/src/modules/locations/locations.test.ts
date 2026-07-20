import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { eq, inArray } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';

const app = createApp();
const ADMIN_EMAIL = 'locations-test-admin@tar.local';
const ADMIN_PASS = 'locations-admin-123';
// Valores con acento/mayúsculas que deben deduplicarse a una sola location.
const ESTADO = 'Ciudad de México';
const MUNICIPIO = 'Cuauhtémoc';
const COLONIA = 'Colonia Acento Prueba';

let token: string;
let adminId: string;
const propIds: string[] = [];

beforeAll(async () => {
  const passwordHash = await argon2.hash(ADMIN_PASS);
  const [admin] = await db
    .insert(schema.users)
    .values({ email: ADMIN_EMAIL, passwordHash, name: 'Loc Admin', role: 'admin' })
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
  // Borra TODA propiedad que apunte a la(s) location(s) de prueba (cubre también
  // huérfanas de corridas previas) antes de eliminar la location, por la FK.
  const locs = await db
    .select({ id: schema.locations.id })
    .from(schema.locations)
    .where(eq(schema.locations.colonia, COLONIA));
  const locIds = locs.map((l) => l.id);
  if (locIds.length) {
    await db
      .delete(schema.properties)
      .where(inArray(schema.properties.locationId, locIds));
  }
  await db.delete(schema.locations).where(eq(schema.locations.colonia, COLONIA));
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, adminId));
  await db.delete(schema.users).where(eq(schema.users.id, adminId));
  await pool.end();
});

const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

async function createWithLocation(loc: {
  estado: string;
  municipio: string;
  colonia: string;
}): Promise<string> {
  const res = await auth(request(app).post('/api/v1/properties')).send({
    title: 'Prop ubicación ' + loc.colonia,
    propertyType: 'departamento',
    priceSale: 1000000,
    currencySale: 'MXN',
    ...loc,
  });
  expect(res.status).toBe(201);
  propIds.push(res.body.data.id);
  return res.body.data.id as string;
}

describe('Ubicaciones /api/v1/locations', () => {
  it('reutiliza la MISMA location aunque cambien acentos/mayúsculas (anti-duplicado)', async () => {
    const id1 = await createWithLocation({
      estado: ESTADO,
      municipio: MUNICIPIO,
      colonia: COLONIA,
    });
    const id2 = await createWithLocation({
      estado: 'ciudad de mexico', // sin acento + minúsculas
      municipio: 'CUAUHTEMOC',
      colonia: '  colonia   acento prueba ', // espacios + minúsculas
    });

    const [p1] = await db
      .select({ locationId: schema.properties.locationId })
      .from(schema.properties)
      .where(eq(schema.properties.id, id1));
    const [p2] = await db
      .select({ locationId: schema.properties.locationId })
      .from(schema.properties)
      .where(eq(schema.properties.id, id2));

    expect(p1!.locationId).toBeTruthy();
    expect(p2!.locationId).toBe(p1!.locationId);

    // Solo se creó UNA fila de location para esa colonia.
    const rows = await db
      .select()
      .from(schema.locations)
      .where(eq(schema.locations.colonia, COLONIA));
    expect(rows).toHaveLength(1);
    // Conserva la grafía canónica de la primera vez (con acento).
    expect(rows[0]!.municipio).toBe(MUNICIPIO);
  });

  it('GET /locations es público (200 sin sesión) para el autocompletado del sitio', async () => {
    const res = await request(app).get('/api/v1/locations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /locations devuelve el catálogo con la colonia canónica', async () => {
    const res = await auth(request(app).get('/api/v1/locations'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find(
      (l: { colonia: string }) => l.colonia === COLONIA,
    );
    expect(found).toMatchObject({ estado: ESTADO, municipio: MUNICIPIO });
  });
});
