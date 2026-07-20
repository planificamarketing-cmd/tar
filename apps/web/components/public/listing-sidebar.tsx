'use client';

import { useState } from 'react';
import { LocationAutocomplete } from './location-autocomplete';
import { useSetParams, type ListingParams } from './use-listing-params';
import type { Suggestion } from '@/lib/public';

const OPERATIONS: [string, string][] = [
  ['', 'Todo'],
  ['venta', 'Venta'],
  ['renta', 'Renta'],
];
const TYPES: [string, string][] = [
  ['', 'Todos'],
  ['departamento', 'Depto.'],
  ['oficina', 'Oficina'],
  ['local_comercial', 'Local'],
  ['bodega_industrial', 'Bodega'],
  ['casa', 'Casa'],
  ['edificio', 'Edificio'],
  ['terreno', 'Terreno'],
];
const BEDS: [string, string][] = [
  ['', 'Any'],
  ['1', '1+'],
  ['2', '2+'],
  ['3', '3+'],
];

const PRICE_OPTS = (op: string): [string, string][] =>
  op === 'renta'
    ? [
        ['', 'Sin límite'],
        ['15000', '$15,000/mes'],
        ['30000', '$30,000/mes'],
        ['60000', '$60,000/mes'],
        ['120000', '$120,000/mes'],
      ]
    : [
        ['', 'Sin límite'],
        ['3000000', '$3 MDP'],
        ['6000000', '$6 MDP'],
        ['12000000', '$12 MDP'],
        ['30000000', '$30 MDP'],
      ];

function chip(on: boolean) {
  return [
    'rounded-full border px-3.5 py-[7px] text-xs font-medium transition-colors',
    on ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand/40',
  ].join(' ');
}

// Sidebar de filtros del listado (Filter3), sin mapa. Escribe los filtros en la
// URL (SSR). La ubicación se resuelve por autocompletado de texto (q).
export function ListingSidebar({
  params,
  suggestions,
}: {
  params: ListingParams;
  suggestions: Suggestion[];
}) {
  const setParams = useSetParams();
  const [q, setQ] = useState(params.q);

  const lbl = 'mb-2 block text-[11px] font-semibold text-muted';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className={lbl}>Operación</span>
        <div className="flex flex-wrap gap-1.5">
          {OPERATIONS.map(([v, l]) => (
            <button
              key={v}
              type="button"
              className={chip(params.operation === v)}
              onClick={() => setParams({ operation: v, maxPrice: '' })}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={lbl}>Tipo</span>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map(([v, l]) => (
            <button
              key={v}
              type="button"
              className={chip(params.type === v)}
              onClick={() => setParams({ type: v })}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={lbl}>Precio máximo {params.operation === 'renta' ? '(renta)' : '(venta)'}</span>
        <select
          value={params.maxPrice}
          onChange={(e) => setParams({ maxPrice: e.target.value })}
          className="w-full rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-[13px] text-navy outline-none"
        >
          {PRICE_OPTS(params.operation).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={lbl}>Recámaras mín.</span>
        <div className="flex gap-1.5">
          {BEDS.map(([v, l]) => (
            <button
              key={v}
              type="button"
              className={chip(params.bedrooms === v)}
              onClick={() => setParams({ bedrooms: v })}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={lbl}>Ubicación / búsqueda</span>
        <LocationAutocomplete
          value={q}
          onChange={setQ}
          onPick={(v) => setParams({ q: v })}
          suggestions={suggestions}
          className="box-border w-full rounded-[10px] border border-line bg-white py-2.5 pl-9 pr-3.5 text-[13px] text-navy outline-none"
        />
      </div>

      <button
        type="button"
        onClick={() => {
          setQ('');
          setParams({ operation: '', type: '', maxPrice: '', bedrooms: '', q: '' });
        }}
        className="rounded-[10px] border border-line py-2.5 text-xs font-medium text-muted hover:text-navy"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
