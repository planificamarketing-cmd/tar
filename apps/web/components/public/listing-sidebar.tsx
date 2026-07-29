'use client';

import { useState } from 'react';
import { LocationAutocomplete } from './location-autocomplete';
import { useSetParams, type ListingParams } from './use-listing-params';
import { IChevD, IBed, IBath, ICar, IRuler, ITag } from './icons';
import type { Suggestion } from '@/lib/public';

const OPERATIONS: [string, string][] = [
  ['', 'Todo'],
  ['venta', 'Venta'],
  ['renta', 'Renta'],
];
const TYPES: [string, string][] = [
  ['', 'Todos'],
  ['departamento', 'Depto.'],
  ['casa', 'Casa'],
  ['oficina', 'Oficina'],
  ['local_comercial', 'Local'],
  ['bodega_industrial', 'Bodega'],
  ['edificio', 'Edificio'],
  ['terreno', 'Terreno'],
];
const COUNTS: [string, string][] = [
  ['', 'Indif.'],
  ['1', '1+'],
  ['2', '2+'],
  ['3', '3+'],
  ['4', '4+'],
];

const MAXPRICE_OPTS = (op: string): [string, string][] =>
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

const MINPRICE_OPTS = (op: string): [string, string][] =>
  op === 'renta'
    ? [
        ['', 'Desde $0'],
        ['10000', 'Desde $10,000/mes'],
        ['20000', 'Desde $20,000/mes'],
        ['40000', 'Desde $40,000/mes'],
      ]
    : [
        ['', 'Desde $0'],
        ['1000000', 'Desde $1 MDP'],
        ['3000000', 'Desde $3 MDP'],
        ['6000000', 'Desde $6 MDP'],
      ];

function chip(on: boolean) {
  return [
    'rounded-full border px-3.5 py-[7px] text-xs font-medium transition-colors',
    on ? 'border-brand bg-brand text-white shadow-sm' : 'border-line bg-white text-ink hover:border-brand/50',
  ].join(' ');
}

const selectCls =
  'w-full appearance-none rounded-[10px] border border-line bg-white px-3.5 py-2.5 pr-9 text-[13px] text-navy outline-none transition-colors hover:border-navy/30 focus:border-brand focus:ring-2 focus:ring-brand/15';

// Envuelve un select con su chevron a la derecha.
function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
        <IChevD s={15} />
      </span>
    </div>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {icon && <span className="text-brand">{icon}</span>}
        {label}
      </span>
      {children}
    </div>
  );
}

// Sidebar de filtros del listado, sin mapa. Escribe los filtros en la URL (SSR).
// Básicos siempre visibles; avanzados en una sección plegable.
export function ListingSidebar({
  params,
  suggestions,
}: {
  params: ListingParams;
  suggestions: Suggestion[];
}) {
  const setParams = useSetParams();
  const [q, setQ] = useState(params.q);

  const advActive =
    !!params.minPrice ||
    !!params.bathrooms ||
    !!params.parking ||
    !!params.minArea ||
    !!params.maxArea;
  const [open, setOpen] = useState(advActive);

  return (
    <div className="flex flex-col gap-5">
      <Section label="Operación">
        <div className="flex flex-wrap gap-1.5">
          {OPERATIONS.map(([v, l]) => (
            <button
              key={v}
              type="button"
              className={chip(params.operation === v)}
              onClick={() => setParams({ operation: v, maxPrice: '', minPrice: '' })}
            >
              {l}
            </button>
          ))}
        </div>
      </Section>

      <Section icon={<ITag s={13} />} label="Tipo de propiedad">
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
      </Section>

      <Section label={`Precio máximo ${params.operation === 'renta' ? '(renta)' : '(venta)'}`}>
        <Select
          value={params.maxPrice}
          onChange={(v) => setParams({ maxPrice: v })}
          options={MAXPRICE_OPTS(params.operation)}
        />
      </Section>

      <Section icon={<IBed s={13} />} label="Recámaras (mín.)">
        <div className="flex gap-1.5">
          {COUNTS.slice(0, 4).map(([v, l]) => (
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
      </Section>

      <Section label="Ubicación / búsqueda">
        <LocationAutocomplete
          value={q}
          onChange={setQ}
          onPick={(v) => setParams({ q: v })}
          suggestions={suggestions}
          className="box-border w-full rounded-[10px] border border-line bg-white py-2.5 pl-9 pr-3.5 text-[13px] text-navy outline-none transition-colors hover:border-navy/30 focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </Section>

      {/* ── Filtros avanzados (plegable) ── */}
      <div className="border-t border-line pt-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between text-[12px] font-semibold text-navy"
          aria-expanded={open}
        >
          <span className="flex items-center gap-1.5">
            Filtros avanzados
            {advActive && (
              <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">
                activos
              </span>
            )}
          </span>
          <span className={['text-muted transition-transform', open ? 'rotate-180' : ''].join(' ')}>
            <IChevD s={16} />
          </span>
        </button>

        {open && (
          <div className="mt-4 flex flex-col gap-5">
            <Section label={`Precio mínimo ${params.operation === 'renta' ? '(renta)' : '(venta)'}`}>
              <Select
                value={params.minPrice}
                onChange={(v) => setParams({ minPrice: v })}
                options={MINPRICE_OPTS(params.operation)}
              />
            </Section>

            <Section icon={<IBath s={13} />} label="Baños (mín.)">
              <div className="flex gap-1.5">
                {COUNTS.map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    className={chip(params.bathrooms === v)}
                    onClick={() => setParams({ bathrooms: v })}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Section>

            <Section icon={<ICar s={13} />} label="Estacionamientos (mín.)">
              <div className="flex gap-1.5">
                {COUNTS.map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    className={chip(params.parking === v)}
                    onClick={() => setParams({ parking: v })}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Section>

            <Section icon={<IRuler s={13} />} label="Superficie (m²)">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Mín."
                  defaultValue={params.minArea}
                  onBlur={(e) => setParams({ minArea: e.target.value })}
                  className="w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-[13px] text-navy outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
                <span className="text-muted">–</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Máx."
                  defaultValue={params.maxArea}
                  onBlur={(e) => setParams({ maxArea: e.target.value })}
                  className="w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-[13px] text-navy outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>
            </Section>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setQ('');
          setParams({
            operation: '',
            type: '',
            minPrice: '',
            maxPrice: '',
            bedrooms: '',
            bathrooms: '',
            parking: '',
            minArea: '',
            maxArea: '',
            q: '',
          });
        }}
        className="rounded-[10px] border border-line py-2.5 text-xs font-medium text-muted transition-colors hover:border-navy/30 hover:text-navy"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
