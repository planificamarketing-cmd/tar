'use client';

import { useState } from 'react';
import type { PropertyFormValues } from '@/lib/property-form';

type Props = {
  value: PropertyFormValues;
  onChange: (patch: Partial<PropertyFormValues>) => void;
};

const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted';
const inputCls =
  'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand';

// Extrae lat,lng de un enlace de Google Maps (.../@19.42,-99.16,... o ?q=lat,lng).
function parseCoords(text: string): { lat: number; lng: number } | null {
  const t = text.trim();
  const at = t.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const q = t.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  const m = at ?? q;
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

// LocationPicker — versión sin Google Maps (API key pendiente del cliente).
// Captura estado/municipio/colonia + dirección y fija el punto por coordenadas
// (manual o pegando un enlace de Google Maps). Al integrar la API key, este
// componente se reemplaza por un mapa con pin arrastrable sin tocar el formulario.
export function LocationPicker({ value, onChange }: Props) {
  const [paste, setPaste] = useState('');
  const [pasteErr, setPasteErr] = useState(false);

  const hasGeo = value.lat.trim() !== '' && value.lng.trim() !== '';

  function applyPaste() {
    const c = parseCoords(paste);
    if (!c) {
      setPasteErr(true);
      return;
    }
    setPasteErr(false);
    setPaste('');
    onChange({ lat: String(c.lat), lng: String(c.lng) });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className={labelCls}>Estado</label>
          <input
            value={value.estado}
            onChange={(e) => onChange({ estado: e.target.value })}
            className={inputCls}
            placeholder="Ciudad de México"
          />
        </div>
        <div>
          <label className={labelCls}>Municipio / Alcaldía</label>
          <input
            value={value.municipio}
            onChange={(e) => onChange({ municipio: e.target.value })}
            className={inputCls}
            placeholder="Cuauhtémoc"
          />
        </div>
        <div>
          <label className={labelCls}>Colonia</label>
          <input
            value={value.colonia}
            onChange={(e) => onChange({ colonia: e.target.value })}
            className={inputCls}
            placeholder="Roma Norte"
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Dirección</label>
          <input
            value={value.address}
            onChange={(e) => onChange({ address: e.target.value })}
            className={inputCls}
            placeholder="Calle y número"
          />
        </div>
        <div>
          <label className={labelCls}>Código postal</label>
          <input
            value={value.postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value })}
            className={inputCls}
            placeholder="06700"
          />
        </div>
      </div>

      {/* Punto en el mapa (coordenadas) */}
      <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy">Punto en el mapa</p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              hasGeo
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {hasGeo ? 'Ubicado' : 'Sin ubicar — requerido para publicar'}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>Latitud</label>
            <input
              type="number"
              value={value.lat}
              onChange={(e) => onChange({ lat: e.target.value })}
              className={inputCls}
              placeholder="19.4201"
            />
          </div>
          <div>
            <label className={labelCls}>Longitud</label>
            <input
              type="number"
              value={value.lng}
              onChange={(e) => onChange({ lng: e.target.value })}
              className={inputCls}
              placeholder="-99.1650"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className={labelCls}>
            …o pega un enlace de Google Maps
          </label>
          <div className="flex gap-2">
            <input
              value={paste}
              onChange={(e) => {
                setPaste(e.target.value);
                setPasteErr(false);
              }}
              className={inputCls}
              placeholder="https://maps.google.com/…@19.42,-99.16…"
            />
            <button
              type="button"
              onClick={applyPaste}
              className="shrink-0 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
            >
              Fijar
            </button>
          </div>
          {pasteErr && (
            <p className="mt-1.5 text-xs text-red-600">
              No se reconocieron coordenadas en el texto.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
