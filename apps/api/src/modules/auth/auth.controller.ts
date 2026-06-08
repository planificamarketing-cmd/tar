import type { Request, Response } from 'express';
import { loginSchema } from '@tar/shared';
import { env } from '../../env';
import { ApiError } from '../../middleware/error-handler';
import { REFRESH_TTL_MS } from '../../lib/tokens';
import * as authService from './auth.service';

const REFRESH_COOKIE = 'refresh_token';

// El refresh se entrega como cookie httpOnly (acotada a /auth) y también en el body.
const cookieOpts = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: REFRESH_TTL_MS,
};

function getRefreshToken(req: Request): string {
  const fromCookie = (req.cookies as Record<string, string> | undefined)?.[
    REFRESH_COOKIE
  ];
  const fromBody = (req.body as { refreshToken?: string } | undefined)
    ?.refreshToken;
  const token = fromCookie ?? fromBody;
  if (!token) {
    throw new ApiError(401, 'missing_refresh', 'Falta el refresh token.');
  }
  return token;
}

// Express 5 propaga los errores de los handlers async al errorHandler central.
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.login(email, password);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOpts);
  res.json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const result = await authService.refresh(getRefreshToken(req));
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOpts);
  res.json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(getRefreshToken(req));
  res.clearCookie(REFRESH_COOKIE, { path: cookieOpts.path });
  res.status(204).end();
}

export async function me(req: Request, res: Response): Promise<void> {
  // requireAuth garantiza req.user.
  const user = await authService.getMe(req.user!.sub);
  res.json({ user });
}
