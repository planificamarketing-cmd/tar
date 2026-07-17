'use client';

import { useMemo, useState } from 'react';
import { WEBHOOK_EVENTS } from '@tar/shared';
import {
  testWebhook,
  useApiKeys,
  useDeleteApiKey,
  useDeleteWebhook,
  useRetryDelivery,
  useUpdateWebhook,
  useWebhookDeliveries,
  useWebhookSubscriptions,
  type WebhookTestResult,
} from '@/lib/queries';
import { ApiError } from '@/lib/api';
import type { ApiKey, WebhookSubscription } from '@/lib/types';
import {
  DELIVERY_STATUS_META,
  SCOPE_DESC,
  WEBHOOK_EVENT_DESC,
  formatDateTime,
  timeAgo,
} from '@/lib/format';
import { NPlus } from '@/components/icons';
import { WebhookModal } from '@/components/webhook-modal';
import { WebhookPayloadReference } from '@/components/webhook-payloads';
import { ApiKeyModal } from '@/components/api-key-modal';
import { SegmentsSection } from '@/components/segments-section';

const sectionCls = 'rounded-2xl border border-line bg-white p-6 shadow-sm';
const overline =
  'text-xs font-bold uppercase tracking-[0.12em] text-ink';

function EventChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-canvas px-2 py-0.5 font-mono text-[10px] text-ink ring-1 ring-inset ring-line">
      {children}
    </span>
  );
}

