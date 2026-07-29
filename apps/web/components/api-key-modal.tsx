'use client';

import { useState } from 'react';
import { API_KEY_SCOPES, type ApiKeyScope } from '@tar/shared';
import { useCreateApiKey } from '@/lib/queries';
import { ApiError } from '@/lib/api';
import { SCOPE_DESC } from '@/lib/format';
import type { ApiKeyCreated } from '@/lib/types';

const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted';
const inputCls =
  'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand';

export function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const create = useCreateApiKey();
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<ApiKeyScope[]>([]);
  const [created, setCreated] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleScope(s: ApiKeyScope) {
    setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  async function submit() {
    setErr(null);
    if (name.trim().length < 1) return setErr('Indica un nombre.');
    if (!scopes.length) return setErr('Selecciona al menos un permiso.');
    try {
      const res = await create.mutateAsync({ name, scopes });
      setCreated(res.data);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'No se pudo crear la llave.');
    }
  }

  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.key);
      setCopied(true);
    } catch {
      /* el usuario puede copiar manualmente */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {created ? (
          <>
            <h2 className="font-display text-xl text-navy">Llave creada</h2>
            <p className="mt-1 text-sm text-muted">
              Cópiala ahora: por seguridad <strong>no se vuelve a mostrar</strong>.
              Después se guarda cifrada.
            </p>
            <div className="mt-4 rounded-xl border border-line bg-canvas/60 p-3">
              <code className="block break-all font-mono text-sm text-navy">
                {created.key}
              </code>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => void copy()}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                {copied ? '¡Copiada!' : 'Copiar llave'}
              </button>
              <span className="text-xs text-muted">
                Úsala en el header <span className="font-mono">X-API-Key</span>.
              </span>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas"
              >
                Listo
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl text-navy">Nueva llave de API</h2>
            <p className="mt-1 text-sm text-muted">
              Permite a un sistema externo actualizar datos en TAR llamando a{' '}
              <span className="font-mono">POST /webhooks/inbound</span>.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className={labelCls}>Nombre</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Integración CRM"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Permisos (scopes)</label>
                <div className="space-y-1.5">
                  {API_KEY_SCOPES.map((s) => (
                    <label
                      key={s}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-canvas"
                    >
                      <input
                        type="checkbox"
                        checked={scopes.includes(s)}
                        onChange={() => toggleScope(s)}
                        className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand"
                      />
                      <span>
                        <span className="font-mono text-xs text-navy">{s}</span>
                        <span className="ml-2 text-xs text-muted">
                          — {SCOPE_DESC[s]}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
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
                disabled={create.isPending}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-50"
              >
                {create.isPending ? 'Creando…' : 'Crear llave'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
