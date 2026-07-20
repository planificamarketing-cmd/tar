'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createLeadSchema } from '@tar/shared';
import { apiFetch, ApiError } from '@/lib/api';
import { ICheck, IMail } from './icons';

// Formulario de contacto público (ContactForm3). Emite un lead vía POST /leads
// con consentimiento LFPDPPP (obligatorio) + honeypot anti-spam. El cliente
// decidió que el lead público entra SOLO como contacto (sin pestaña de cita);
// el asesor agenda después. `property` opcional (ficha o página de contacto).

const CODES = ['+52', '+1', '+57', '+34', '+54', '+56'];

export function LeadForm({
  propertyId,
  propertyTitle,
  operation,
  title = 'Contacta al anunciante',
}: {
  propertyId?: string;
  propertyTitle?: string;
  operation?: 'venta' | 'renta';
  title?: string;
}) {
  const defaultMsg = propertyTitle
    ? `¡Hola! Quiero que se comuniquen conmigo por este inmueble en ${
        operation === 'renta' ? 'renta' : 'venta'
      } que vi en TAR Internacional: "${propertyTitle}".`
    : '¡Hola! Estoy interesado en alguna de sus propiedades.';

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: defaultMsg });
  const [code, setCode] = useState('+52');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Captura parámetros UTM de la URL (atribución de campañas de marketing).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const u: Record<string, string> = {};
    for (const [k, v] of sp.entries()) if (k.startsWith('utm_') && v) u[k] = v;
    if (Object.keys(u).length) setUtm(u);
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(null);
    if (!consent) {
      setError('Debes aceptar el aviso de privacidad para enviar tu solicitud.');
      return;
    }
    const phone = form.phone.trim() ? `${code} ${form.phone.trim()}` : undefined;
    const payload = {
      ...(propertyId ? { propertyId } : {}),
      name: form.name,
      email: form.email,
      ...(phone ? { phone } : {}),
      message: form.message,
      type: 'contacto' as const,
      source: propertyTitle ? `ficha: ${propertyTitle}`.slice(0, 255) : 'sitio público',
      ...(Object.keys(utm).length ? { utm } : {}),
      consent: true as const,
      website,
    };

    // Validación en cliente con el MISMO esquema Zod del backend.
    const parsed = createLeadSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(
        first?.path.includes('email')
          ? 'Revisa el correo electrónico.'
          : first?.path.includes('name')
            ? 'Escribe tu nombre (mínimo 2 caracteres).'
            : 'Revisa los datos del formulario.',
      );
      return;
    }

    setSending(true);
    try {
      await apiFetch('/leads', {
        method: 'POST',
        auth: false,
        body: JSON.stringify(parsed.data),
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Has enviado varias solicitudes. Espera unos minutos e inténtalo de nuevo.');
      } else {
        setError('No se pudo enviar tu solicitud. Inténtalo de nuevo en un momento.');
      }
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-[14px] border border-line bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#16A34A] bg-[#DCFCE7] text-[#16A34A]">
          <ICheck s={28} />
        </div>
        <div className="mb-2 font-display text-[22px] font-bold text-navy">¡Mensaje enviado!</div>
        <p className="text-sm leading-relaxed text-muted">
          Un asesor de TAR Internacional se pondrá en contacto contigo en menos de 2 horas hábiles.
        </p>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-[10px] border border-[#D1D5DB] bg-white px-3.5 py-3 text-sm text-navy outline-none focus:border-navy';

  return (
    <div className="rounded-[14px] border border-line bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="mb-4 font-display text-[22px] font-bold tracking-[-0.3px] text-navy">{title}</div>

      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <input className={inputCls} placeholder="Nombre" value={form.name} onChange={set('name')} />
          <input
            className={inputCls}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={set('email')}
          />
        </div>

        <div className="grid grid-cols-[92px_1fr] gap-2.5">
          <select
            className="rounded-[10px] border border-[#D1D5DB] bg-white px-2 py-3 text-sm text-navy outline-none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Código de país"
          >
            {CODES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            placeholder="Teléfono (opcional)"
            type="tel"
            value={form.phone}
            onChange={set('phone')}
          />
        </div>

        <textarea className={`${inputCls} resize-y`} rows={3} value={form.message} onChange={set('message')} />

        {/* Honeypot: oculto para humanos, cebo para bots. Debe llegar vacío. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        <label className="mt-1 flex cursor-pointer items-start gap-2.5 text-[12px] leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
          />
          <span>
            He leído y acepto el{' '}
            <Link href="/aviso-privacidad" className="font-medium text-navy underline" target="_blank">
              Aviso de Privacidad
            </Link>{' '}
            y autorizo el tratamiento de mis datos (LFPDPPP).
          </span>
        </label>

        {error && <div className="rounded-lg bg-brand-soft px-3.5 py-2.5 text-[13px] text-brand">{error}</div>}

        <button
          type="button"
          onClick={submit}
          disabled={sending}
          className="mt-1.5 flex items-center justify-center gap-2 rounded-[10px] bg-brand py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {sending ? 'Enviando…' : 'Enviar solicitud'} <IMail s={16} />
        </button>
      </div>
    </div>
  );
}
