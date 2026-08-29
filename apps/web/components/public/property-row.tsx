import Image from 'next/image';
import Link from 'next/link';
import type { PropertyListItem } from '@/lib/types';
import { TYPE_LABEL_SINGULAR, locationLabel, primaryOperation, propertyPrice } from '@/lib/public';
import { IBed, IBath, IRuler, IPin } from './icons';

// Fila del listado en vista "lista" (Listings3, view=list): foto + datos en
// horizontal. Server component.
export function PropertyRow({ p }: { p: PropertyListItem }) {
  const operation = primaryOperation(p);
  const area = Number(p.areaM2 ?? 0);

  return (
    <Link
      href={`/propiedades/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-[14px] border border-[#F1F1F0] bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:flex-row"
    >
      <div className="relative h-[180px] w-full shrink-0 overflow-hidden bg-navy sm:w-[260px]">
        {p.cover?.urlWebp ? (
          <Image
            src={p.cover.urlWebp}
            alt={p.title}
            fill
            sizes="(max-width: 640px) 100vw, 260px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_14px,rgba(255,255,255,0.04)_14px,rgba(255,255,255,0.04)_28px)]" />
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-navy">
            {operation === 'venta' ? 'En venta' : 'En renta'}
          </span>
          {p.isExclusive && (
            <span className="rounded-full bg-navy px-2.5 py-1 text-[11px] font-bold text-white">
              EXCLUSIVA
            </span>
          )}
        </div>
        {p.isRemate && (
          <span className="absolute right-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white">
            En remate
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          <div className="mb-2 flex items-center gap-1 text-xs text-muted">
            <IPin s={11} />
            {locationLabel(p.location)} · {TYPE_LABEL_SINGULAR[p.propertyType]}
          </div>
          <div className="mb-2 font-display text-xl font-semibold text-navy">{p.title}</div>
          <div className="flex gap-4 text-[13px] text-ink">
            {(p.bedrooms ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <IBed s={14} />
                {p.bedrooms} rec.
              </span>
            )}
            {(p.bathrooms ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <IBath s={14} />
                {p.bathrooms} baños
              </span>
            )}
            {area > 0 && (
              <span className="flex items-center gap-1.5">
                <IRuler s={14} />
                {Math.round(area)} m²
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 font-display text-2xl font-bold tracking-[-0.5px] text-navy">
          {propertyPrice(p, { compact: true })}
        </div>
      </div>
    </Link>
  );
}
