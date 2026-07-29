// Serialización CSV (RFC 4180) para las exportaciones del panel. Escapa comillas y
// entrecomilla las celdas con comas/saltos de línea. El BOM UTF-8 hace que Excel en
// español reconozca los acentos al abrir el archivo.

export const CSV_BOM = '﻿';

type Cell = string | number | boolean | null | undefined;

function cell(v: Cell): string {
  if (v == null) return '';
  const s = typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Filas (la primera suele ser el encabezado) → texto CSV con BOM, listo para servir.
export function toCsv(rows: Cell[][]): string {
  return CSV_BOM + rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

// Fecha ISO → formato legible es-MX (dd/mm/aaaa hh:mm) sin dependencias.
export function csvDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
