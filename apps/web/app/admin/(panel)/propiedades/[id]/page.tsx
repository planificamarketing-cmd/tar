'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  COMMERCIAL_STATUSES,
  type CommercialStatus,
} from '@tar/shared';
import {
  useProperty,
  usePublishProperty,
  useUpdateProperty,
  useUpdatePropertyStatus,
} from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import { PropertyFields } from '@/components/property-fields';
import { ImageUploader } from '@/components/image-uploader';
import {
  PropertyStatusBadge,
  RemateBadge,
} from '@/components/property-status-badge';
import { FlyerButton } from '@/components/flyer-button';
import { PROPERTY_STATUS_META } from '@/lib/format';
import {
  fromDetail,
  toPayload,
  validate,
  type PropertyFormValues,
} from '@/lib/property-form';

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  // ventas/lector llegan aquí en modo consulta: sin capacidad de escritura, el
  // formulario queda de solo lectura y no se muestran los botones de acción.
  const canWrite = can('properties:write');
  const { data: prop, isLoading, isError } = useProperty(id);
  const update = useUpdateProperty(id);
  const publish = usePublishProperty();
  const changeStatus = useUpdatePropertyStatus();

  const [value, setValue] = useState<PropertyFormValues | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Hidrata el formulario una vez cargada la propiedad.
  useEffect(() => {
    if (prop && !value) setValue(fromDetail(prop));
  }, [prop, value]);

  if (isLoading || !value) {
    return <div className="px-6 py-16 text-center text-sm text-muted">Cargando…</div>;
  }
  if (isError || !prop) {
    return (
      <div className="px-6 py-16 text-center text-sm text-red-600">
        No se pudo cargar la propiedad.
      </div>
    );
  }

  function patch(p: Partial<PropertyFormValues>) {
    setValue((v) => (v ? { ...v, ...p } : v));
  }

  async function save() {
    if (!value) return;
    const v = validate(value);
    if (v) {
      setMsg({ kind: 'err', text: v });
      return;
    }
    try {
      await update.mutateAsync(toPayload(value));
      setMsg({ kind: 'ok', text: 'Cambios guardados.' });
    } catch {
      setMsg({ kind: 'err', text: 'No se pudieron guardar los cambios.' });
    }
  }

  async function doPublish() {
    try {
      await publish.mutateAsync(id);
      setMsg({ kind: 'ok', text: 'Propiedad publicada.' });
    } catch {
      setMsg({
        kind: 'err',
        text: 'No se pudo publicar: faltan ubicación (lat/lng) o precio. Guarda los cambios primero.',
      });
    }
  }

  const isDraft = prop.status === 'borrador';

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/propiedades"
            className="text-sm font-medium text-muted hover:text-ink"
          >
            ← Propiedades
          </Link>
          <h1 className="mt-1 truncate font-display text-3xl text-navy">
            {prop.title}
          </h1>
          <div className="mt-1.5 flex items-center gap-2">
            <PropertyStatusBadge status={prop.status} />
            <RemateBadge isRemate={prop.isRemate} />
          </div>
        </div>
        <FlyerButton
          id={id}
          name={prop.title}
          label="Descargar flyer"
          className="shrink-0 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:bg-canvas disabled:opacity-50"
        />
      </header>

      {!canWrite && (
        <div className="mb-5 rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-muted">
          Estás viendo esta propiedad en <strong>modo consulta</strong>: tu rol no
          puede editarla.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Columna principal: campos + imágenes. En solo lectura, el fieldset
            deshabilita todos los inputs y controles anidados. */}
        <fieldset
          disabled={!canWrite}
          className="m-0 min-w-0 space-y-5 border-0 p-0"
        >
          <PropertyFields value={value} onChange={patch} />

          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg text-navy">Imágenes</h2>
            <p className="mt-0.5 text-sm text-muted">
              La primera imagen (o la marcada) es la portada del listado.
            </p>
            <div className="mt-4">
              <ImageUploader propertyId={id} images={prop.images} />
            </div>
          </section>
        </fieldset>

        {/* Panel lateral: guardar / publicar / estatus (solo con escritura) */}
        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          {canWrite && (
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h3 className="font-display text-base text-navy">Publicación</h3>

            <button
              onClick={() => void save()}
              disabled={update.isPending}
              className="mt-4 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas disabled:opacity-50"
            >
              {update.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>

            {isDraft ? (
              <button
                onClick={() => void doPublish()}
                disabled={publish.isPending}
                className="mt-2.5 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-50"
              >
                {publish.isPending ? 'Publicando…' : 'Publicar'}
              </button>
            ) : (
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                  Estatus comercial
                </label>
                <select
                  value={
                    COMMERCIAL_STATUSES.includes(prop.status as CommercialStatus)
                      ? prop.status
                      : 'disponible'
                  }
                  disabled={changeStatus.isPending}
                  onChange={(e) =>
                    changeStatus.mutate({
                      id,
                      status: e.target.value as CommercialStatus,
                    })
                  }
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                >
                  {COMMERCIAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PROPERTY_STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {msg && (
              <p
                className={`mt-3 text-sm ${
                  msg.kind === 'ok' ? 'text-green-700' : 'text-red-600'
                }`}
              >
                {msg.text}
              </p>
            )}
          </div>
          )}

          {prop.slug && (
            <div className="rounded-2xl border border-line bg-white p-5 text-sm shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                Slug
              </div>
              <div className="mt-1 break-all font-mono text-ink">{prop.slug}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
