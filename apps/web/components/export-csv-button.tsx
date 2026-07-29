'use client';

import { useState } from 'react';
import { downloadCsv } from '@/lib/queries';
import { NUpload } from '@/components/icons';

// Botón de exportación CSV (fetch autenticado → descarga). `path` es relativo a la
// API e incluye los filtros vigentes; `filename` es el nombre sugerido del archivo.
export function ExportCsvButton({
  path,
  filename,
  label = 'Exportar CSV',
  className,
}: {
  path: string;
  filename: string;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      await downloadCsv(path, filename);
    } catch {
      window.alert('No se pudo exportar el CSV. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void go()}
      disabled={busy}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:bg-canvas disabled:opacity-50'
      }
      title="Descarga los datos completos en CSV (respeta los filtros activos)"
    >
      <NUpload s={15} /> {busy ? 'Exportando…' : label}
    </button>
  );
}
