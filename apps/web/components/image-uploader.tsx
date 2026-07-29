'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  useDeleteImage,
  useUpdateImage,
  useUploadImages,
} from '@/lib/queries';
import type { PropertyImage } from '@/lib/types';
import { mediaUrl } from '@/lib/api';
import { NUpload } from '@/components/icons';

// ImageUploader — subida masiva (drag&drop o selector). El re-encode a WebP +
// thumbnail ocurre en el servidor (sharp); aquí sólo enviamos los archivos.
export function ImageUploader({
  propertyId,
  images,
}: {
  propertyId: string;
  images: PropertyImage[];
}) {
  const upload = useUploadImages(propertyId);
  const del = useDeleteImage(propertyId);
  const updateImg = useUpdateImage(propertyId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  // Índice de la imagen abierta en el visor (null = cerrado).
  const [viewer, setViewer] = useState<number | null>(null);

  function send(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length) upload.mutate(arr);
  }

  // Navegación del visor por teclado: Esc cierra, ←/→ cambian de imagen.
  useEffect(() => {
    if (viewer === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setViewer(null);
      else if (e.key === 'ArrowRight')
        setViewer((i) => (i === null ? i : (i + 1) % images.length));
      else if (e.key === 'ArrowLeft')
        setViewer((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewer, images.length]);

  return (
    <div>
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          send(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          drag ? 'border-brand bg-brand-soft' : 'border-line bg-canvas/60 hover:bg-canvas'
        }`}
      >
        <span className="text-muted">
          <NUpload s={28} />
        </span>
        <p className="mt-2 text-sm font-medium text-navy">
          Arrastra imágenes aquí o haz clic para seleccionar
        </p>
        <p className="mt-0.5 text-xs text-muted">
          JPG/PNG/WebP · hasta 20 a la vez · se convierten a WebP automáticamente
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) send(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {upload.isPending && (
        <p className="mt-3 text-sm text-muted">Subiendo y procesando imágenes…</p>
      )}
      {upload.isError && (
        <p className="mt-3 text-sm text-red-600">
          No se pudieron subir algunas imágenes.
        </p>
      )}

      {/* Galería */}
      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-xl ring-1 ring-line"
            >
              <button
                type="button"
                onClick={() => setViewer(idx)}
                title="Ampliar"
                className="relative block aspect-[4/3] w-full cursor-zoom-in bg-canvas"
              >
                <Image
                  src={mediaUrl(img.urlThumb)}
                  alt={img.alt ?? ''}
                  fill
                  sizes="200px"
                  unoptimized
                  className="object-cover"
                />
              </button>
              {img.isCover && (
                <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Portada
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                {!img.isCover && (
                  <button
                    type="button"
                    disabled={updateImg.isPending}
                    onClick={() =>
                      updateImg.mutate({ imgId: img.id, body: { isCover: true } })
                    }
                    className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-navy transition hover:bg-white"
                  >
                    Portada
                  </button>
                )}
                <button
                  type="button"
                  disabled={del.isPending}
                  onClick={() => del.mutate(img.id)}
                  className="ml-auto rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-white"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visor (lightbox) */}
      {viewer !== null && images[viewer] && (
        <div
          onClick={() => setViewer(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setViewer(null)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white transition hover:bg-white/20"
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewer((i) => (i === null ? i : (i - 1 + images.length) % images.length));
                }}
                aria-label="Anterior"
                className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white transition hover:bg-white/20"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewer((i) => (i === null ? i : (i + 1) % images.length));
                }}
                aria-label="Siguiente"
                className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white transition hover:bg-white/20"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(images[viewer].urlWebp)}
            alt={images[viewer].alt ?? ''}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
          />

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 font-mono text-xs text-white">
            {viewer + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
