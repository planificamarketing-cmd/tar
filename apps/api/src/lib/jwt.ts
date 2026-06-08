import jwt from 'jsonwebtoken';
import type { UserRole } from '@tar/shared';
import { env } from '../env';

// Access token de vida corta (15 min). El refresh vive en BD (rotativo).
export const ACCESS_TTL = '15m';

export interface AccessClaims {
  sub: string; // user id
  role: UserRole;
  email: string;
}

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function verifyAccessToken(token: string): AccessClaims {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof payload === 'string') throw new Error('Token inválido');
  return payload as AccessClaims;
}
