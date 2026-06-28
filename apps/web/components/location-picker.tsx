'use client';

import { useMemo, useState } from 'react';
import type { PropertyFormValues } from '@/lib/property-form';
import { Combobox } from './combobox';
import { useLocations } from '@/lib/queries';
import { normalizeText } from '@/lib/text';

type Props = {
  value: PropertyFormValues;
  onChange: (patch: Partial<PropertyFormValues>) => void;
};

// Lista de valores únicos por su forma normalizada, conservando la primera grafía
// (canónica) de cada uno.
function uniqueByNorm(values: string[]): string[] {
  const seen = new Map<string, string>();
  for (const v of values) {
    const k = normalizeText(v);
    if (k && !seen.has(k)) seen.set(k, v);
  }
  return [...seen.values()];
}

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
  const { data: locs = [] } = useLocations();

  const hasGeo = value.lat.trim() !== '' && value.lng.trim() !== '';

  // Opciones en cascada: estado → municipios de ese estado → colonias de esa combinación.
  const estadoOpts = useMemo(() => uniqueByNorm(locs.map((l) => l.estado)), [locs]);
  const municipioOpts = useMemo(() => {
    const ne = normalizeText(value.estado);
    return uniqueByNorm(
      locs.filter((l) => !ne || normalizeText(l.estado) === ne).map((l) => l.municipio),
    );
  }, [locs, value.estado]);
  const coloniaOpts = useMemo(() => {
    const ne = normalizeText(value.estado);
    const nm = normalizeText(value.municipio);
    return uniqueByNorm(
      locs
        .filter(
          (l) =>
            (!ne || normalizeText(l.estado) === ne) &&
            (!nm || normalizeText(l.municipio) === nm),
        )
        .map((l) => l.colonia),
    );
  }, [locs, value.estado, value.municipio]);

  // Al cambiar de estado/municipio a uno DISTINTO, limpia los niveles dependientes
  // para no dejar combinaciones inconsistentes (cambiar solo la grafía no limpia).
  function setEstado(estado: string) {
    const changed = normalizeText(estado) !== normalizeText(value.estado);
    onChange(changed ? { estado, municipio: '', colonia: '' } : { estado });
  }
  function setMunicipio(municipio: string) {
    const changed = normalizeText(municipio) !== normalizeText(value.municipio);
    onChange(changed ? { municipio, colonia: '' } : { municipio });
  }

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
          <Combobox
            value={value.estado}
            onChange={setEstado}
            options={estadoOpts}
            placeholder="Ciudad de México"
          />
        </div>
        <div>
          <label className={labelCls}>Municipio / Alcaldía</label>
          <Combobox
            value={value.municipio}
            onChange={setMunicipio}
            options={municipioOpts}
            placeholder="Cuauhtémoc"
          />
        </div>
        <div>
          <label className={labelCls}>Colonia</label>
          <Combobox
            value={value.colonia}
            onChange={(colonia) => onChange({ colonia })}
            options={coloniaOpts}
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
