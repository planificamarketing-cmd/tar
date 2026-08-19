'use client';

import { useSetParams, type ListingParams } from './use-listing-params';
import { IGrid, IList } from './icons';

const SORTS: [string, string][] = [
  ['relevancia', 'Relevancia'],
  ['recientes', 'Más recientes'],
  ['precio_asc', 'Precio ↑'],
  ['precio_desc', 'Precio ↓'],
];

// El mapa vive en su propia página (/mapa), no como vista del listado.
const VIEWS = [
  ['grid', IGrid, 'Vista de cuadrícula'],
  ['list', IList, 'Vista de lista'],
] as const;

// Orden + alternar vista cuadrícula/lista/mapa del listado (escriben en la URL).
export function ListingControls({ params }: { params: ListingParams }) {
  const setParams = useSetParams();
  return (
    <div className="flex items-center gap-2">
      {/* El orden no aplica al mapa (muestra todos los pines del área visible). */}
      {params.view !== 'map' && (
        <select
          value={params.sort}
          onChange={(e) => setParams({ sort: e.target.value }, { keepPage: true })}
          className="rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-medium text-ink outline-none"
        >
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      )}
      <div className="flex items-center gap-0.5 rounded-full border border-line p-[3px]">
        {VIEWS.map(([v, Ic, label]) => (
          <button
            key={v}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={params.view === v}
            onClick={() => setParams({ view: v }, { keepPage: true })}
            className={[
              'rounded-full px-3 py-1.5',
              params.view === v ? 'bg-navy text-white' : 'text-[#9CA3AF]',
            ].join(' ')}
          >
            <Ic s={14} />
          </button>
        ))}
      </div>
    </div>
  );
}
