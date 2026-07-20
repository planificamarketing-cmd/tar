import Link from 'next/link';

// 404 del sitio público (se renderiza dentro del layout con header/footer).
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-canvas px-5 py-24 text-center">
      <div className="font-display text-[clamp(64px,12vw,120px)] font-bold leading-none tracking-[-2px] text-navy">
        404
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold text-navy">Página no encontrada</h1>
      <p className="mt-3 max-w-[420px] text-[15px] leading-relaxed text-muted">
        La propiedad o página que buscas no existe o dejó de estar disponible.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white">
          Ir al inicio
        </Link>
        <Link
          href="/propiedades"
          className="rounded-full border border-navy bg-white px-6 py-3 text-sm font-semibold text-navy"
        >
          Ver propiedades
        </Link>
      </div>
    </div>
  );
}
