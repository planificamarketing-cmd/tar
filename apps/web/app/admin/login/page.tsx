'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loginSchema } from '@tar/shared';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/admin');
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError('Revisa tu correo y contraseña.');
      return;
    }
    setBusy(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      router.replace('/admin');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo iniciar sesión. Intenta de nuevo.',
      );
    } finally {
      setBusy(false);
    }
  }

  const field =
    'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-brand';

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <Image
            src="/brand/tar-logo.svg"
            alt="TAR Internacional"
            width={111}
            height={85}
            priority
            className="h-20 w-auto"
          />
          <h1 className="mt-7 font-display text-2xl text-navy">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted">
            Acceso exclusivo para el equipo de TAR Internacional.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6 shadow-sm"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Correo</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@tarinternacional.com"
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={field}
            />
          </label>

          {error && (
            <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs font-medium text-brand">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted/70">
          © {new Date().getFullYear()} TAR Internacional · Grupo Inmobiliario
        </p>
      </div>
    </main>
  );
}
