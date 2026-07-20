'use client';

import Image from 'next/image';
import { useState } from 'react';
import { mediaUrl } from '@/lib/api';
import type { PropertyImage, PropertyVideo } from '@/lib/types';

// Galería de la ficha (PropertyGallery, §7.1): imagen principal + tira de
// miniaturas. Lazy + WebP vía next/image. Sin dependencia de mapa.
export function PropertyGallery({ images, title }: { images: PropertyImage[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const main = images[idx];

  if (!images.length) {
    return (
      <div className="relative h-[280px] overflow-hidden rounded-[18px] bg-navy lg:h-[480px]">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_20px,rgba(255,255,255,0.03)_20px,rgba(255,255,255,0.03)_40px)]" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-[280px] overflow-hidden rounded-[18px] bg-navy lg:h-[480px]">
        {main && (
          <Image
            key={main.id}
            src={main.urlWebp}
            alt={main.alt ?? title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover"
          />
        )}
        <div className="absolute left-[18px] top-[18px] rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-navy">
          {images.length} foto{images.length !== 1 ? 's' : ''}
        </div>
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIdx(i)}
              className={[
                'relative h-[60px] w-[88px] shrink-0 overflow-hidden rounded-lg border-2',
                i === idx ? 'border-brand' : 'border-transparent',
              ].join(' ')}
            >
              <Image src={img.urlThumb} alt="" fill sizes="88px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Videos horizontales/verticales de la propiedad (Grupo B #8). Sin transcodificar
// (el stack no lleva ffmpeg); se sirven tal cual desde /media. mediaUrl reescribe
// el host local en dev (WSL).
export function PropertyVideos({ videos }: { videos: PropertyVideo[] }) {
  if (!videos.length) return null;
  return (
    <div className="rounded-[18px] border border-[#F1F1F0] bg-white p-5 lg:p-8">
      <h3 className="mb-4 font-display text-[22px] font-bold text-navy">Videos</h3>
      <div className="flex flex-wrap gap-4">
        {videos.map((v) => (
          <video
            key={v.id}
            src={mediaUrl(v.url)}
            controls
            preload="metadata"
            className={[
              'rounded-xl bg-black',
              v.orientation === 'vertical' ? 'max-h-[520px] w-auto' : 'w-full',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}
