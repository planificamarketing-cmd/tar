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
  includeAddress = true,
}: {
  id: string;
  name: string;
  className?: string;
  label?: string;
  format?: 'png' | 'pdf';
  // Solo aplica al folleto PDF: en `false` se descarga la versión sin la
  // dirección exacta, la que se comparte con prospectos.
  includeAddress?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      await downloadFlyer(id, name, format, includeAddress);
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
          ? includeAddress
            ? 'Descargar el folleto PDF completo, con la dirección exacta (uso interno)'
            : 'Descargar el folleto PDF sin la dirección exacta, para compartir con un prospecto'
          : 'Descargar un flyer (imagen) para compartir'
      }
    >
      {busy ? 'Generando…' : label}
    </button>
  );
}
