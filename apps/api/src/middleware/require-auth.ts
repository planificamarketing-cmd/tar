import type { RequestHandler } from 'express';
import { type Capability, roleCan, type UserRole } from '@tar/shared';
import { verifyAccessToken, type AccessClaims } from '../lib/jwt';
import { ApiError } from './error-handler';

// Aumenta Express.Request con el usuario autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessClaims;
    }
  }
}

// requireAuth — exige un access token válido en `Authorization: Bearer <token>`.
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new ApiError(401, 'unauthorized', 'Falta el token de acceso.'));
    return;
  }
  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    next(new ApiError(401, 'invalid_token', 'Token inválido o expirado.'));
  }
};

// requireRole — exige que el usuario tenga uno de los roles indicados.
export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, 'unauthorized', 'No autenticado.'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, 'forbidden', 'No tienes permisos para esta acción.'));
      return;
    }
    next();
  };

// requirePermission — exige que el rol del usuario tenga la capacidad indicada
// (RBAC de grano fino, mapa único en @tar/shared). Cada ruta declara su capacidad.
export const requirePermission =
  (capability: Capability): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, 'unauthorized', 'No autenticado.'));
      return;
    }
    if (!roleCan(req.user.role, capability)) {
      next(new ApiError(403, 'forbidden', 'No tienes permisos para esta acción.'));
      return;
    }
    next();
  };