export default function SettingsPage() {
  const subs = useWebhookSubscriptions();
  const deliveries = useWebhookDeliveries();
  const apiKeys = useApiKeys();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const retry = useRetryDelivery();
  const deleteKey = useDeleteApiKey();

  const [webhookModal, setWebhookModal] = useState<WebhookSubscription | 'new' | null>(null);
  const [keyModal, setKeyModal] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Resultado de "Probar" por webhook (id → resultado o 'loading').
  const [tests, setTests] = useState<Record<string, WebhookTestResult | 'loading'>>({});

  async function probe(w: WebhookSubscription) {
    setTests((t) => ({ ...t, [w.id]: 'loading' }));
    try {
      const r = await testWebhook({
        targetUrl: w.targetUrl,
        secret: w.secret,
        event: w.events[0] ?? 'property.published',
      });
      setTests((t) => ({ ...t, [w.id]: r }));
    } catch {
      setTests((t) => ({
        ...t,
        [w.id]: { ok: false, status: 0, error: 'No se pudo enviar' },
      }));
    }
  }

  // Mapa subscriptionId → nombre, para la bitácora.
  const subName = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of subs.data ?? []) m.set(s.id, s.name);
    return m;
  }, [subs.data]);

  async function act(fn: () => Promise<unknown>) {
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'No se pudo completar la acción.');
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-navy sm:text-3xl">Ajustes</h1>
        <p className="mt-1 text-sm text-muted">
          Integraciones de la plataforma con tus herramientas externas.
        </p>
      </header>

      {err && <p className="mb-4 text-sm text-red-600">{err}</p>}

      <section className={sectionCls}>
        <h2 className="font-display text-xl text-navy">Integraciones · Webhooks</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Conecta TAR con tu CRM, Zapier o HubSpot sin intermediarios de pago. Hay
          dos direcciones:
        </p>

        {/* Explicación de las dos direcciones */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <div className="text-sm font-semibold text-navy">
              → Salientes (TAR avisa a terceros)
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Cuando ocurre un evento en TAR (p. ej. entra un lead), la plataforma
              envía un POST a la URL que configures para que tu CRM reaccione.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <div className="text-sm font-semibold text-navy">
              ← Entrantes (terceros actualizan TAR)
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Con una llave de API, un sistema externo puede actualizar datos en
              TAR (p. ej. marcar un lead como cerrado) de forma segura.
            </p>
          </div>
        </div>

        {/* ── Salientes ── */}
        <div className="mt-6 flex items-center justify-between">
          <span className={overline}>Salientes (TAR → terceros)</span>
          <button
            onClick={() => setWebhookModal('new')}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-hover"
          >
            <NPlus s={13} /> Nuevo webhook
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          {subs.isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-muted">Cargando…</div>
          ) : subs.isError ? (
            <div className="px-4 py-10 text-center text-sm text-red-600">
              No se pudieron cargar los webhooks.
            </div>
          ) : !subs.data?.length ? (
            <div className="px-4 py-10 text-center text-sm text-muted">
              Aún no hay webhooks salientes configurados.
            </div>
          ) : (
            subs.data.map((w, i) => (
              <div
                key={w.id}
                className={`flex items-start gap-4 p-4 ${i > 0 ? 'border-t border-line' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-navy">{w.name}</div>
                  <div className="mt-1 truncate font-mono text-[11px] text-muted">
                    {w.targetUrl}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {w.events.map((e) => (
                      <EventChip key={e}>{e}</EventChip>
                    ))}
                  </div>
                  {tests[w.id] && tests[w.id] !== 'loading' && (
                    <p
                      className={`mt-2 text-xs ${
                        (tests[w.id] as WebhookTestResult).ok
                          ? 'text-green-700'
                          : 'text-red-600'
                      }`}
                    >
                      {(tests[w.id] as WebhookTestResult).ok
                        ? `✓ Prueba entregada (HTTP ${(tests[w.id] as WebhookTestResult).status})`
                        : `✗ Falló: ${
                            (tests[w.id] as WebhookTestResult).error ??
                            `HTTP ${(tests[w.id] as WebhookTestResult).status}`
                          }`}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    onClick={() =>
                      void act(() =>
                        updateWebhook.mutateAsync({
                          id: w.id,
                          body: { isActive: !w.isActive },
                        }),
                      )
                    }
                    className="text-xs font-semibold"
                    style={{ color: w.isActive ? '#16A34A' : '#9CA3AF' }}
                    title="Activar / desactivar"
                  >
                    {w.isActive ? '● Activo' : '○ Inactivo'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void probe(w)}
                      disabled={tests[w.id] === 'loading'}
                      className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-canvas disabled:opacity-50"
                      title="Enviar un payload de ejemplo a la URL"
                    >
                      {tests[w.id] === 'loading' ? 'Enviando…' : 'Probar'}
                    </button>
                    <button
                      onClick={() => setWebhookModal(w)}
                      className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-canvas"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar el webhook «${w.name}»?`))
                          void act(() => deleteWebhook.mutateAsync(w.id));
                      }}
                      className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-red-300 hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cómo se entregan */}
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-800">
          <strong>¿Qué pasa al dispararse?</strong> TAR envía un POST firmado con
          HMAC-SHA256 (header <span className="font-mono">X-TAR-Signature</span>)
          para que el receptor verifique el origen. Si el destino no responde, se
          reintenta hasta <strong>5 veces</strong> con espera creciente y queda
          registro de cada intento en la bitácora.
        </div>

        {/* Catálogo de eventos */}
        <div className="mt-6">
          <div className={`${overline} mb-2`}>Eventos disponibles</div>
          <div className="overflow-hidden rounded-xl border border-line">
            {WEBHOOK_EVENTS.map((ev, i) => (
              <div
                key={ev}
                className={`flex flex-wrap items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-line' : ''}`}
              >
                <span className="min-w-[180px] rounded-full bg-canvas px-2.5 py-1 font-mono text-[11px] text-navy ring-1 ring-inset ring-line">
                  {ev}
                </span>
                <span className="text-xs text-muted">{WEBHOOK_EVENT_DESC[ev]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referencia de payloads (qué datos manda cada evento) */}
        <div className="mt-6">
          <div className={`${overline} mb-2`}>Qué datos manda cada aviso (payload)</div>
          <WebhookPayloadReference />
        </div>

        {/* Bitácora de entregas */}
        <div className="mt-6">
          <div className={`${overline} mb-2`}>Bitácora de entregas</div>
          <div className="overflow-hidden rounded-xl border border-line">
            {deliveries.isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-muted">Cargando…</div>
            ) : !deliveries.data?.length ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                Sin entregas registradas todavía.
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line bg-canvas/60 text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Webhook</th>
                    <th className="px-4 py-2.5 font-semibold">Evento</th>
                    <th className="px-4 py-2.5 font-semibold">Estado</th>
                    <th className="px-4 py-2.5 font-semibold">Intentos</th>
                    <th className="px-4 py-2.5 font-semibold">Fecha</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {deliveries.data.slice(0, 30).map((d) => {
                    const meta = DELIVERY_STATUS_META[d.status];
                    return (
                      <tr key={d.id}>
                        <td className="px-4 py-2.5 text-navy">
                          {subName.get(d.subscriptionId) ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-ink">
                          {d.event}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                            title={d.lastError ?? undefined}
                          >
                            {meta.label}
                            {d.responseCode ? ` · ${d.responseCode}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted">{d.attempts}</td>
                        <td className="px-4 py-2.5 text-muted" title={formatDateTime(d.createdAt)}>
                          {timeAgo(d.createdAt)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {d.status === 'fallido' && (
                            <button
                              disabled={retry.isPending}
                              onClick={() => void act(() => retry.mutateAsync(d.id))}
                              className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-canvas disabled:opacity-50"
                            >
                              Reintentar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Entrantes · API keys ── */}
        <div className="mt-8 flex items-center justify-between">
          <span className={overline}>Entrantes · Llaves de API (terceros → TAR)</span>
          <button
            onClick={() => setKeyModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-canvas"
          >
            <NPlus s={13} /> Nueva llave
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          {apiKeys.isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-muted">Cargando…</div>
          ) : !apiKeys.data?.length ? (
            <div className="px-4 py-10 text-center text-sm text-muted">
              Aún no hay llaves de API.
            </div>
          ) : (
            apiKeys.data.map((k: ApiKey, i) => (
              <div
                key={k.id}
                className={`flex items-start gap-4 p-4 ${i > 0 ? 'border-t border-line' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-navy">{k.name}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {k.scopes.map((s) => (
                      <EventChip key={s}>{s}</EventChip>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Puede: {k.scopes.map((s) => SCOPE_DESC[s] ?? s).join(' · ')}.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-[11px] text-muted">
                    {k.lastUsedAt ? `Último uso: ${timeAgo(k.lastUsedAt)}` : 'Sin uso'}
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Revocar la llave «${k.name}»? Dejará de funcionar de inmediato.`))
                        void act(() => deleteKey.mutateAsync(k.id));
                    }}
                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Revocar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          El sistema externo llama a{' '}
          <span className="font-mono">POST /webhooks/inbound</span> con su llave en
          el header <span className="font-mono">X-API-Key</span>. La llave completa
          solo se muestra <strong>una vez</strong>, al crearla; después se guarda
          cifrada.
        </p>
      </section>

      <SegmentsSection />

      {webhookModal && (
        <WebhookModal
          webhook={webhookModal === 'new' ? null : webhookModal}
          onClose={() => setWebhookModal(null)}
        />
      )}
      {keyModal && <ApiKeyModal onClose={() => setKeyModal(false)} />}
    </div>
  );
}
