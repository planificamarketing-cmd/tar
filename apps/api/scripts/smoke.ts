/**
 * Smoke test legible: arranca la API en memoria y recorre el flujo completo
 * (salud → auth → propiedad → imagen → publicar → listar/mapa/detalle → leads →
 * analítica → entrega REAL de webhooks por pg-boss → estatus → borrar),
 * imprimiendo un checklist ✓/✗. No necesita el servidor corriendo; sí la BD
 * (`pnpm db:up`).
 *
 *   pnpm smoke
 */
import request from 'supertest';
import sharp from 'sharp';
import { createServer, type Server } from 'node:http';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { eq, inArray } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { env } from '../src/env';
import { createApp } from '../src/app';
import { startQueue, stopQueue } from '../src/lib/queue';
import { signPayload } from '../src/lib/webhooks';

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor(pred: () => boolean, timeoutMs = 12000, stepMs = 400) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (pred()) return true;
    await sleep(stepMs);
  }
  return false;
}

const COLONIA = 'Colonia Smoke';
const bearer = (r: request.Test, token: string) =>
  r.set('Authorization', `Bearer ${token}`);

let token = '';
let propId = '';
let slug = '';
const leadIds: string[] = [];
let subId = '';

// Receptor local para comprobar la entrega real del webhook.
const hookHits: Array<{ sig?: string; event?: string; body: string }> = [];
let receiver: Server | undefined;

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
    const r = await bearer(request(app).get('/api/v1/auth/me'), token);
    assert(r.status === 200, `status ${r.status}`);
    return r.body.user.email;
  });

  await check('GET /auth/me SIN token → 401', async () => {
    const r = await request(app).get('/api/v1/auth/me');
    assert(r.status === 401, `status ${r.status}`);
  });

  await check('pg-boss (cola de webhooks) inicia', async () => {
    await startQueue();
    return 'cola lista';
  });

  console.log(`\n${B}Propiedades y media${X}`);
  await check('Crear borrador (POST /properties)', async () => {
    const r = await bearer(request(app).post('/api/v1/properties'), token).send({
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
    propId = r.body.data.id;
    return `id ${propId.slice(0, 8)}…, status borrador`;
  });

  await check('Subir imagen (sharp → WebP + thumb)', async () => {
    const buf = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: { r: 200, g: 40, b: 60 } },
    })
      .png()
      .toBuffer();
    const r = await bearer(
      request(app).post(`/api/v1/properties/${propId}/images`),
      token,
    ).attach('images', buf, 'smoke.png');
    assert(r.status === 201, `status ${r.status}`);
    assert(/\.webp$/.test(r.body.data[0].urlWebp), 'no se generó WebP');
    return `${r.body.data.length} imagen WebP ${r.body.data[0].width}px`;
  });

  await check('Publicar SIN geo → 422 (validación)', async () => {
    const r = await bearer(
      request(app).post(`/api/v1/properties/${propId}/publish`),
      token,
    );
    assert(r.status === 422, `status ${r.status}`);
    return r.body.error.code;
  });

  await check('Fijar ubicación (PATCH geo) + premium', async () => {
    const r = await bearer(
      request(app).patch(`/api/v1/properties/${propId}`),
      token,
    ).send({ lat: 19.42, lng: -99.16, featured: 'premium' });
    assert(r.status === 200, `status ${r.status}`);
    return `lat ${r.body.data.lat}`;
  });

  await check('Publicar (slug + property.published)', async () => {
    const r = await bearer(
      request(app).post(`/api/v1/properties/${propId}/publish`),
      token,
    );
    assert(r.status === 200 && r.body.data.status === 'disponible', 'no publicó');
    slug = r.body.data.slug;
    return `slug ${slug}`;
  });

  console.log(`\n${B}Lectura pública${X}`);
  await check('GET /properties filtrando por colonia', async () => {
    const r = await request(app)
      .get('/api/v1/properties')
      .query({ colonia: 'Colonia Smoke', sort: 'relevancia' });
    assert(
      r.body.data.some((p: { id: string }) => p.id === propId),
      'no apareció en el listado',
    );
    return `${r.body.meta.total} resultado(s)`;
  });

  await check('GET /properties/:slug (detalle + imágenes)', async () => {
    const r = await request(app).get(`/api/v1/properties/${slug}`);
    assert(r.status === 200 && r.body.data.images.length >= 1, 'sin detalle');
    return `${r.body.data.images.length} imagen(es)`;
  });

  await check('GET /properties/map?bbox (ST_Within)', async () => {
    const r = await request(app)
      .get('/api/v1/properties/map')
      .query({ bbox: '-99.30,19.30,-99.10,19.50' });
    const found = r.body.data.find((p: { id: string }) => p.id === propId);
    assert(found, 'no apareció en el mapa');
    return `${r.body.data.length} punto(s); ${found.price} ${found.currency}`;
  });

  console.log(`\n${B}Leads y analítica${X}`);
  await check('POST /leads honeypot relleno → 400', async () => {
    const r = await request(app)
      .post('/api/v1/leads')
      .send({ name: 'Bot', email: 'b@b.com', type: 'contacto', consent: true, website: 'spam' });
    assert(r.status === 400, `status ${r.status}`);
  });

  await check('POST /leads válido (201, consentimiento)', async () => {
    const r = await request(app).post('/api/v1/leads').send({
      name: 'Cliente Smoke',
      email: 'cliente@example.com',
      type: 'contacto',
      message: 'Me interesa.',
      consent: true,
      propertyId: propId,
    });
    assert(r.status === 201, `status ${r.status}`);
    leadIds.push(r.body.data.id);
    return `status ${r.body.data.status}`;
  });

  await check('GET /leads (admin) y PATCH status', async () => {
    const list = await bearer(request(app).get('/api/v1/leads'), token);
    assert(list.body.data.some((l: { id: string }) => l.id === leadIds[0]), 'no se listó');
    const patch = await bearer(
      request(app).patch(`/api/v1/leads/${leadIds[0]}`),
      token,
    ).send({ status: 'cita_agendada' });
    assert(patch.status === 200, `status ${patch.status}`);
    return `→ ${patch.body.data.status}, ${patch.body.data.events.length} evento(s)`;
  });

  await check('POST /events/track (vista) → 204', async () => {
    const r = await request(app)
      .post('/api/v1/events/track')
      .send({ propertyId: propId, type: 'view' });
    assert(r.status === 204, `status ${r.status}`);
  });

  console.log(`\n${B}Webhooks — entrega REAL por pg-boss${X}`);
  await check('Crear suscripción → al disparar lead.created entrega firmado', async () => {
    receiver = createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        hookHits.push({
          sig: req.headers['x-tar-signature'] as string,
          event: req.headers['x-tar-event'] as string,
          body,
        });
        res.writeHead(200);
        res.end('ok');
      });
    });
    await new Promise<void>((r) => receiver!.listen(0, '127.0.0.1', r));
    const port = (receiver!.address() as { port: number }).port;
    const secret = 'smoke-secret';

    const sub = await bearer(
      request(app).post('/api/v1/webhooks/subscriptions'),
      token,
    ).send({
      name: 'Receptor smoke',
      targetUrl: `http://127.0.0.1:${port}/hook`,
      secret,
      events: ['lead.created'],
    });
    subId = sub.body.data.id;

    // Disparar el evento creando un lead.
    const lead = await request(app).post('/api/v1/leads').send({
      name: 'Lead Webhook',
      email: 'wh@example.com',
      type: 'contacto',
      consent: true,
    });
    leadIds.push(lead.body.data.id);

    const ok = await waitFor(() => hookHits.length > 0);
    assert(ok, 'el webhook no llegó (timeout)');
    const hit = hookHits[0]!;
    assert(hit.event === 'lead.created', `evento ${hit.event}`);
    assert(hit.sig === signPayload(secret, hit.body), 'firma HMAC no coincide');
    return 'entregado con firma X-TAR-Signature válida';
  });

  await check('Bitácora registra la entrega como "entregado"', async () => {
    const r = await bearer(
      request(app).get('/api/v1/webhooks/deliveries'),
      token,
    );
    const mine = r.body.data.find(
      (d: { subscriptionId: string }) => d.subscriptionId === subId,
    );
    assert(mine, 'no hay registro de entrega');
    assert(mine.status === 'entregado', `status ${mine.status}`);
    return `intentos: ${mine.attempts}, código ${mine.responseCode}`;
  });

  console.log(`\n${B}Estatus y borrado${X}`);
  await check('PATCH /:id/status → vendido (sale del público)', async () => {
    await bearer(
      request(app).patch(`/api/v1/properties/${propId}/status`),
      token,
    ).send({ status: 'vendido' });
    const list = await request(app)
      .get('/api/v1/properties')
      .query({ colonia: 'Colonia Smoke' });
    assert(
      !list.body.data.some((p: { id: string }) => p.id === propId),
      'sigue listándose',
    );
    return 'oculto del público ✓';
  });

  await check('DELETE /:id → soft delete (204)', async () => {
    const r = await bearer(
      request(app).delete(`/api/v1/properties/${propId}`),
      token,
    );
    assert(r.status === 204, `status ${r.status}`);
  });

  await cleanup();

  console.log(
    `\n${B}Resultado:${X} ${G}${passed} ok${X}${failed ? `, ${R}${failed} fallidos${X}` : ''}\n`,
  );
  process.exit(failed ? 1 : 0);
}

async function cleanup() {
  if (subId)
    await db
      .delete(schema.webhookSubscriptions)
      .where(eq(schema.webhookSubscriptions.id, subId));
  if (leadIds.length)
    await db.delete(schema.leads).where(inArray(schema.leads.id, leadIds));
  if (propId) {
    await db.delete(schema.properties).where(eq(schema.properties.id, propId));
    await rm(join(env.MEDIA_DIR, propId), { recursive: true, force: true });
  }
  await db
    .delete(schema.locations)
    .where(eq(schema.locations.colonia, COLONIA));
  receiver?.close();
  await stopQueue();
  await pool.end();
}

main().catch(async (e) => {
  console.error(`${R}Error fatal del smoke:${X}`, e);
  await cleanup().catch(() => {});
  process.exit(1);
});
