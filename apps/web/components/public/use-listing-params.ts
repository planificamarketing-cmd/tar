'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

// Filtros del listado que viven en la URL (SSR + compartibles + SEO).
export type ListingParams = {
  operation: string; // '' | 'venta' | 'renta'
  type: string; // '' | PropertyType
  maxPrice: string;
  bedrooms: string;
  q: string;
  sort: string; // relevancia | precio_asc | precio_desc | recientes
  view: string; // grid | list
  page: string;
};

export function readParams(sp: URLSearchParams): ListingParams {
  return {
    operation: sp.get('operation') ?? '',
    type: sp.get('type') ?? '',
    maxPrice: sp.get('maxPrice') ?? '',
    bedrooms: sp.get('bedrooms') ?? '',
    q: sp.get('q') ?? '',
    sort: sp.get('sort') ?? 'relevancia',
    view: sp.get('view') ?? 'grid',
    page: sp.get('page') ?? '1',
  };
}

// Actualiza uno o varios parámetros preservando el resto. Cualquier cambio de
// filtro reinicia la paginación (salvo que se pase `page` explícito).
export function useSetParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (patch: Partial<ListingParams>, opts: { keepPage?: boolean } = {}) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === '') sp.delete(k);
        else sp.set(k, String(v));
      }
      if (!opts.keepPage && !('page' in patch)) sp.delete('page');
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );
}
