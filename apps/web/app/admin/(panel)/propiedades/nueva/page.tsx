'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCreateProperty } from '@/lib/queries';
import { PropertyFields } from '@/components/property-fields';
import {
  EMPTY_PROPERTY,
  toPayload,
  validate,
  type PropertyFormValues,
} from '@/lib/property-form';

export default function NewPropertyPage() {
  const router = useRouter();
  const create = useCreateProperty();
  const [value, setValue] = useState<PropertyFormValues>(EMPTY_PROPERTY);
  const [err, setErr] = useState<string | null>(null);

  function patch(p: Partial<PropertyFormValues>) {
    setValue((v) => ({ ...v, ...p }));
  }

  async function save() {
    const v = validate(value);
    if (v) {
      setErr(v);
      return;
    }
    setErr(null);
    try {
      const res = await create.mutateAsync(toPayload(value));
      // El borrador queda creado; en la edición se suben imágenes y se publica.
      router.push(`/admin/propiedades/${res.data.id}`);
    } catch {
      setErr('No se pudo guardar. Revisa los datos e inténtalo de nuevo.');
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-navy">Nueva propiedad</h1>
          <p className="mt-1 text-sm text-muted">
            Se guarda como borrador. Las imágenes y la publicación se hacen en el
            siguiente paso.
          </p>
        </div>
        <Link
          href="/admin/propiedades"
          className="text-sm font-medium text-muted hover:text-ink"
        >
          ← Volver
        </Link>
      </header>

      <PropertyFields value={value} onChange={patch} />

      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

      <div className="mt-6 flex items-center justify-end gap-3">
        <Link
          href="/admin/propiedades"
          className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas"
        >
          Cancelar
        </Link>
        <button
          onClick={() => void save()}
          disabled={create.isPending}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-50"
        >
          {create.isPending ? 'Guardando…' : 'Guardar borrador'}
        </button>
      </div>
    </div>
  );
}
