'use client';

import { useRef, useState } from 'react';
import type { VideoOrientation } from '@tar/shared';
import { useDeleteVideo, useUploadVideo } from '@/lib/queries';
import { mediaUrl } from '@/lib/api';
import type { PropertyVideo } from '@/lib/types';

const ACCEPT = 'video/mp4,video/webm,video/quicktime';

// Detecta la orientación (horizontal/vertical) leyendo las dimensiones del video
// en el navegador, sin subirlo. Devuelve 'horizontal' si no se puede leer.
function detectOrientation(file: File): Promise<VideoOrientation> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.videoHeight > v.videoWidth ? 'vertical' : 'horizontal');
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('horizontal');
    };
    v.src = url;
  });
}

export function VideoUploader({
  propertyId,
  videos,
}: {
  propertyId: string;
  videos: PropertyVideo[];
}) {
  const upload = useUploadVideo(propertyId);
  const del = useDeleteVideo(propertyId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    file: File;
    orientation: VideoOrientation;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (file.size > 50 * 1024 * 1024) {
      setError('El video supera el límite de 50 MB.');
      return;
    }
    const orientation = await detectOrientation(file);
    setPending({ file, orientation });
  }

  async function confirmUpload() {
    if (!pending) return;
    try {
      await upload.mutateAsync({
        file: pending.file,
        orientation: pending.orientation,
      });
      setPending(null);
    } catch {
      setError('No se pudo subir el video. Revisa el formato (MP4, WebM o MOV).');
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onPick}
        className="hidden"
      />

      {!pending ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-6 text-sm font-medium text-muted transition hover:border-brand hover:text-ink"
        >
          + Subir video (MP4, WebM o MOV · máx. 50 MB · horizontal o vertical)
        </button>
      ) : (
        // Confirmación: muestra la orientación detectada y permite corregirla.
        <div className="rounded-xl border border-line p-4">
          <p className="text-sm font-medium text-ink">
            {pending.file.name}
            <span className="ml-2 text-muted">
              ({(pending.file.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-muted">Orientación:</span>
            {(['horizontal', 'vertical'] as VideoOrientation[]).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setPending({ ...pending, orientation: o })}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  pending.orientation === o
                    ? 'bg-brand text-white'
                    : 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-canvas'
                }`}
              >
                {o === 'horizontal' ? 'Horizontal' : 'Vertical'}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void confirmUpload()}
              disabled={upload.isPending}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
            >
              {upload.isPending ? 'Subiendo…' : 'Subir'}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {videos.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {videos.map((v) => (
            <div key={v.id} className="rounded-xl border border-line p-2">
              <div className="mb-2 flex items-center justify-between">
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}
                >
                  {v.orientation === 'vertical' ? 'Vertical' : 'Horizontal'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Eliminar este video?')) void del.mutate(v.id);
                  }}
                  className="rounded-lg border border-line px-2 py-0.5 text-xs font-medium text-muted transition hover:border-red-300 hover:text-red-600"
                >
                  Eliminar
                </button>
              </div>
              <video
                src={mediaUrl(v.url)}
                controls
                preload="metadata"
                className={`w-full rounded-lg bg-black ${
                  v.orientation === 'vertical' ? 'max-h-96' : ''
                }`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
