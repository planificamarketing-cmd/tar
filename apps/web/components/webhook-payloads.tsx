'use client';

import { useState } from 'react';
import { WEBHOOK_EVENT_DESC } from '@/lib/format';

// Referencia de los cuerpos (payloads) que TAR envía por cada evento, para tenerla
// a la mano en el panel. Los ejemplos reflejan la forma real que produce la API.
const ENVELOPE_NOTE =
  'Cada aviso es un POST con cabeceras Content-Type: application/json, X-TAR-Event (nombre del evento) y X-TAR-Signature (firma HMAC-SHA256 del cuerpo con tu secreto). El cuerpo tiene esta forma: { "event", "data", "timestamp" } — abajo se muestra el "data" de cada evento.';

const EXAMPLES: Record<string, unknown> = {
  'property.published': {
    id: '7f3c…',
    slug: 'casa-en-polanco',
    url: 'https://tu-sitio.com/propiedades/casa-en-polanco',
    title: 'Casa en Polanco',
    description: 'Amplia casa con jardín…',
    propertyType: 'casa',
    status: 'disponible',
    featured: 'premium',
    price: { sale: 8500000, saleCurrency: 'MXN', rent: null, rentCurrency: null },
    bedrooms: 3,
    bathrooms: 2,
    halfBathrooms: 1,
    parking: 2,
    areaM2: 220,
    lotM2: 300,
    address: 'Calle Ejemplo 123',
    postalCode: '11560',
    location: { estado: 'Ciudad de México', municipio: 'Miguel Hidalgo', colonia: 'Polanco' },
    lat: 19.4326,
    lng: -99.1932,
    cover: 'https://tu-sitio.com/media/…/portada.webp',
    images: ['https://tu-sitio.com/media/…/1.webp', 'https://tu-sitio.com/media/…/2.webp'],
    amenities: ['Alberca', 'Seguridad 24h'],
  },
  'property.status_changed': { id: '7f3c…', from: 'disponible', to: 'apartado' },
  'lead.created': {
    id: '2a9b…',
    name: 'María López',
    email: 'maria@example.com',
    type: 'cita',
    propertyId: '7f3c…',
  },
  'lead.status_changed': { id: '2a9b…', from: 'nuevo', to: 'cita_agendada' },
};

function PayloadBlock({ event }: { event: string }) {
  const [copied, setCopied] = useState(false);
  const body = {
    event,
    data: EXAMPLES[event],
    timestamp: '2026-07-07T05:14:54.908Z',
  };
  const json = JSON.stringify(body, null, 2);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  }

  return (
    <details className="rounded-xl border border-line bg-canvas/40">
      <summary className="cursor-pointer list-none px-4 py-2.5 text-sm">
        <span className="font-mono font-semibold text-navy">{event}</span>
        <span className="ml-2 text-muted">
          — {WEBHOOK_EVENT_DESC[event as keyof typeof WEBHOOK_EVENT_DESC] ?? ''}
        </span>
      </summary>
      <div className="relative border-t border-line">
        <button
          onClick={() => void copy()}
          className="absolute right-2 top-2 rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-medium text-ink transition hover:bg-canvas"
        >
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
        <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-ink">
          <code>{json}</code>
        </pre>
      </div>
    </details>
  );
}

export function WebhookPayloadReference() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{ENVELOPE_NOTE}</p>
      <div className="space-y-2">
        {Object.keys(EXAMPLES).map((e) => (
          <PayloadBlock key={e} event={e} />
        ))}
      </div>
      <p className="text-xs text-muted">
        Nota: <span className="font-mono">property.published</span> incluye los datos
        completos (fotos, descripción, precio, amenidades). Para los demás eventos,
        puedes obtener el detalle completo con una llamada pública (sin login) a{' '}
        <span className="font-mono">/api/v1/properties/&#123;slug&#125;</span>.
      </p>
    </div>
  );
}
