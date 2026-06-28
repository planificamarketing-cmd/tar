// Normalización de texto para comparar nombres de lugares (estado/municipio/colonia)
// SIN distinguir acentos ni mayúsculas ni espacios redundantes. Evita duplicados del
// tipo "Cuauhtémoc" vs "cuauhtemoc" al resolver/crear una location.
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // marcas diacríticas combinantes
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
