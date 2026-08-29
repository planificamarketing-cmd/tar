import Image from 'next/image';
import Link from 'next/link';
import type { PropertyListItem } from '@/lib/types';
import {
  TYPE_LABEL_SINGULAR,
  locationLabel,
  primaryOperation,
  propertyPrice,
} from '@/lib/public';
import { IBed, IBath, IRuler, IPin } from './icons';

// Tarjeta de propiedad fiel al prototipo v3 (PropCard3 + PropImg3): foto dominante,
// badges (destacado dorado / operación / en remate), stats y precio. Server
// component (sin estado); el hover se resuelve con `group` de Tailwind.
export function PropertyCard({ p }: { p: PropertyListItem }) {
  const premium = p.featured === 'premium';
  const featured = p.featured !== 'normal';
  const operation = primaryOperation(p);
  const price = propertyPrice(p, { compact: true });

  return (
    <Link
      href={`/propiedades/${p.slug}`}
      className={[
        'group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300',
        premium
          ? 'border-[1.5px] border-[#D9B65E] shadow-[0_4px_18px_rgba(190,140,60,0.20)] hover:shadow-[0_16px_40px_rgba(190,140,60,0.28)]'
          : 'border border-transparent shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)]',
        'hover:-translate-y-[3px]',
      ].join(' ')}
    >
      {premium && (
        <div className="absolute inset-x-0 top-0 z-[3] h-1 bg-gradient-to-r from-premium-from to-premium-to" />
      )}

      {/* Imagen */}
      <div className="relative h-[220px] shrink-0 overflow-hidden bg-navy">
        {p.cover?.urlWebp ? (
          <Image
            src={p.cover.urlWebp}
            alt={p.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_18px,rgba(255,255,255,0.03)_18px,rgba(255,255,255,0.03)_36px)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-black/40" />

        {/* Badges arriba-izquierda */}
        <div className="absolute left-3.5 top-3.5 flex flex-col items-start gap-1.5">
          {featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-premium-from to-premium-to px-2.5 py-[5px] text-[11px] font-bold tracking-wide text-[#3A2A08] shadow-[0_2px_10px_rgba(190,140,60,0.5)]">
              ★ DESTACADO
            </span>
          )}
          {p.isExclusive && (
            <span className="rounded-full bg-navy px-2.5 py-[5px] text-[11px] font-bold tracking-wide text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              EXCLUSIVA
            </span>
          )}
          <span className="rounded-full bg-white px-3 py-[5px] text-[11px] font-semibold text-navy shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            {operation === 'venta' ? 'En venta' : 'En renta'}
          </span>
        </div>

        {p.isRemate && (
          <span className="absolute right-3.5 top-3.5 rounded-full bg-brand px-3 py-[5px] text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            En remate
          </span>
        )}

        <div className="absolute bottom-2.5 left-3.5 text-[11px] font-medium text-white/85 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
          {TYPE_LABEL_SINGULAR[p.propertyType]}
        </div>
      </div>

      {/* Cuerpo */}
      <div className="px-5 pb-5 pt-[18px]">
        <div className="mb-2.5 flex items-center gap-1 text-xs text-muted">
          <IPin s={11} />
          <span className="truncate">{locationLabel(p.location)}</span>
        </div>
        <div className="mb-1.5 line-clamp-2 font-display text-lg font-medium leading-snug text-navy">
          {p.title}
        </div>
        <div className="mt-3.5 flex items-center justify-between border-t border-[#F1F1F0] pt-3.5">
          <div className="flex items-center gap-3 text-xs text-ink">
            {(p.bedrooms ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <IBed s={13} />
                {p.bedrooms}
              </span>
            )}
            {(p.bathrooms ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <IBath s={13} />
                {p.bathrooms}
              </span>
            )}
            {p.areaM2 && Number(p.areaM2) > 0 && (
              <span className="flex items-center gap-1">
                <IRuler s={13} />
                {Math.round(Number(p.areaM2))}m²
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 font-display text-2xl font-bold tracking-[-0.5px] text-navy">
          {price}
        </div>
      </div>
    </Link>
  );
}
