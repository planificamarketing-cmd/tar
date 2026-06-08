import argon2 from 'argon2';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import type { UserRole } from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';
import { signAccessToken } from '../../lib/jwt';
import { generateRefreshToken, hashToken, REFRESH_TTL_MS } from '../../lib/tokens';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

// Emite un access token y crea un refresh token rotativo (hash en BD).
async function issueTokens(user: PublicUser): Promise<AuthResult> {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });
  const refreshToken = generateRefreshToken();
  await db.insert(schema.refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  return { accessToken, refreshToken, user };
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  // Mensaje genérico para no filtrar si el email existe.
  const invalid = new ApiError(
    401,
    'invalid_credentials',
    'Correo o contraseña incorrectos.',
  );
  if (!user || !user.isActive) throw invalid;

  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) throw invalid;

  return issueTokens({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

// Rota el refresh: revoca el presentado y emite uno nuevo (+ access nuevo).
export async function refresh(rawToken: string): Promise<AuthResult> {
  const [row] = await db
    .select()
    .from(schema.refreshTokens)
    .where(
      and(
        eq(schema.refreshTokens.tokenHash, hashToken(rawToken)),
        isNull(schema.refreshTokens.revokedAt),
        gt(schema.refreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) {
    throw new ApiError(
      401,
      'invalid_refresh',
      'Sesión inválida o expirada. Inicia sesión de nuevo.',
    );
  }

  await db
    .update(schema.refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(schema.refreshTokens.id, row.id));

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, row.userId))
    .limit(1);

  if (!user || !user.isActive) {
    throw new ApiError(401, 'invalid_refresh', 'Usuario no disponible.');
  }

  return issueTokens({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

// Revoca el refresh presentado (logout).
export async function logout(rawToken: string): Promise<void> {
  await db
    .update(schema.refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.refreshTokens.tokenHash, hashToken(rawToken)),
        isNull(schema.refreshTokens.revokedAt),
      ),
    );
}

export async function getMe(userId: string) {
  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      isActive: schema.users.isActive,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) throw new ApiError(404, 'not_found', 'Usuario no encontrado.');
  return user;
}
