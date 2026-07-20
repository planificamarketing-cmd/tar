import Image from 'next/image';
import Link from 'next/link';

// Footer público fiel al prototipo v3 (Footer3): fondo navy, logo blanco (.webp),
// columnas de enlaces + datos de contacto. Los datos de contacto son los del
// prototipo; el cliente los ajusta antes del lanzamiento.
const COLUMNS: { title: string; links: { label: string; href?: string }[] }[] = [
  {
    title: 'Propiedades',
    links: [
      { label: 'Departamentos', href: '/propiedades?type=departamento' },
      { label: 'Oficinas', href: '/propiedades?type=oficina' },
      { label: 'Locales', href: '/propiedades?type=local_comercial' },
      { label: 'Bodegas', href: '/propiedades?type=bodega_industrial' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Nosotros', href: '/nosotros' },
      { label: 'Contacto', href: '/contacto' },
      { label: 'Aviso de Privacidad', href: '/aviso-privacidad' },
    ],
  },
  {
    title: 'Contacto',
    links: [
      { label: '+52 55 1234 5678' },
      { label: 'info@tarint.mx' },
      { label: 'Reforma 123, CDMX' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-navy px-6 pb-8 pt-12 text-white/50 lg:px-10 lg:pt-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-10 grid grid-cols-2 gap-8 lg:mb-12 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-12">
          <div className="col-span-2 lg:col-span-1">
            <Image
              src="/brand/tar-logo.webp"
              alt="TAR Internacional"
              width={150}
              height={44}
              className="mb-4 h-11 w-auto"
            />
            <p className="max-w-[280px] text-sm leading-relaxed">
              Grupo inmobiliario con más de 60 años de experiencia conectando personas con
              propiedades extraordinarias en México y Estados Unidos.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="mb-4 text-[11px] font-bold uppercase tracking-[2px] text-white/65">
                {col.title}
              </div>
              {col.links.map((l) =>
                l.href ? (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="mb-2.5 block text-[13px] transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                ) : (
                  <div key={l.label} className="mb-2.5 text-[13px]">
                    {l.label}
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between gap-2.5 border-t border-white/10 pt-5 text-xs lg:flex-row lg:gap-0">
          <span className="select-none">© 2026 TAR Internacional · Grupo Inmobiliario</span>
          <Link href="/aviso-privacidad" className="hover:text-white">
            Aviso de Privacidad · Cédula AMPI
          </Link>
        </div>
      </div>
    </footer>
  );
}
