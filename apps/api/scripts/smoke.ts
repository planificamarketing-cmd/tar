/**
 * Smoke test legible: arranca la API en memoria y recorre el flujo completo
 * (salud → auth → propiedad → imagen → publicar → listar/mapa/detalle → estatus
 * → borrar), imprimiendo un checklist ✓/✗. No necesita el servidor corriendo;
 * sí necesita la BD (`pnpm db:up`).
 *
 *   pnpm smoke
 */
import request from 'supertest';
import sharp from 'sharp';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { env } from '../src/env';
import { createApp } from '../src/app';

const app = createApp();
const G = '\x1b[32m';
const R = '\x1b[31m';
const D = '\x1b[90m';
const B = '\x1b[1m';
const X = '\x1b[0m';

let passed = 0;
let failed = 0;

async function check(label: string, fn: () => Promise<string | void>) {
  try {
    const detail = await fn();
    passed += 1;
    console.log(`  ${G}✓${X} ${label}${detail ? `  ${D}${detail}${X}` : ''}`);
  } catch (e) {
    failed += 1;
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ${R}✗ ${label}${X}\n      ${R}${msg}${X}`);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const COLONIA = 'Colonia Smoke';
let token = '';
let propId = '';
let slug = '';

async function main() {
  console.log(`\n${B}🔎 Smoke test — Plataforma TAR (API ${env.NODE_ENV})${X}\n`);

  console.log(`${B}Salud y autenticación${X}`);
  await check('GET /health responde y la BD conecta', async () => {
    const r = await request(app).get('/health');
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.db === true, 'la BD no responde — ¿corriste pnpm db:up?');
    return `db:${r.body.db}, postgis ok`;
  });

  await check('Login del admin seedeado', async () => {
    const r = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@tarinternacional.com', password: 'admin123' });
    assert(r.status === 200, `status ${r.status} — ¿corriste pnpm db:seed?`);
    token = r.body.accessToken;
    assert(typeof token === 'string', 'sin accessToken');
    return `rol ${r.body.user.role}`;
  });

  await check('GET /auth/me con token', async () => {
    const r = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    assert(r.status === 200, `status ${r.status}`);
    return r.body.user.email;
  });

  await check('GET /auth/me SIN token → 401', async () => {
    const r = await request(app).get('/api/v1/auth/me');
    assert(r.status === 401, `status ${r.status}`);
  });

  console.log(`\n${B}Propiedades y media${X}`);
  await check('Crear borrador (POST /properties)', async () => {
    const r = await request(app)
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Propiedad de prueba (smoke)',
        propertyType: 'departamento',
        priceSale: 4_500_000,
        currencySale: 'MXN',
        bedrooms: 2,
        bathrooms: 2,
        areaM2: 95,
        estado: 'Ciudad de México',
        municipio: 'Cuauhtémoc',
        colonia: COLONIA,
      });
    assert(r.status === 201, `status ${r.status}`);
    assert(r.body.data.status === 'borrador', 'no quedó en borrador');
    propId = r.body.data.id;
    return `id ${propId.slice(0, 8)}…, status borrador`;
  });

  await check('Subir imagen (sharp → WebP + thumb)', async () => {
    const buf = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: { r: 200, g: 40, b: 60 } },
    })
      .png()
      .toBuffer();
    const r = await request(app)
      .post(`/api/v1/properties/${propId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', buf, 'smoke.png');
    assert(r.status === 201, `status ${r.status}`);
    assert(/\.webp$/.test(r.body.data[0].urlWebp), 'no se generó WebP');
    return `${r.body.data.length} imagen WebP ${r.body.data[0].width}px`;
  });

  await check('Publicar SIN geo → 422 (validación)', async () => {
    const r = await request(app)
      .post(`/api/v1/properties/${propId}/publish`)
      .set('Authorization', `Bearer ${token}`);
    assert(r.status === 422, `status ${r.status}`);
    return r.body.error.code;
  });

  await check('Fijar ubicación (PATCH geo) + premium', async () => {
    const r = await request(app)
      .patch(`/api/v1/properties/${propId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ lat: 19.42, lng: -99.16, featured: 'premium' });
    assert(r.status === 200, `status ${r.status}`);
    return `lat ${r.body.data.lat}`;
  });

  await check('Publicar (slug inmutable + property.published)', async () => {
    const r = await request(app)
      .post(`/api/v1/properties/${propId}/publish`)
      .set('Authorization', `Bearer ${token}`);
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.data.status === 'disponible', 'no quedó disponible');
    slug = r.body.data.slug;
    return `slug ${slug}`;
  });

  console.log(`\n${B}Lectura pública${X}`);
  await check('GET /properties filtrando por colonia', async () => {
    const r = await request(app)
      .get('/api/v1/properties')
      .query({ colonia: 'Colonia Smoke', sort: 'relevancia' });
    assert(r.status === 200, `status ${r.status}`);
    assert(
      r.body.data.some((p: { id: string }) => p.id === propId),
      'no apareció en el listado',
    );
    return `${r.body.meta.total} resultado(s)`;
  });

  await check('GET /properties/:slug (detalle + imágenes)', async () => {
    const r = await request(app).get(`/api/v1/properties/${slug}`);
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.data.images.length >= 1, 'sin imágenes');
    return `${r.body.data.images.length} imagen(es), ${r.body.data.amenities.length} amenidad(es)`;
  });

  await check('GET /properties/map?bbox (ST_Within)', async () => {
    const r = await request(app)
      .get('/api/v1/properties/map')
      .query({ bbox: '-99.30,19.30,-99.10,19.50' });
    assert(r.status === 200, `status ${r.status}`);
    const found = r.body.data.find((p: { id: string }) => p.id === propId);
    assert(found, 'no apareció en el mapa');
    return `${r.body.data.length} punto(s); precio ${found.price} ${found.currency}`;
  });

  console.log(`\n${B}Estatus y borrado${X}`);
  await check('PATCH /:id/status → vendido (sale del público)', async () => {
    const r = await request(app)
      .patch(`/api/v1/properties/${propId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'vendido' });
    assert(r.status === 200, `status ${r.status}`);
    const list = await request(app)
      .get('/api/v1/properties')
      .query({ colonia: 'Colonia Smoke' });
    assert(
      !list.body.data.some((p: { id: string }) => p.id === propId),
      'sigue listándose tras vendido',
    );
    return 'oculto del público ✓';
  });

  await check('DELETE /:id → soft delete (204)', async () => {
    const r = await request(app)
      .delete(`/api/v1/properties/${propId}`)
      .set('Authorization', `Bearer ${token}`);
    assert(r.status === 204, `status ${r.status}`);
  });

  // Limpieza: borra de verdad la propiedad de prueba y su media/location.
  await db.delete(schema.properties).where(eq(schema.properties.id, propId));
  await db.delete(schema.locations).where(eq(schema.locations.colonia, COLONIA));
  await rm(join(env.MEDIA_DIR, propId), { recursive: true, force: true });

  console.log(
    `\n${B}Resultado:${X} ${G}${passed} ok${X}${failed ? `, ${R}${failed} fallidos${X}` : ''}\n`,
  );
  await pool.end();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(`${R}Error fatal del smoke:${X}`, e);
  await pool.end().catch(() => {});
  process.exit(1);
});
