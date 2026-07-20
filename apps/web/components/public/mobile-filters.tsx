'use client';

import { useState } from 'react';
import { ListingSidebar } from './listing-sidebar';
import type { ListingParams } from './use-listing-params';
import type { Suggestion } from '@/lib/public';

// Panel de filtros colapsable para móvil/tablet (<lg). En escritorio se usa la
// barra lateral sticky directamente.
export function MobileFilters({
  params,
  suggestions,
}: {
  params: ListingParams;
  suggestions: Suggestion[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line bg-white px-[18px] py-2.5 text-sm font-semibold text-navy"
      >
        Filtros
        <span
          className="text-lg leading-none text-[#9CA3AF] transition-transform"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>
      {open && (
        <div className="mt-3.5 rounded-2xl border border-[#F1F1F0] bg-white p-5">
          <ListingSidebar params={params} suggestions={suggestions} />
        </div>
      )}
    </div>
  );
}
