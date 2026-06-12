'use client';

import { useState } from 'react';
import { USER_ROLES, type UpdateUserInput, type UserRole } from '@tar/shared';
import { useAuth } from '@/lib/auth';
import {
  useCreateUser,
  useDeactivateUser,
  useUpdateUser,
  useUsers,
} from '@/lib/queries';
import { ApiError } from '@/lib/api';
import type { User } from '@/lib/types';
import { formatDate, initials } from '@/lib/format';
import { NPlus } from '@/components/icons';

const PER_PAGE = 20;
const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
};

function RoleBadge({ role }: { role: UserRole }) {
  const isAdmin = role === 'admin';
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={
        isAdmin
          ? { backgroundColor: '#FFF0F2', color: '#D2103E' }
          : { backgroundColor: '#EFF6FF', color: '#2563EB' }
      }
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | 'new' | null>(null);

  const { data, isLoading, isError } = useUsers({
    role: role === 'all' ? undefined : role,
    q: search || undefined,
    page,
    limit: PER_PAGE,
  });
  const deactivate = useDeactivateUser();
  const [actionErr, setActionErr] = useState<string | null>(null);

  const total = data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  async function onDeactivate(u: User) {
    if (!window.confirm(`¿Desactivar a ${u.name}? Se cerrarán sus sesiones.`)) return;
    setActionErr(null);
    try {
      await deactivate.mutateAsync(u.id);
    } catch (e) {
      setActionErr(e instanceof ApiError ? e.message : 'No se pudo desactivar.');
    }
  }

  const tab = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-navy text-white'
        : 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-canvas'
    }`;

  return (
    <div>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-navy">Usuarios</h1>
          <p className="mt-1 text-sm text-muted">
            {total} {total === 1 ? 'operador' : 'operadores'} del panel.
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
        >
          <NPlus s={16} /> Nuevo usuario
        </button>
      </header>

      {/* Filtros por rol + búsqueda */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button className={tab(role === 'all')} onClick={() => { setRole('all'); setPage(1); }}>
          Todos
        </button>
        {USER_ROLES.map((r) => (
          <button
            key={r}
            className={tab(role === r)}
            onClick={() => { setRole(r); setPage(1); }}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1); }}
          className="ml-auto"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="w-64 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand"
          />
        </form>
      </div>

      {actionErr && <p className="mb-3 text-sm text-red-600">{actionErr}</p>}

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {isError ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">
            No se pudieron cargar los usuarios.
          </div>
        ) : isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-muted">Cargando…</div>
        ) : !data?.data.length ? (
          <div className="px-6 py-16 text-center text-sm text-muted">
            No hay usuarios con este filtro.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Usuario</th>
                <th className="px-5 py-3 font-semibold">Rol</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Alta</th>
                <th className="px-5 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.data.map((u) => (
                <tr key={u.id} className="transition hover:bg-canvas/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-[12px] font-bold text-brand">
                        {initials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-navy">
                          {u.name}
                          {u.id === me?.id && (
                            <span className="ml-2 text-[11px] font-normal text-muted">
                              (tú)
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={
                        u.isActive
                          ? { backgroundColor: '#DCFCE7', color: '#16A34A' }
                          : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                      }
                    >
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditing(u)}
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-canvas"
                      >
                        Editar
                      </button>
                      {u.isActive && u.id !== me?.id && (
                        <button
                          disabled={deactivate.isPending}
                          onClick={() => void onDeactivate(u)}
                          className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                        >
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-ink transition enabled:hover:bg-canvas disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-muted">Página {page} de {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-ink transition enabled:hover:bg-canvas disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      {editing && (
        <UserModal
          user={editing === 'new' ? null : editing}
          isSelf={editing !== 'new' && editing.id === me?.id}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  isSelf,
  onClose,
}: {
  user: User | null;
  isSelf: boolean;
  onClose: () => void;
}) {
  const isNew = user === null;
  const create = useCreateUser();
  const update = useUpdateUser();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [roleVal, setRoleVal] = useState<UserRole>(user?.role ?? 'editor');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted';
  const inputCls =
    'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand';
  const pending = create.isPending || update.isPending;

  async function submit() {
    setErr(null);
    try {
      if (isNew) {
        if (password.length < 8) {
          setErr('La contraseña debe tener al menos 8 caracteres.');
          return;
        }
        await create.mutateAsync({ name, email, password, role: roleVal });
      } else {
        const body: UpdateUserInput = { name, role: roleVal, isActive };
        if (password) {
          if (password.length < 8) {
            setErr('La contraseña debe tener al menos 8 caracteres.');
            return;
          }
          body.password = password;
        }
        await update.mutateAsync({ id: user!.id, body });
      }
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'No se pudo guardar.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl text-navy">
          {isNew ? 'Nuevo usuario' : 'Editar usuario'}
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className={labelCls}>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Correo</label>
            <input
              type="email"
              value={email}
              disabled={!isNew}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputCls} disabled:bg-canvas disabled:text-muted`}
            />
            {!isNew && (
              <p className="mt-1 text-[11px] text-muted">El correo no se puede cambiar.</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Rol</label>
            <select
              value={roleVal}
              disabled={isSelf}
              onChange={(e) => setRoleVal(e.target.value as UserRole)}
              className={`${inputCls} disabled:bg-canvas disabled:text-muted`}
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              {isNew ? 'Contraseña' : 'Nueva contraseña (opcional)'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isNew ? '' : 'Dejar en blanco para no cambiarla'}
              className={inputCls}
            />
          </div>
          {!isNew && !isSelf && (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
              />
              Usuario activo
            </label>
          )}
        </div>

        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas"
          >
            Cancelar
          </button>
          <button
            onClick={() => void submit()}
            disabled={pending}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-50"
          >
            {pending ? 'Guardando…' : isNew ? 'Crear usuario' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
