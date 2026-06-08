import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '@tar/db';
import { createApp } from '../app';

const app = createApp();

afterAll(async () => {
  await pool.end();
});

describe('OpenAPI /docs', () => {
  it('sirve el spec en /docs/openapi.json', async () => {
    const res = await request(app).get('/docs/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.info.title).toContain('TAR');
    expect(res.body.paths['/api/v1/auth/login']).toBeDefined();
    expect(res.body.paths['/api/v1/properties']).toBeDefined();
  });

  it('sirve Swagger UI en /docs/', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });
});
