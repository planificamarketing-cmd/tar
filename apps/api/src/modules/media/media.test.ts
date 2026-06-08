import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import { env } from '../../env';
import { keyFromUrl } from '../../lib/storage';
import { createApp } from '../../app';

const app = createApp();
const EMAIL = 'media-test-admin@tar.local';
const PASS = 'media-admin-123';

let token: string;
let adminId: string;
let propId: string;

const png = (r: number, g: number, b: number) =>
  sharp({
    create: { width: 1200, height: 900, channels: 3, background: { r, g, b } },
  })
    .png()
    .toBuffer();

const onDisk = (url: string) => existsSync(join(env.MEDIA_DIR, keyFromUrl(url)));

beforeAll(async () => {
  const passwordHash = await argon2.hash(PASS);
  const [admin] = await db
    .insert(schema.users)
    .values({ email: EMAIL, passwordHash, name: 'Media Admin', role: 'admin' })
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

  const prop = await request(app)
    .post('/api/v1/properties')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Propiedad para fotos',
      propertyType: 'casa',
      priceSale: 3_000_000,
      currencySale: 'MXN',
    });
  propId = prop.body.data.id;
});

afterAll(async () => {
  await db.delete(schema.properties).where(eq(schema.properties.id, propId));
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, adminId));
  await db.delete(schema.users).where(eq(schema.users.id, adminId));
  await rm(join(env.MEDIA_DIR, propId), { recursive: true, force: true });
  await pool.end();
});

describe('Media /api/v1/properties/:id/images', () => {
  let img1: string;
  let img2: string;
  let webp1: string;

  it('exige autenticación (401)', async () => {
    const res = await request(app)
      .post(`/api/v1/properties/${propId}/images`)
      .attach('images', await png(10, 20, 30), 'a.png');
    expect(res.status).toBe(401);
  });

  it('sube imágenes: re-codifica a WebP, crea thumb y archivos en disco', async () => {
    const res = await request(app)
      .post(`/api/v1/properties/${propId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', await png(200, 30, 40), 'uno.png')
      .attach('images', await png(30, 120, 200), 'dos.png');

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);

    const [a, b] = res.body.data;
    expect(a.urlWebp).toMatch(/\.webp$/);
    expect(a.urlThumb).toMatch(/_thumb\.webp$/);
    expect(a.width).toBeGreaterThan(0);
    expect(a.isCover).toBe(true); // la primera es portada
    expect(b.isCover).toBe(false);
    expect(onDisk(a.urlWebp)).toBe(true);
    expect(onDisk(a.urlThumb)).toBe(true);

    img1 = a.id;
    img2 = b.id;
    webp1 = a.urlWebp;
  });

  it('rechaza un archivo que no es imagen (400)', async () => {
    const res = await request(app)
      .post(`/api/v1/properties/${propId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('esto no es una imagen'), {
        filename: 'fake.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_image');
  });

  it('cambia la portada a la segunda imagen', async () => {
    const res = await request(app)
      .patch(`/api/v1/properties/${propId}/images/${img2}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isCover: true, alt: 'Fachada' });
    expect(res.status).toBe(200);
    expect(res.body.data.isCover).toBe(true);
    expect(res.body.data.alt).toBe('Fachada');

    const detail = await db
      .select({ id: schema.propertyImages.id, isCover: schema.propertyImages.isCover })
      .from(schema.propertyImages)
      .where(eq(schema.propertyImages.id, img1));
    expect(detail[0]!.isCover).toBe(false); // la anterior dejó de ser portada
  });

  it('elimina una imagen y borra sus archivos del disco', async () => {
    expect(onDisk(webp1)).toBe(true);
    const res = await request(app)
      .delete(`/api/v1/properties/${propId}/images/${img1}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    expect(onDisk(webp1)).toBe(false);
  });
});
