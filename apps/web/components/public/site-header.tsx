'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IMenu, IClose } from './icons';

// Header público fiel al prototipo v3 (Header3): fijo, translúcido sobre el hero
// del inicio y blanco al hacer scroll o fuera del inicio. El enlace al panel NO
// aparece en el sitio público (en producción es un subdominio aparte tras login).
const NAV: { href: string; label: string }[] = [
  { href: '/', label: 'Inicio' },
  { href: '/propiedades', label: 'Propiedades' },
  { href: '/nosotros', label: 'Nosotros' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Cierra el menú al navegar.
  useEffect(() => setMenu(false), [pathname]);

  const floating = isHome && !scrolled && !menu;
  const active = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-[100] transition-colors duration-300',
        floating ? 'bg-transparent' : 'border-b border-[#F1F1F0] bg-white/95 backdrop-blur',
      ].join(' ')}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 lg:px-8 lg:py-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label="TAR Internacional — inicio">
          <Image
            src="/brand/tar-logo.svg"
            alt="TAR Internacional"
            width={160}
            height={50}
            priority
            className={['h-10 w-auto lg:h-[50px]', floating ? 'drop-shadow-[0_2px_12px_rgba(0,0,0,0.22)]' : ''].join(' ')}
          />
        </Link>

        {/* Desktop nav */}
        <nav
          className={[
            'hidden items-center gap-1 rounded-full border p-[5px] backdrop-blur lg:flex',
            floating ? 'border-white/40 bg-white/70' : 'border-[#F1F1F0] bg-[#F7F7F6]',
          ].join(' ')}
        >
          {NAV.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={[
                'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                active(it.href)
                  ? floating
                    ? 'bg-white/85 text-brand'
                    : 'bg-brand-soft text-brand'
                  : floating
                    ? 'text-navy hover:text-brand'
                    : 'text-ink hover:text-brand',
              ].join(' ')}
            >
              {it.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <Link
          href="/contacto"
          className="hidden shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover lg:block"
        >
          Contacto
        </Link>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Menú"
          onClick={() => setMenu((m) => !m)}
          className={[
            'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl text-navy lg:hidden',
            floating ? 'bg-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.15)]' : 'border border-[#F1F1F0] bg-[#F7F7F6]',
          ].join(' ')}
        >
          {menu ? <IClose s={22} /> : <IMenu s={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menu && (
        <div className="flex flex-col gap-1 border-t border-[#F1F1F0] bg-white/98 px-5 pb-5 pt-2.5 shadow-[0_14px_30px_rgba(15,27,45,0.10)] backdrop-blur lg:hidden">
          {NAV.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={[
                'rounded-lg px-3.5 py-3 text-[15px] font-medium',
                active(it.href) ? 'bg-brand-soft text-brand' : 'text-navy',
              ].join(' ')}
            >
              {it.label}
            </Link>
          ))}
          <Link
            href="/contacto"
            className="mt-1.5 rounded-xl bg-brand py-3.5 text-center text-[15px] font-semibold text-white"
          >
            Contacto
          </Link>
        </div>
      )}
    </header>
  );
}
