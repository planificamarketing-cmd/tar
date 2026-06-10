'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  ready?: boolean;
};

// Iconos mínimos (stroke currentColor) para no depender de una librería pesada.
const Icon = ({ d }: { d: string | string[] }) => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0"
  >
    {(Array.isArray(d) ? d : [d]).map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', ready: true, icon: <Icon d={['M3 13h8V3H3z', 'M13 21h8V11h-8z', 'M13 3h8v6h-8z', 'M3 17h8v4H3z']} /> },
  { href: '/admin/propiedades', label: 'Propiedades', icon: <Icon d={['M3 9.5L12 3l9 6.5', 'M5 10v10h14V10']} /> },
  { href: '/admin/leads', label: 'Leads', icon: <Icon d={['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8z', 'M23 21v-2a4 4 0 00-3-3.87']} /> },
  { href: '/admin/usuarios', label: 'Usuarios', icon: <Icon d={['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 11a4 4 0 100-8 4 4 0 000 8z']} /> },
  { href: '/admin/scripts', label: 'Scripts', icon: <Icon d={['M16 18l6-6-6-6', 'M8 6l-6 6 6 6']} /> },
  { href: '/admin/webhooks', label: 'Webhooks', icon: <Icon d={['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 01-3.46 0']} /> },
];

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/admin/login');
  }, [loading, user, router]);

  if (loading || !user) return <Spinner />;

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-navy text-white">
        <div className="flex h-16 items-center px-6">
          <Image
            src="/brand/tar-logo.webp"
            alt="TAR Internacional"
            width={135}
            height={64}
            className="h-8 w-auto"
            priority
          />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            const base =
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition';
            if (!item.ready) {
              return (
                <div
                  key={item.href}
                  className={`${base} cursor-not-allowed text-white/30`}
                  title="Próximamente"
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                    Pronto
                  </span>
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${base} ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 px-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-white/40">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
              {user.role === 'admin' ? 'Administrador' : 'Editor'}
            </span>
          </div>
          <button
            onClick={() => {
              void logout().then(() => router.replace('/admin/login'));
            }}
            className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="ml-60 flex-1">
        <main className="mx-auto max-w-6xl px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
