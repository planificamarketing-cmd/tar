import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { createServer, type Server } from 'node:http';
import { eq } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';
import { deliverWebhook, signPayload } from '../../lib/webhooks';

const app = createApp();
const EMAIL = 'wh-test-admin@tar.local';
const PASS = 'wh-admin-123';

let token: string;
let adminId: string;
let leadId: string;
const cleanup: { subs: string[]; keys: string[] } = { subs: [], keys: [] };

beforeAll(async () => {
  const passwordHash = await argon2.hash(PASS);
  const [admin] = await db
    .insert(schema.users)
    .values({ email: EMAIL, passwordHash, name: 'WH Admin', role: 'admin' })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { passwordHash, role: 'admin', isActive: true },
    })
    .returning();
  adminId = admin!.id;
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: EMAIL, password: PASS });
  token = login.body.accessToken;

  // Un lead real para que el webhook entrante lo actualice.
  const lead = await request(app)
    .post('/api/v1/leads')
    .send({
      name: 'Lead Webhook',
      email: 'wh@example.com',
      type: 'contacto',
      consent: true,
    });
  leadId = lead.body.data.id;
});

afterAll(async () => {
  for (const id of cleanup.subs)
    await db.delete(schema.webhookSubscriptions).where(eq(schema.webhookSubscriptions.id, id));
  for (const id of cleanup.keys)
    await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id));
  if (leadId) await db.delete(schema.leads).where(eq(schema.leads.id, leadId));
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, adminId));
  await db.delete(schema.users).where(eq(schema.users.id, adminId));
  await pool.end();
});

const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

describe('Webhooks /api/v1/webhooks', () => {
  it('CRUD de suscripciones salientes (admin)', async () => {
    const create = await auth(
      request(app).post('/api/v1/webhooks/subscriptions'),
    ).send({
      name: 'CRM de prueba',
      targetUrl: 'https://example.com/hook',
      secret: 'supersecret',
      events: ['lead.created', 'lead.status_changed'],
    });
    expect(create.status).toBe(201);
    const subId = create.body.data.id;
    cleanup.subs.push(subId);

    const list = await auth(request(app).get('/api/v1/webhooks/subscriptions'));
    expect(list.body.data.some((s: { id: string }) => s.id === subId)).toBe(true);

    const patch = await auth(
      request(app).patch(`/api/v1/webhooks/subscriptions/${subId}`),
    ).send({ isActive: false });
    expect(patch.body.data.isActive).toBe(false);
  });

  it('firma HMAC-SHA256 y entrega el POST (deliverWebhook)', async () => {
    let received: { sig?: string; event?: string; body: string } | null = null;
    const server: Server = createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        received = {
          sig: req.headers['x-tar-signature'] as string,
          event: req.headers['x-tar-event'] as string,
          body,
        };
        res.writeHead(200);
        res.end('ok');
      });
    });
    await new Promise<void>((r) => server.listen(0, r));
    const port = (server.address() as { port: number }).port;

    const result = await deliverWebhook(
      { targetUrl: `http://127.0.0.1:${port}/hook`, secret: 'shhh' },
      'lead.created',
      { foo: 'bar' },
      '2026-01-01T00:00:00.000Z',
    );
    server.close();

    expect(result.ok).toBe(true);
    expect(received).not.toBeNull();
    expect(received!.event).toBe('lead.created');
    expect(received!.sig).toBe(signPayload('shhh', received!.body));
  });

  it('API keys: crear devuelve la llave en claro una sola vez', async () => {
    const res = await auth(request(app).post('/api/v1/webhooks/api-keys')).send({
      name: 'Zapier',
      scopes: ['leads:write'],
    });
    expect(res.status).toBe(201);
    expect(res.body.data.key).toMatch(/^tar_/);
    cleanup.keys.push(res.body.data.id);

    const list = await auth(request(app).get('/api/v1/webhooks/api-keys'));
    const found = list.body.data.find(
      (k: { id: string }) => k.id === res.body.data.id,
    );
    expect(found.keyHash).toBeUndefined(); // nunca se expone el hash
  });

  it('inbound: sin/wrong API key → 401', async () => {
    const noKey = await request(app)
      .post('/api/v1/webhooks/inbound')
      .send({ action: 'lead.update_status', leadId, status: 'apartado' });
    expect(noKey.status).toBe(401);

    const bad = await request(app)
      .post('/api/v1/webhooks/inbound')
      .set('X-API-Key', 'tar_invalida')
      .send({ action: 'lead.update_status', leadId, status: 'apartado' });
    expect(bad.status).toBe(401);
  });

  it('inbound: scope insuficiente → 403; con scope correcto actualiza el lead', async () => {
    const created = await auth(
      request(app).post('/api/v1/webhooks/api-keys'),
    ).send({ name: 'Solo leads', scopes: ['leads:write'] });
    cleanup.keys.push(created.body.data.id);
    const key = created.body.data.key;

    // property.update_status requiere properties:write → 403.
    const forbidden = await request(app)
      .post('/api/v1/webhooks/inbound')
      .set('X-API-Key', key)
      .send({
        action: 'property.update_status',
        propertyId: '00000000-0000-0000-0000-000000000000',
        status: 'vendido',
      });
    expect(forbidden.status).toBe(403);

    // lead.update_status con scope correcto → aplica.
    const ok = await request(app)
      .post('/api/v1/webhooks/inbound')
      .set('X-API-Key', key)
      .send({ action: 'lead.update_status', leadId, status: 'apartado' });
    expect(ok.status).toBe(200);

    const [row] = await db
      .select({ status: schema.leads.status })
      .from(schema.leads)
      .where(eq(schema.leads.id, leadId));
    expect(row!.status).toBe('apartado');
  });

  it('prueba ad-hoc de webhook a un destino inaccesible reporta ok:false', async () => {
    const res = await auth(request(app).post('/api/v1/webhooks/test')).send({
      targetUrl: 'http://127.0.0.1:9/inexistente',
      secret: 'secreto-de-prueba',
      event: 'property.published',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(false);
    expect(res.body.data.error).toBeTruthy();
  });

  it('prueba de webhook exige autenticación (401)', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/test')
      .send({ targetUrl: 'http://example.com', secret: 'x'.repeat(8) });
    expect(res.status).toBe(401);
  });
});
