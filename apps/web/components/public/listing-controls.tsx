'use client';

import { useSetParams, type ListingParams } from './use-listing-params';
import { IGrid, IList } from './icons';

const SORTS: [string, string][] = [
  ['relevancia', 'Relevancia'],
  ['recientes', 'Más recientes'],
  ['precio_asc', 'Precio ↑'],
  ['precio_desc', 'Precio ↓'],
];

// Orden + alternar vista grid/lista del listado (escriben en la URL).
export function ListingControls({ params }: { params: ListingParams }) {
  const setParams = useSetParams();
  return (
    <div className="flex items-center gap-2">
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
      <div className="flex items-center gap-0.5 rounded-full border border-line p-[3px]">
        {([['grid', IGrid], ['list', IList]] as const).map(([v, Ic]) => (
          <button
            key={v}
            type="button"
            aria-label={v === 'grid' ? 'Vista de cuadrícula' : 'Vista de lista'}
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
