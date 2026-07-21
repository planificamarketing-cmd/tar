'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// Error boundary del sitio público (se renderiza dentro del layout con header/footer).
// Debe ser Client Component: Next le inyecta `error` y `reset`.
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registro mínimo en consola del navegador; el detalle real queda en el server log.
    console.error('[public] error boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-canvas px-5 py-24 text-center">
      <div className="font-display text-[clamp(64px,12vw,120px)] font-bold leading-none tracking-[-2px] text-brand">
        500
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold text-navy">Algo salió mal</h1>
      <p className="mt-3 max-w-[420px] text-[15px] leading-relaxed text-muted">
        Ocurrió un error inesperado al cargar esta página. Puedes reintentar o volver al inicio.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-full border border-navy bg-white px-6 py-3 text-sm font-semibold text-navy"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
