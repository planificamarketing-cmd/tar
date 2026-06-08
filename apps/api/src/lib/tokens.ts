import { createHash, randomBytes } from 'node:crypto';

// Refresh token opaco de alta entropía (256 bits). En BD se guarda solo su hash.
export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

// SHA-256 es adecuado para tokens de alta entropía (argon2 es para contraseñas).
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
