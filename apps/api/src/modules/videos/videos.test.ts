import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { eq, like } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { createApp } from '../../app';

// Subida/CRUD de videos de propiedad (horizontal/vertical). No transcodifica:
// valida tipo + magic bytes y guarda en disco.
const app = createApp();
const ADMIN_EMAIL = 'video-test-admin@tar.local';
const PASS = 'video-admin-123';

let token: string;
let adminId: string;
let propId: string;
let videoId: string;

// mp4 mínimo: caja 'ftyp' en el offset 4 (suficiente para la validación; no se
// reproduce ni se transcodifica).
const MP4 = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x18]),
  Buffer.from('ftypisom'),
  Buffer.from('0000000000000000'),
]);

beforeAll(async () => {
  const passwordHash = await argon2.hash(PASS);
  const [admin] = await db
    .insert(schema.users)
    .values({ email: ADMIN_EMAIL, passwordHash, name: 'Video Admin', role: 'admin' })
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

  const [prop] = await db
    .insert(schema.properties)
    .values({ title: 'Propiedad con video', propertyType: 'casa' })
    .returning();
  propId = prop!.id;
});

afterAll(async () => {
  await db.delete(schema.properties).where(eq(schema.properties.id, propId));
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, adminId));
  await db.delete(schema.users).where(like(schema.users.email, 'video-test-%@tar.local'));
  await pool.end();
});

const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

describe('Videos /api/v1/properties/:id/videos', () => {
  it('exige autenticación (401)', async () => {
    const res = await request(app)
      .post(`/api/v1/properties/${propId}/videos`)
      .attach('video', MP4, { filename: 'v.mp4', contentType: 'video/mp4' });
    expect(res.status).toBe(401);
  });

  it('sube un video vertical (201)', async () => {
    const res = await auth(request(app).post(`/api/v1/properties/${propId}/videos`))
      .field('orientation', 'vertical')
      .attach('video', MP4, { filename: 'v.mp4', contentType: 'video/mp4' });
    expect(res.status).toBe(201);
    videoId = res.body.data.id;
    expect(res.body.data.orientation).toBe('vertical');
    expect(res.body.data.url).toContain('/videos/');
  });

  it('lista los videos de la propiedad', async () => {
    const res = await auth(request(app).get(`/api/v1/properties/${propId}/videos`));
    expect(res.status).toBe(200);
    expect((res.body.data as { id: string }[]).map((v) => v.id)).toContain(videoId);
  });

  it('rechaza un archivo que no es video (400)', async () => {
    const res = await auth(request(app).post(`/api/v1/properties/${propId}/videos`))
      .field('orientation', 'horizontal')
      .attach('video', Buffer.from('esto no es un video'), {
        filename: 'x.mp4',
        contentType: 'video/mp4',
      });
    expect(res.status).toBe(400);
  });

  it('rechaza un tipo no soportado (400)', async () => {
    const res = await auth(request(app).post(`/api/v1/properties/${propId}/videos`))
      .field('orientation', 'horizontal')
      .attach('video', MP4, { filename: 'x.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
  });

  it('elimina el video (204) y luego la lista queda vacía', async () => {
    const del = await auth(
      request(app).delete(`/api/v1/properties/${propId}/videos/${videoId}`),
    );
    expect(del.status).toBe(204);
    const list = await auth(request(app).get(`/api/v1/properties/${propId}/videos`));
    expect(list.body.data).toHaveLength(0);
  });
});
