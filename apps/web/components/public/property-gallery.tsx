'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { mediaUrl } from '@/lib/api';
import { IChevL, IChevR, IClose, ICamera } from './icons';
import type { PropertyImage, PropertyVideo } from '@/lib/types';

// Galería de la ficha (PropertyGallery, §7.1): mosaico protagonista (imagen
// grande + columna de miniaturas, estilo prototipo-v3 · Detail) que abre un
// lightbox a pantalla completa. Lazy + WebP vía next/image. Sin dependencia de mapa.
export function PropertyGallery({ images, title }: { images: PropertyImage[]; title: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null); // índice abierto, o null

  if (!images.length) {
    return (
      <div className="relative h-[300px] overflow-hidden rounded-[18px] bg-navy lg:h-[540px]">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_20px,rgba(255,255,255,0.03)_20px,rgba(255,255,255,0.03)_40px)]" />
      </div>
    );
  }

  const main = images[0]!;
  const sideThumbs = images.slice(1, 4); // hasta 3 en la columna del mosaico
  const extra = Math.max(0, images.length - 4);
  const open = (i: number) => setLightbox(i);

  return (
    <>
      {/* Mosaico: imagen grande + columna de miniaturas (escritorio); en móvil solo la grande */}
      <div className="grid h-[300px] grid-cols-1 gap-2 overflow-hidden rounded-[18px] sm:h-[420px] lg:h-[540px] lg:grid-cols-[2fr_1fr]">
        <button
          type="button"
          onClick={() => open(0)}
          className="group relative overflow-hidden bg-navy"
          aria-label="Ver fotos en grande"
        >
          <Image
            src={main.urlWebp}
            alt={main.alt ?? title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-navy shadow-sm">
            <ICamera s={14} /> {images.length} foto{images.length !== 1 ? 's' : ''}
          </span>
        </button>

        {sideThumbs.length > 0 && (
          <div className="hidden grid-rows-3 gap-2 lg:grid">
            {sideThumbs.map((img, i) => {
              const isLast = i === sideThumbs.length - 1;
              const globalIdx = i + 1;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => open(globalIdx)}
                  className="group relative overflow-hidden bg-navy"
                  aria-label="Ver foto"
                >
                  <Image
                    src={img.urlWebp}
                    alt={img.alt ?? ''}
                    fill
                    sizes="33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {isLast && extra > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-white transition-colors group-hover:bg-black/45">
                      <ICamera s={22} />
                      <span className="text-sm font-semibold">+{extra} fotos</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tira de miniaturas (navegación rápida) */}
      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => open(i)}
              className="relative h-[58px] w-[86px] shrink-0 overflow-hidden rounded-lg border-2 border-transparent transition-colors hover:border-brand"
              aria-label={`Abrir foto ${i + 1}`}
            >
              <Image src={img.urlThumb} alt="" fill sizes="86px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <Lightbox
          images={images}
          index={lightbox}
          title={title}
          onIndex={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

// Visor a pantalla completa: flechas, contador, teclado (←/→/Esc) y tira inferior.
function Lightbox({
  images,
  index,
  title,
  onIndex,
  onClose,
}: {
  images: PropertyImage[];
  index: number;
  title: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const go = useCallback(
    (dir: number) => onIndex((index + dir + images.length) % images.length),
    [index, images.length, onIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // bloquea el scroll de fondo
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  const img = images[index]!;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${title}`}
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-3 text-white lg:px-6">
        <span className="text-sm font-medium tabular-nums">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <IClose s={22} />
        </button>
      </div>

      {/* Imagen + flechas */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 lg:px-16">
        <Image
          key={img.id}
          src={img.urlWebp}
          alt={img.alt ?? title}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 lg:left-5"
            >
              <IChevL s={24} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Siguiente"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 lg:right-5"
            >
              <IChevR s={24} />
            </button>
          </>
        )}
      </div>

      {/* Tira inferior */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 lg:px-6">
          {images.map((im, i) => (
            <button
              key={im.id}
              type="button"
              onClick={() => onIndex(i)}
              className={[
                'relative h-[52px] w-[76px] shrink-0 overflow-hidden rounded-md border-2 transition-opacity',
                i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-90',
              ].join(' ')}
              aria-label={`Ir a la foto ${i + 1}`}
            >
              <Image src={im.urlThumb} alt="" fill sizes="76px" className="object-cover" />
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
