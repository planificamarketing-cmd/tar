'use client';

import { useState } from 'react';
import { downloadFlyer } from '@/lib/queries';

// Botón que descarga el flyer PNG de una propiedad (fetch autenticado). Reusable
// en el listado y en el editor. Disponible para cualquier rol con acceso al panel.
export function FlyerButton({
  id,
  name,
  className,
  label = 'Flyer',
}: {
  id: string;
  name: string;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      await downloadFlyer(id, name);
    } catch {
      window.alert('No se pudo generar el flyer. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void go()}
      disabled={busy}
      className={className}
      title="Descargar un flyer para compartir"
    >
      {busy ? 'Generando…' : label}
    </button>
  );
}
