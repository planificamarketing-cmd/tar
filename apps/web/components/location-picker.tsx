'use client';

import { useMemo, useState } from 'react';
import { parseGoogleMapsUrl, isShortMapsUrl } from '@tar/shared';
import type { PropertyFormValues } from '@/lib/property-form';
import { Combobox } from './combobox';
import { resolveMapsLocation, useLocations } from '@/lib/queries';
import { normalizeText } from '@/lib/text';
import { mapsEnabled } from '@/lib/maps';
import { LocationMapPanel } from './location-map-loader';

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

// LocationPicker — captura estado/municipio/colonia + dirección y fija `geo`.
// Tres formas de poner el punto, de la más cómoda a la de respaldo:
//   1. Mapa interactivo (clic o pin arrastrable) — requiere la API key de Google.
//   2. Pegar un enlace de Google Maps: autocompleta estado/municipio/colonia/
//      dirección/CP + coordenadas (los enlaces cortos se expanden en el servidor).
//   3. Escribir latitud/longitud a mano.
// Sin API key el mapa no se muestra y (2) y (3) siguen operando igual.
export function LocationPicker({ value, onChange }: Props) {
  const [paste, setPaste] = useState('');
  const [pasteMsg, setPasteMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );
  const [pasteBusy, setPasteBusy] = useState(false);
  const { data: locs = [] } = useLocations();

  const hasGeo = value.lat.trim() !== '' && value.lng.trim() !== '';

  // El formulario guarda lat/lng como texto (permite vaciarlos); el mapa necesita
  // números. Un valor a medio escribir ("-99.") se trata como "sin punto".
  const toNum = (s: string): number | null => {
    const n = Number(s.trim());
    return s.trim() !== '' && Number.isFinite(n) ? n : null;
  };
  const latNum = toNum(value.lat);
  const lngNum = toNum(value.lng);

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

  async function applyPaste() {
    const text = paste.trim();
    if (!text) return;
    setPasteBusy(true);
    setPasteMsg(null);
    try {
      // Enlace largo (barra del navegador): trae todo, se parsea en el cliente.
      // Enlace corto (Compartir → copiar vínculo): el servidor lo expande.
      let loc = parseGoogleMapsUrl(text);
      if (isShortMapsUrl(text) || (loc.lat == null && !loc.address)) {
        loc = await resolveMapsLocation(text);
      }

      const patch: Partial<PropertyFormValues> = {};
      if (loc.lat != null) patch.lat = String(loc.lat);
      if (loc.lng != null) patch.lng = String(loc.lng);
      if (loc.estado) patch.estado = loc.estado;
      if (loc.municipio) patch.municipio = loc.municipio;
      if (loc.colonia) patch.colonia = loc.colonia;
      if (loc.address) patch.address = loc.address;
      if (loc.postalCode) patch.postalCode = loc.postalCode;

      if (Object.keys(patch).length === 0) {
        setPasteMsg({ type: 'err', text: 'No se reconoció ubicación en el enlace.' });
        return;
      }
      onChange(patch);
      setPaste('');
      const campos: string[] = [];
      if (patch.lat) campos.push('coordenadas');
      if (patch.estado) campos.push('estado');
      if (patch.municipio) campos.push('municipio');
      if (patch.colonia) campos.push('colonia');
      if (patch.address) campos.push('dirección');
      if (patch.postalCode) campos.push('CP');
      setPasteMsg({ type: 'ok', text: `Autocompletado: ${campos.join(', ')}.` });
    } catch (err) {
      setPasteMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : 'No se pudo leer el enlace. Pega el enlace largo desde el navegador.',
      });
    } finally {
      setPasteBusy(false);
    }
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

        {mapsEnabled && (
          <div className="mt-3">
            <LocationMapPanel
              lat={latNum}
              lng={lngNum}
              onPick={(lat, lng) =>
                onChange({ lat: lat.toFixed(6), lng: lng.toFixed(6) })
              }
            />
            <p className="mt-1.5 text-xs text-muted">
              Haz clic en el mapa o arrastra el pin para ajustar el punto exacto. Las
              coordenadas de abajo se actualizan solas.
            </p>
          </div>
        )}

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
            …o pega un enlace de Google Maps (autocompleta la ubicación)
          </label>
          <div className="flex gap-2">
            <input
              value={paste}
              onChange={(e) => {
                setPaste(e.target.value);
                setPasteMsg(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void applyPaste();
                }
              }}
              className={inputCls}
              placeholder="https://maps.app.goo.gl/… o el enlace largo del navegador"
            />
            <button
              type="button"
              onClick={() => void applyPaste()}
              disabled={pasteBusy}
              className="shrink-0 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-60"
            >
              {pasteBusy ? 'Leyendo…' : 'Autocompletar'}
            </button>
          </div>
          {pasteMsg && (
            <p
              className={`mt-1.5 text-xs ${
                pasteMsg.type === 'ok' ? 'text-green-700' : 'text-red-600'
              }`}
            >
              {pasteMsg.text}
            </p>
          )}
          <p className="mt-1.5 text-xs text-muted">
            Tip: el enlace largo de la barra del navegador trae la dirección completa;
            los enlaces cortos de “Compartir” también funcionan (se resuelven en el
            servidor). Revisa siempre los campos autocompletados.
          </p>
        </div>
      </div>
    </div>
  );
}
