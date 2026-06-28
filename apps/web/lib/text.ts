// Normaliza para comparar/buscar sin distinguir acentos, mayúsculas ni espacios
// redundantes. Mismo criterio que el backend (apps/api/src/lib/text.ts).
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
