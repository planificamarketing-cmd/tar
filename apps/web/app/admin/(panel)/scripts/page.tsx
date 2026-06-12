'use client';

import { useEffect, useState } from 'react';
import {
  SCRIPT_PLACEMENTS,
  type ScriptPlacement,
} from '@tar/shared';
import {
  useCreateScript,
  useDeleteScript,
  useScripts,
  useUpdateScript,
} from '@/lib/queries';
import { ApiError } from '@/lib/api';
import type { MarketingScript } from '@/lib/types';
import { SCRIPT_PLACEMENT_META } from '@/lib/format';
import { NPlus, NScript } from '@/components/icons';

type Selection = MarketingScript | 'new' | null;

export default function ScriptsPage() {
  const { data: scripts, isLoading, isError } = useScripts();
  const update = useUpdateScript();
  const [selected, setSelected] = useState<Selection>(null);

  const activeCount = scripts?.filter((s) => s.isActive).length ?? 0;

  function placementBadge(p: ScriptPlacement) {
    return (
      <span className="rounded-full bg-canvas px-2 py-0.5 font-mono text-[10px] text-ink ring-1 ring-inset ring-line">
        {SCRIPT_PLACEMENT_META[p].tag}
      </span>
    );
  }

  return (
    <div>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-navy">Scripts de marketing</h1>
          <p className="mt-1 text-sm text-muted">
            Inyecta código de terceros (analytics, píxeles, chats) por ubicación.{' '}
            {scripts?.length ? `${activeCount} activo(s) de ${scripts.length}.` : ''}
          </p>
        </div>
        <button
          onClick={() => setSelected('new')}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
        >
          <NPlus s={16} /> Nuevo script
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Lista */}
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          {isError ? (
            <div className="px-5 py-12 text-center text-sm text-red-600">
              No se pudieron cargar los scripts.
            </div>
          ) : isLoading ? (
            <div className="px-5 py-12 text-center text-sm text-muted">Cargando…</div>
          ) : !scripts?.length ? (
            <div className="px-5 py-12 text-center text-sm text-muted">
              Aún no hay scripts. Crea el primero.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {scripts.map((s) => {
                const isSel = selected !== 'new' && selected?.id === s.id;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setSelected(s)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                        isSel ? 'bg-brand-soft' : 'hover:bg-canvas'
                      }`}
                    >
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: s.isActive ? '#16A34A' : '#D1D5DB' }}
                        title={s.isActive ? 'Activo' : 'Inactivo'}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-navy">
                          {s.name}
                        </span>
                        <span className="mt-1 inline-block">{placementBadge(s.placement)}</span>
                      </span>
                      {/* Toggle rápido */}
                      <span
                        role="switch"
                        aria-checked={s.isActive}
                        onClick={(e) => {
                          e.stopPropagation();
                          void update.mutate({ id: s.id, body: { isActive: !s.isActive } });
                        }}
                        className={`mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition ${
                          s.isActive ? 'bg-green-500' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`h-4 w-4 rounded-full bg-white shadow transition ${
                            s.isActive ? 'translate-x-4' : ''
                          }`}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Editor */}
        <div>
          {selected ? (
            <ScriptEditor
              key={selected === 'new' ? 'new' : selected.id}
              script={selected === 'new' ? null : selected}
              onClose={() => setSelected(null)}
              onSaved={(s) => setSelected(s)}
            />
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 p-10 text-center">
              <span className="text-muted">
                <NScript s={32} />
              </span>
              <p className="mt-3 text-sm text-muted">
                Selecciona un script de la lista o crea uno nuevo para editar su
                código.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScriptEditor({
  script,
  onClose,
  onSaved,
}: {
  script: MarketingScript | null;
  onClose: () => void;
  onSaved: (s: MarketingScript) => void;
}) {
  const isNew = script === null;
  const create = useCreateScript();
  const update = useUpdateScript();
  const del = useDeleteScript();

  const [name, setName] = useState(script?.name ?? '');
  const [placement, setPlacement] = useState<ScriptPlacement>(
    script?.placement ?? 'head',
  );
  const [code, setCode] = useState(script?.code ?? '');
  const [isActive, setIsActive] = useState(script?.isActive ?? false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Limpia el aviso al cambiar de script.
  useEffect(() => setMsg(null), [script?.id]);

  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted';
  const inputCls =
    'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand';
  const pending = create.isPending || update.isPending;

  async function save() {
    setMsg(null);
    if (name.trim().length < 1) return setMsg({ kind: 'err', text: 'Indica un nombre.' });
    if (code.trim().length < 1) return setMsg({ kind: 'err', text: 'El código no puede estar vacío.' });
    try {
      if (isNew) {
        const res = await create.mutateAsync({ name, placement, code, isActive });
        onSaved(res.data);
      } else {
        const res = await update.mutateAsync({
          id: script!.id,
          body: { name, placement, code, isActive },
        });
        onSaved(res.data);
      }
      setMsg({ kind: 'ok', text: 'Guardado.' });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'No se pudo guardar.' });
    }
  }

  async function remove() {
    if (!script) return;
    if (!window.confirm(`¿Eliminar el script «${script.name}»?`)) return;
    try {
      await del.mutateAsync(script.id);
      onClose();
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'No se pudo eliminar.' });
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-navy">
          {isNew ? 'Nuevo script' : 'Editar script'}
        </h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
          />
          Activo
        </label>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelCls}>Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Google Analytics 4"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Ubicación</label>
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as ScriptPlacement)}
            className={inputCls}
          >
            {SCRIPT_PLACEMENTS.map((p) => (
              <option key={p} value={p}>
                {SCRIPT_PLACEMENT_META[p].label} — {SCRIPT_PLACEMENT_META[p].tag}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-muted">
            {SCRIPT_PLACEMENT_META[placement].hint}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className={labelCls}>Código (HTML / JavaScript)</label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder={'<!-- Pega aquí tu código -->\n<script>\n  // …\n</script>'}
          className="w-full rounded-xl border border-line bg-[#0F1B2D] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-[#E6EDF3] outline-none transition focus:border-brand"
        />
        <p className="mt-1.5 text-[11px] text-muted">
          Se inyecta tal cual en el sitio público. Pega solo código de fuentes de
          confianza.
        </p>
      </div>

      {msg && (
        <p className={`mt-3 text-sm ${msg.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <div>
          {!isNew && (
            <button
              onClick={() => void remove()}
              disabled={del.isPending}
              className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              Eliminar
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas"
          >
            Cerrar
          </button>
          <button
            onClick={() => void save()}
            disabled={pending}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-50"
          >
            {pending ? 'Guardando…' : isNew ? 'Crear script' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
