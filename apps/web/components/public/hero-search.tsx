'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LocationAutocomplete } from './location-autocomplete';
import { ISearch, IChevD, IBed, ITag } from './icons';
import type { Operation, Suggestion } from '@/lib/public';

const PRICE_OPTS: Record<Operation, [string, string][]> = {
  renta: [
    ['15000', 'Hasta $15,000/mes'],
    ['30000', 'Hasta $30,000/mes'],
    ['60000', 'Hasta $60,000/mes'],
    ['120000', 'Hasta $120,000/mes'],
  ],
  venta: [
    ['3000000', 'Hasta $3 MDP'],
    ['6000000', 'Hasta $6 MDP'],
    ['12000000', 'Hasta $12 MDP'],
    ['30000000', 'Hasta $30 MDP'],
  ],
};

// Tipos alineados con el listado (mismos 8 valores) para congruencia de filtros.
const TYPE_OPTS: [string, string][] = [
  ['departamento', 'Departamentos'],
  ['casa', 'Casas'],
  ['oficina', 'Oficinas'],
  ['local_comercial', 'Locales comerciales'],
  ['bodega_industrial', 'Bodegas'],
  ['edificio', 'Edificios'],
  ['terreno', 'Terrenos'],
];

// Select con ícono a la izquierda y chevron a la derecha (más vistoso y claro).
function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand">
            {icon}
          </span>
        )}
        {children}
      </div>
    </label>
  );
}

const selectCls =
  'w-full appearance-none rounded-xl border border-line bg-white py-3 pl-[38px] pr-9 text-sm font-medium text-navy outline-none transition-colors hover:border-navy/30 focus:border-brand focus:ring-2 focus:ring-brand/15';

function Chevron() {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
      <IChevD s={16} />
    </span>
  );
}

// Tarjeta de búsqueda del hero: operación (segmentado), tipo, precio, ubicación
// (autocompletado) y recámaras → navega a /propiedades con los filtros.
export function HeroSearch({ suggestions }: { suggestions: Suggestion[] }) {
  const router = useRouter();
  const [op, setOp] = useState<Operation>('venta');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [beds, setBeds] = useState('');

  const search = (extraQ?: string) => {
    const sp = new URLSearchParams();
    sp.set('operation', op);
    if (type) sp.set('type', type);
    if (maxPrice) sp.set('maxPrice', maxPrice);
    const query = extraQ ?? q;
    if (query) sp.set('q', query);
    if (beds) sp.set('bedrooms', beds);
    router.push(`/propiedades?${sp.toString()}`);
  };

  return (
    <div className="rounded-2xl bg-white/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur sm:p-6">
      {/* Encabezado + toggle de operación (segmentado, claro) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="font-display text-xl font-bold text-navy">
          Encuentra tu próximo espacio
        </div>
        <div className="inline-flex rounded-full bg-[#F1F1EF] p-1">
          {(['venta', 'renta'] as Operation[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={op === v}
              onClick={() => {
                setOp(v);
                setMaxPrice('');
              }}
              className={[
                'rounded-full px-5 py-2 text-sm font-semibold transition-colors',
                op === v ? 'bg-navy text-white shadow-sm' : 'text-ink hover:text-navy',
              ].join(' ')}
            >
              {v === 'venta' ? 'Comprar' : 'Rentar'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-end gap-3.5 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1.4fr_0.9fr]">
        <Field label="Tipo de propiedad" icon={<ITag s={16} />}>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
            <option value="">Cualquier tipo</option>
            {TYPE_OPTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <Chevron />
        </Field>

        <Field label={op === 'renta' ? 'Renta máxima' : 'Presupuesto'} icon={<span className="text-sm font-bold">$</span>}>
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={selectCls}>
            <option value="">Cualquier precio</option>
            {PRICE_OPTS[op].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <Chevron />
        </Field>

        <Field label="¿Dónde buscas?">
          <LocationAutocomplete
            value={q}
            onChange={setQ}
            onPick={(v) => search(v)}
            suggestions={suggestions}
            placeholder="Colonia, alcaldía o zona…"
            className="box-border w-full rounded-xl border border-line bg-white py-3 pl-[38px] pr-3.5 text-sm font-medium text-navy outline-none transition-colors hover:border-navy/30 focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </Field>

        <Field label="Recámaras" icon={<IBed s={16} />}>
          <select value={beds} onChange={(e) => setBeds(e.target.value)} className={selectCls}>
            <option value="">Cualquiera</option>
            <option value="1">1 o más</option>
            <option value="2">2 o más</option>
            <option value="3">3 o más</option>
          </select>
          <Chevron />
        </Field>
      </div>

      <button
        type="button"
        onClick={() => search()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        <ISearch s={16} /> Buscar propiedades
      </button>
    </div>
  );
}
