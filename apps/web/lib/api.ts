import type { UserRole } from '@tar/shared';

// Cliente HTTP del backoffice contra la API (§5). El access token (JWT 15 min) vive
// SOLO en memoria; el refresh es una cookie httpOnly (acotada a /auth) que el navegador
// envía sola con `credentials: 'include'`. Al recibir 401 se intenta un refresh y se
// reintenta la petición una vez.
// En producción se fija `NEXT_PUBLIC_API_URL` (subdominio de la API). En desarrollo,
// si no está, se deriva del host del navegador → funciona igual por `localhost:3000`
// que por la IP de WSL (172.x:3000) sin reconfigurar nada.
function getApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) {
    // Valor relativo (modo proxy de un solo origen, p.ej. "/api/v1"): en el navegador
    // resuelve same-origin solo, sin :4000 ni CORS — sirve para el demo por túnel y
    // para producción tras Caddy. En SSR necesita una base absoluta.
    if (fromEnv.startsWith('/') && typeof window === 'undefined') {
      return `http://localhost:4000${fromEnv}`;
    }
    return fromEnv;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000/api/v1`;
  }
  return 'http://localhost:4000/api/v1';
}

// En modo proxy de un solo origen, `NEXT_PUBLIC_API_URL` es relativo ("/api/v1") y
// tanto la API como el media los sirve el mismo host público (sin :4000).
const sameOriginProxy = (process.env.NEXT_PUBLIC_API_URL ?? '').startsWith('/');

// Las imágenes se guardan con URL absoluta contra `MEDIA_BASE_URL` (en dev,
// `http://localhost:4000/media/...`). El host real varía (localhost en la misma
// PC, IP de WSL desde Windows), así que —igual que getApiBase()— reescribimos el
// host LOCAL de dev al del navegador para que la imagen cargue desde donde se
// abrió el panel. En producción `MEDIA_BASE_URL` es el dominio real y no se toca;
// las URLs externas (placehold.co, etc.) tampoco.
export function mediaUrl(stored: string | null | undefined): string {
  if (!stored) return '';
  if (typeof window === 'undefined') return stored;
  try {
    const u = new URL(stored);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      if (sameOriginProxy) {
        // El host público sirve /media por el mismo origen (Caddy → :4000); se
        // descarta el :4000 del dev y se usa el origen actual.
        return `${window.location.origin}${u.pathname}${u.search}`;
      }
      u.protocol = window.location.protocol;
      u.hostname = window.location.hostname;
    }
    return u.toString();
  } catch {
    return stored; // rutas relativas / valores no-URL: se dejan como están
  }
}

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken: string | null = null;
export const getAccessToken = (): string | null => accessToken;
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

async function toError(res: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    /* respuesta sin cuerpo JSON */
  }
  const err = (body as { error?: { code?: string; message?: string; details?: unknown } })
    ?.error;
  return new ApiError(
    res.status,
    err?.message ?? res.statusText ?? 'Error de red',
    err?.code,
    err?.details,
  );
}

// Un solo refresh en vuelo compartido (evita ráfagas de refresh ante varios 401).
let refreshing: Promise<AuthResponse> | null = null;

async function rawRefresh(): Promise<AuthResponse> {
  const res = await fetch(`${getApiBase()}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) throw await toError(res);
  const data = (await res.json()) as AuthResponse;
  accessToken = data.accessToken;
  return data;
}

export function refresh(): Promise<AuthResponse> {
  if (!refreshing) {
    refreshing = rawRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

type FetchOptions = RequestInit & { auth?: boolean; _retry?: boolean };

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { auth = true, _retry = false, headers, ...rest } = options;
  const h = new Headers(headers);
  if (rest.body && !h.has('Content-Type')) h.set('Content-Type', 'application/json');
  if (auth && accessToken) h.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${getApiBase()}${path}`, {
    ...rest,
    headers: h,
    credentials: 'include',
  });

  if (res.status === 401 && auth && !_retry) {
    try {
      await refresh();
    } catch {
      throw await toError(res);
    }
    return apiFetch<T>(path, { ...options, _retry: true });
  }

  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// Subida multipart (FormData) — NO se fija Content-Type (el navegador pone el
// boundary). Mismo manejo de 401 → refresh → reintento una vez.
export async function apiUpload<T>(
  path: string,
  form: FormData,
  _retry = false,
): Promise<T> {
  const h = new Headers();
  if (accessToken) h.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'POST',
    body: form,
    headers: h,
    credentials: 'include',
  });

  if (res.status === 401 && !_retry) {
    try {
      await refresh();
    } catch {
      throw await toError(res);
    }
    return apiUpload<T>(path, form, true);
  }

  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// URL absoluta de un endpoint (para enlaces copiables, p. ej. el feed de Meta).
export function apiUrl(path: string): string {
  return `${getApiBase()}${path}`;
}

// Descarga un binario (p. ej. el flyer PNG) con auth Bearer. Mismo manejo de
// 401 → refresh → reintento una vez. Devuelve el Blob.
export async function apiBlob(path: string, _retry = false): Promise<Blob> {
  const h = new Headers();
  if (accessToken) h.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${getApiBase()}${path}`, {
    headers: h,
    credentials: 'include',
  });

  if (res.status === 401 && !_retry) {
    try {
      await refresh();
    } catch {
      throw await toError(res);
    }
    return apiBlob(path, true);
  }

  if (!res.ok) throw await toError(res);
  return res.blob();
}

// ── Endpoints de autenticación ───────────────────────────────────────────────
export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });
  accessToken = data.accessToken;
  return data;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST', body: '{}' });
  } finally {
    accessToken = null;
  }
}

export async function me(): Promise<{ user: AdminUser }> {
  return apiFetch<{ user: AdminUser }>('/auth/me');
}
