'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MapPreview } from '@/lib/maps';
import { TYPE_LABEL_SINGULAR, locationLabel, propertyPrice } from '@/lib/public';
import { IBed, IBath, IRuler, IPin } from './icons';

// Vista previa que aparece al hacer clic en un pin (§7.3). Va anclada abajo del
// mapa: en móvil ocupa el ancho completo, en escritorio es una tarjeta lateral.
export function MapPreviewCard({
  preview,
  loading,
  onClose,
}: {
  preview: MapPreview | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    // z-[500]: los paneles de Leaflet llegan a 400 y taparían la tarjeta.
    <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-[500] sm:inset-x-auto sm:left-3 sm:w-[330px]">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_36px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar vista previa"
          className="absolute right-2 top-2 z-[2] flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-lg leading-none text-navy shadow-sm transition hover:bg-canvas"
        >
          ×
        </button>

        {loading || !preview ? (
          <div className="flex items-center gap-3 p-3">
            <div className="h-[74px] w-[104px] shrink-0 animate-pulse rounded-xl bg-canvas" />
            <div className="min-w-0 flex-1 space-y-2 py-1">
              <div className="h-3 w-2/3 animate-pulse rounded bg-canvas" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-canvas" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-canvas" />
            </div>
          </div>
        ) : (
          <Link href={`/propiedades/${preview.slug}`} className="flex items-stretch gap-3 p-3">
            <div className="relative h-[74px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-navy">
              {preview.cover?.urlThumb ? (
                <Image
                  src={preview.cover.urlThumb}
                  alt={preview.title}
                  fill
                  sizes="104px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
              )}
              {preview.isRemate && (
                <span className="absolute left-1 top-1 rounded-full bg-brand px-1.5 py-[1px] text-[9px] font-bold text-white">
                  Remate
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1 pr-5">
              <div className="flex items-center gap-1 text-[11px] text-muted">
                <IPin s={10} />
                <span className="truncate">{locationLabel(preview.location)}</span>
              </div>
              <div className="mt-0.5 line-clamp-2 font-display text-[13px] font-medium leading-snug text-navy">
                {preview.title}
              </div>
              <div className="mt-1 flex items-center gap-2.5 text-[11px] text-ink">
                {(preview.bedrooms ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5">
                    <IBed s={11} />
                    {preview.bedrooms}
                  </span>
                )}
                {(preview.bathrooms ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5">
                    <IBath s={11} />
                    {preview.bathrooms}
                  </span>
                )}
                {preview.areaM2 && Number(preview.areaM2) > 0 && (
                  <span className="flex items-center gap-0.5">
                    <IRuler s={11} />
                    {Math.round(Number(preview.areaM2))}m²
                  </span>
                )}
                <span className="truncate text-muted">
                  {TYPE_LABEL_SINGULAR[preview.propertyType]}
                </span>
              </div>
              <div className="mt-1 font-display text-base font-bold tracking-[-0.3px] text-navy">
                {propertyPrice(preview, { compact: true })}
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
