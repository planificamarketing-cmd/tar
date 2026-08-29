import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { eq, inArray } from 'drizzle-orm';

// El webhook `lead.created` debe llevar el snapshot de la propiedad con los
// campos que agregamos (m² útil/rentable de oficina, áreas exteriores, remate…),
// para que el CRM/n8n reciba el contexto del formulario sin una 2ª llamada.
// Mockeamos el emisor de eventos para inspeccionar el payload emitido.
vi.mock('../../lib/events', () => ({ emitEvent: vi.fn().mockResolvedValue(undefined) }));

import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';
import { emitEvent } from '../../lib/events';
import { createLead } from './leads.service';
import { publicApiUrl } from '../../env';

const app = createApp();
const ADMIN_EMAIL = 'leadwh-test-admin@tar.local';
const PASS = 'leadwh-admin-123';
const COLONIA = 'Colonia Lead Webhook';

let token: string;
let adminId: string;
let officeId: string;
let leadId: string;

beforeAll(async () => {
  const passwordHash = await argon2.hash(PASS);
  const [admin] = await db
    .insert(schema.users)
    .values({ email: ADMIN_EMAIL, passwordHash, name: 'Lead WH', role: 'admin' })
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

  const res = await request(app)
    .post('/api/v1/properties')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Oficina lead webhook',
      propertyType: 'oficina',
      priceRent: 30_000,
      currencyRent: 'MXN',
      areaM2: 120,
      usableAreaM2: 100,
      rentableAreaM2: 110,
      terraceM2: 20,
      isRemate: true,
      isExclusive: true,
      estado: 'Ciudad de México',
      municipio: 'Cuauhtémoc',
      colonia: COLONIA,
      lat: 19.43,
      lng: -99.16,
    });
  officeId = res.body.data.id;
  // Publicada: solo con ficha pública el folleto PDF del payload es descargable.
  await request(app)
    .post(`/api/v1/properties/${officeId}/publish`)
    .set('Authorization', `Bearer ${token}`);
});

afterAll(async () => {
  if (leadId) await db.delete(schema.leads).where(eq(schema.leads.id, leadId));
  const locs = await db
    .select({ id: schema.locations.id })
    .from(schema.locations)
    .where(eq(schema.locations.colonia, COLONIA));
  const locIds = locs.map((l) => l.id);
  if (locIds.length)
    await db.delete(schema.properties).where(inArray(schema.properties.locationId, locIds));
  await db.delete(schema.locations).where(eq(schema.locations.colonia, COLONIA));
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, adminId));
  await db.delete(schema.users).where(eq(schema.users.id, adminId));
  await pool.end();
});

describe('Webhook lead.created — payload enriquecido con la propiedad', () => {
  it('incluye el lead completo y el snapshot con los campos del Grupo A', async () => {
    const out = await createLead({
      propertyId: officeId,
      name: 'Cliente Interesado',
      email: 'interesado@example.com',
      phone: '+52 55 1234 5678',
      message: 'Me interesa esta oficina.',
      type: 'contacto',
      consent: true,
    });
    leadId = out.id;

    const call = (emitEvent as unknown as { mock: { calls: unknown[][] } }).mock.calls.find(
      (c) => c[0] === 'lead.created',
    );
    expect(call).toBeTruthy();
    const payload = call![1] as Record<string, unknown>;

    // Lead completo
    expect(payload.name).toBe('Cliente Interesado');
    expect(payload.phone).toBe('+52 55 1234 5678');
    expect(payload.message).toBe('Me interesa esta oficina.');
    expect(payload.consentAt).toBeTruthy();

    // Snapshot de la propiedad con los campos agregados
    const property = payload.property as Record<string, unknown>;
    expect(property).toBeTruthy();
    expect(property.title).toBe('Oficina lead webhook');
    expect(property.propertyType).toBe('oficina');
    expect(property.usableAreaM2).toBe(100);
    expect(property.rentableAreaM2).toBe(110);
    expect(property.terraceM2).toBe(20);
    expect(property.isRemate).toBe(true);
    expect(property.isExclusive).toBe(true);
    expect((property.price as { rent: number }).rent).toBe(30_000);
    expect(property.location).toBeTruthy();

    // Folleto PDF listo para adjuntar al prospecto: SIEMPRE sin dirección exacta.
    const flyer = property.flyer as Record<string, unknown>;
    expect(flyer).toBeTruthy();
    expect(flyer.url).toBe(
      `${publicApiUrl}/properties/${property.slug as string}/flyer.pdf`,
    );
    expect(flyer.contentType).toBe('application/pdf');
    expect(flyer.includesAddress).toBe(false);

    // Y el enlace del folleto responde un PDF de verdad, sin autenticación.
    const pdf = await request(app)
      .get(`/api/v1/properties/${property.slug as string}/flyer.pdf`)
      .buffer(true);
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect(pdf.body.slice(0, 4).toString('latin1')).toBe('%PDF');
  });
});
