'use client';

import { useState } from 'react';
import { WEBHOOK_EVENTS, type WebhookEvent } from '@tar/shared';
import {
  testWebhook,
  useCreateWebhook,
  useUpdateWebhook,
  type WebhookTestResult,
} from '@/lib/queries';
import { ApiError } from '@/lib/api';
import type { WebhookSubscription } from '@/lib/types';

const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted';
const inputCls =
  'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand';

export function WebhookModal({
  webhook,
  onClose,
}: {
  webhook: WebhookSubscription | null;
  onClose: () => void;
}) {
  const isNew = webhook === null;
  const create = useCreateWebhook();
  const update = useUpdateWebhook();

  const [name, setName] = useState(webhook?.name ?? '');
  const [targetUrl, setTargetUrl] = useState(webhook?.targetUrl ?? '');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>(webhook?.events ?? []);
  const [isActive, setIsActive] = useState(webhook?.isActive ?? true);
  const [err, setErr] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const pending = create.isPending || update.isPending;

  function toggleEvent(e: WebhookEvent) {
    setEvents((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));
  }

  async function sendTest() {
    setErr(null);
    setTestResult(null);
    try {
      new URL(targetUrl);
    } catch {
      return setErr('Escribe una URL de destino válida para probar.');
    }
    // Al editar, el campo secreto puede ir en blanco (no se cambia): se usa el guardado.
    const effectiveSecret = secret || webhook?.secret || '';
    if (effectiveSecret.length < 1)
      return setErr('Indica el secreto de firma para enviar la prueba.');
    setTesting(true);
    try {
      const r = await testWebhook({
        targetUrl,
        secret: effectiveSecret,
        event: events[0] ?? 'property.published',
      });
      setTestResult(r);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'No se pudo enviar la prueba.');
    } finally {
      setTesting(false);
    }
  }

  async function submit() {
    setErr(null);
    if (name.trim().length < 1) return setErr('Indica un nombre.');
    try {
      new URL(targetUrl);
    } catch {
      return setErr('La URL de destino no es válida.');
    }
    if (!events.length) return setErr('Selecciona al menos un evento.');
    if (isNew && secret.length < 8)
      return setErr('El secreto debe tener al menos 8 caracteres.');
    if (!isNew && secret && secret.length < 8)
      return setErr('El secreto debe tener al menos 8 caracteres.');

    try {
      if (isNew) {
        await create.mutateAsync({ name, targetUrl, secret, events, isActive });
      } else {
        await update.mutateAsync({
          id: webhook!.id,
          body: { name, targetUrl, events, isActive, ...(secret ? { secret } : {}) },
        });
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl text-navy">
          {isNew ? 'Nuevo webhook saliente' : 'Editar webhook'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          TAR enviará un POST firmado (HMAC-SHA256) a la URL cuando ocurra alguno
          de los eventos seleccionados.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className={labelCls}>Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="HubSpot — Leads"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>URL de destino</label>
            <input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://api.tu-crm.com/webhooks/ingest"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              {isNew ? 'Secreto de firma' : 'Secreto (dejar en blanco para no cambiarlo)'}
            </label>
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-muted">
              Se usa para firmar el header <span className="font-mono">X-TAR-Signature</span>; compártelo con el receptor.
            </p>
          </div>
          <div>
            <label className={labelCls}>Eventos que lo disparan</label>
            <div className="space-y-1.5">
              {WEBHOOK_EVENTS.map((e) => (
                <label
                  key={e}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-canvas"
                >
                  <input
                    type="checkbox"
                    checked={events.includes(e)}
                    onChange={() => toggleEvent(e)}
                    className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                  />
                  <span className="font-mono text-xs text-navy">{e}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
            />
            Activo
          </label>
        </div>

        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

        {testResult && (
          <div
            className={`mt-4 rounded-xl border px-3 py-2.5 text-sm ${
              testResult.ok
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {testResult.ok
              ? `✓ El destino respondió correctamente (HTTP ${testResult.status}). El envío de prueba llegó.`
              : `✗ No se pudo entregar: ${
                  testResult.error ?? `HTTP ${testResult.status}`
                }. Revisa que la URL esté activa y acepte POST.`}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => void sendTest()}
            disabled={testing}
            className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-50"
            title="Envía un payload de ejemplo a la URL, sin guardar"
          >
            {testing ? 'Enviando…' : 'Enviar prueba'}
          </button>
          <div className="flex gap-3">
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
              {pending ? 'Guardando…' : isNew ? 'Crear webhook' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
