'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  NDash,
  NHome,
  NPlus,
  NTenant,
  NUser,
  NScript,
  NCog,
  NLogout,
  type IconProps,
} from '@/components/icons';

type NavItem = {
  href: string;
  label: string;
  Icon: (p: IconProps) => React.ReactNode;
  ready?: boolean;
};

// Misma estructura que el prototipo (v3-admin.jsx): General / CRM / Configuración.
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'General',
    items: [
      { href: '/admin', label: 'Dashboard', Icon: NDash, ready: true },
      { href: '/admin/propiedades', label: 'Propiedades', Icon: NHome, ready: true },
      { href: '/admin/propiedades/nueva', label: 'Nueva propiedad', Icon: NPlus, ready: true },
    ],
  },
  {
    label: 'CRM',
    items: [
      { href: '/admin/leads', label: 'Leads', Icon: NTenant, ready: true },
      { href: '/admin/usuarios', label: 'Usuarios', Icon: NUser, ready: true },
      { href: '/admin/scripts', label: 'Scripts', Icon: NScript, ready: true },
    ],
  },
  {
    label: 'Configuración',
    items: [{ href: '/admin/ajustes', label: 'Ajustes', Icon: NCog, ready: true }],
  },
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
    <div className="min-h-screen bg-canvas">
      {/* Sidebar — blanco, igual al prototipo */}
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-line bg-white px-3.5 py-6">
        {/* Logo block: cuadro rojo TAR + título */}
        <div className="mb-3.5 flex items-center gap-2.5 border-b border-line px-3 pb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-brand">
            <span className="font-display text-[13px] font-bold text-white">TAR</span>
          </div>
          <div>
            <div className="font-display text-[15px] font-bold leading-tight text-navy">
              Admin Panel
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-muted">
              Internal · v3
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
                {group.label}
              </div>
              {group.items.map((item) => {
                // "Nueva propiedad" (/admin/propiedades/nueva) es prefijo de
                // "Propiedades" (/admin/propiedades): el item más específico gana,
                // así que sólo se enciende uno.
                const active =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : item.href === '/admin/propiedades'
                      ? pathname === item.href ||
                        (pathname.startsWith('/admin/propiedades/') &&
                          pathname !== '/admin/propiedades/nueva')
                      : pathname.startsWith(item.href);
                if (!item.ready) {
                  return (
                    <div
                      key={item.href}
                      title="Próximamente"
                      className="mb-0.5 flex cursor-not-allowed items-center gap-3 rounded-[10px] border-l-[3px] border-transparent px-3 py-2.5 text-[13px] font-medium text-muted/60"
                    >
                      <item.Icon s={16} />
                      <span className="flex-1">{item.label}</span>
                      <span className="rounded-full bg-line px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
                        Pronto
                      </span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mb-0.5 flex items-center gap-3 rounded-[10px] border-l-[3px] px-3 py-2.5 text-[13px] transition ${
                      active
                        ? 'border-brand bg-brand-soft font-semibold text-brand'
                        : 'border-transparent font-medium text-ink hover:bg-canvas'
                    }`}
                  >
                    <item.Icon s={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Usuario + cerrar sesión */}
        <div className="border-t border-line pt-3">
          <div className="mb-2.5 flex items-center gap-2.5 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft font-display text-[12px] font-bold text-brand">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-navy">{user.name}</p>
              <p className="truncate text-[11px] text-muted">
                {user.role === 'admin' ? 'Administrador' : 'Editor'}
              </p>
            </div>
          </div>
          <button
            onClick={() => void logout().then(() => router.replace('/admin/login'))}
            className="flex w-full items-center gap-2.5 rounded-[10px] border border-line px-3.5 py-2.5 text-[12px] font-medium text-muted transition hover:bg-canvas"
          >
            <NLogout s={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="ml-60">
        <main className="px-9 py-8">{children}</main>
      </div>
    </div>
  );
}
