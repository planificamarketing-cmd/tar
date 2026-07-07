import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';

const app = createApp();
const EMAIL = 'leads-test-admin@tar.local';
const PASS = 'leads-admin-123';

let token: string;
let adminId: string;
let leadId: string;

beforeAll(async () => {
  const passwordHash = await argon2.hash(PASS);
  const [admin] = await db
    .insert(schema.users)
    .values({ email: EMAIL, passwordHash, name: 'Leads Admin', role: 'admin' })
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
});

afterAll(async () => {
  if (leadId) await db.delete(schema.leads).where(eq(schema.leads.id, leadId));
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, adminId));
  await db.delete(schema.users).where(eq(schema.users.id, adminId));
  await pool.end();
});

const base = { name: 'Cliente Prueba', email: 'cliente@example.com' };

describe('Leads /api/v1/leads', () => {
  it('rechaza si el honeypot viene relleno (400)', async () => {
    const res = await request(app)
      .post('/api/v1/leads')
      .send({ ...base, type: 'contacto', consent: true, website: 'bot-spam' });
    expect(res.status).toBe(400);
  });

  it('exige consentimiento LFPDPPP (400 sin consent)', async () => {
    const res = await request(app)
      .post('/api/v1/leads')
      .send({ ...base, type: 'contacto' });
    expect(res.status).toBe(400);
  });

  it('una cita requiere preferredAt (400)', async () => {
    const res = await request(app)
      .post('/api/v1/leads')
      .send({ ...base, type: 'cita', consent: true });
    expect(res.status).toBe(400);
  });

  it('crea un lead válido (201) y sella el consentimiento', async () => {
    const res = await request(app)
      .post('/api/v1/leads')
      .send({
        ...base,
        type: 'contacto',
        message: 'Me interesa esta propiedad.',
        consent: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('nuevo');
    leadId = res.body.data.id;

    const [row] = await db
      .select({ consentAt: schema.leads.consentAt })
      .from(schema.leads)
      .where(eq(schema.leads.id, leadId));
    expect(row!.consentAt).not.toBeNull();
  });

  it('el listado admin exige autenticación (401)', async () => {
    const res = await request(app).get('/api/v1/leads');
    expect(res.status).toBe(401);
  });

  it('lista leads (admin) filtrando por status', async () => {
    const res = await request(app)
      .get('/api/v1/leads')
      .query({ status: 'nuevo' })
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((l: { id: string }) => l.id === leadId)).toBe(true);
  });

  it('cambia el status y registra lead_event + dispara evento', async () => {
    const res = await request(app)
      .patch(`/api/v1/leads/${leadId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'cita_agendada' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cita_agendada');
    expect(res.body.data.events.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.events[0].type).toBe('status_changed');
  });

  it('cambio de etapa masivo (bulk) reporta ok por id', async () => {
    const res = await request(app)
      .post('/api/v1/leads/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [leadId], status: 'apartado' });
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(1);
    expect(res.body.data.failed).toHaveLength(0);

    const [row] = await db
      .select({ status: schema.leads.status })
      .from(schema.leads)
      .where(eq(schema.leads.id, leadId));
    expect(row!.status).toBe('apartado');
  });
});
