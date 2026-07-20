'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LocationAutocomplete } from './location-autocomplete';
import { ISearch } from './icons';
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

const selectCls =
  'w-full appearance-none rounded-[10px] border border-line bg-white px-3.5 py-3 text-[13px] text-navy outline-none';

// Tarjeta de búsqueda del hero (Home3): operación, tipo, precio, ubicación
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
    <div className="rounded-[18px] bg-white/98 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur sm:p-6">
      <div className="mb-4 font-display text-xl font-bold text-navy">Encuentra el mejor lugar</div>

      <div className="grid grid-cols-1 items-end gap-3.5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_1fr]">
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-muted">Buscando</div>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
            <option value="">Tipo de propiedad</option>
            <option value="departamento">Departamentos</option>
            <option value="oficina">Oficinas</option>
            <option value="local_comercial">Locales comerciales</option>
            <option value="bodega_industrial">Bodegas</option>
            <option value="casa">Casas</option>
          </select>
        </div>
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-muted">Precio</div>
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={selectCls}>
            <option value="">Cualquier precio</option>
            {PRICE_OPTS[op].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-muted">Ubicación</div>
          <LocationAutocomplete
            value={q}
            onChange={setQ}
            onPick={(v) => search(v)}
            suggestions={suggestions}
            className="box-border w-full rounded-[10px] border border-line bg-white py-3 pl-[38px] pr-3.5 text-[13px] text-navy outline-none"
          />
        </div>
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-muted">Recámaras</div>
          <select value={beds} onChange={(e) => setBeds(e.target.value)} className={selectCls}>
            <option value="">Cualquiera</option>
            <option value="1">1+ rec.</option>
            <option value="2">2+ rec.</option>
            <option value="3">3+ rec.</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">Filtros:</span>
          {(['venta', 'renta'] as Operation[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setOp(v);
                setMaxPrice('');
              }}
              className={[
                'rounded-full px-4 py-[7px] text-xs font-medium transition-colors',
                op === v ? 'bg-navy text-white' : 'bg-[#F7F7F6] text-ink',
              ].join(' ')}
            >
              {v === 'venta' ? 'Venta' : 'Renta'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => search()}
          className="flex items-center gap-2 rounded-full bg-navy px-7 py-2.5 text-sm font-semibold text-white"
        >
          Buscar propiedades <ISearch s={14} />
        </button>
      </div>
    </div>
  );
}
