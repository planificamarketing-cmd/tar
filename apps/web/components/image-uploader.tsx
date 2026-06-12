'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  useDeleteImage,
  useUpdateImage,
  useUploadImages,
} from '@/lib/queries';
import type { PropertyImage } from '@/lib/types';
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

  function send(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length) upload.mutate(arr);
  }

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
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-xl ring-1 ring-line"
            >
              <div className="relative aspect-[4/3] bg-canvas">
                <Image
                  src={img.urlThumb}
                  alt={img.alt ?? ''}
                  fill
                  sizes="200px"
                  unoptimized
                  className="object-cover"
                />
              </div>
              {img.isCover && (
                <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Portada
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
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
    </div>
  );
}
