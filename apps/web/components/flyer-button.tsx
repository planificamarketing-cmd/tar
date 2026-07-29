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
  format = 'png',
}: {
  id: string;
  name: string;
  className?: string;
  label?: string;
  format?: 'png' | 'pdf';
}) {
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      await downloadFlyer(id, name, format);
    } catch {
      window.alert(
        `No se pudo generar el ${format === 'pdf' ? 'folleto PDF' : 'flyer'}. Intenta de nuevo.`,
      );
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
      title={
        format === 'pdf'
          ? 'Descargar el folleto PDF completo de la propiedad'
          : 'Descargar un flyer (imagen) para compartir'
      }
    >
      {busy ? 'Generando…' : label}
    </button>
  );
}
