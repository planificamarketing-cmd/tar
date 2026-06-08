import { describe, it, expect, afterAll } from 'vitest';
import { pool } from '@tar/db';
import { slugify } from './slug';

afterAll(async () => {
  await pool.end();
});

describe('slugify', () => {
  it('normaliza acentos, espacios y símbolos', () => {
    expect(slugify('Casa 3 Recámaras en Polanco')).toBe(
      'casa-3-recamaras-en-polanco',
    );
    expect(slugify('  Óñ)(*&^ Edificio  ')).toBe('on-edificio');
    expect(slugify('Penthouse — Reforma 222')).toBe('penthouse-reforma-222');
  });
});
