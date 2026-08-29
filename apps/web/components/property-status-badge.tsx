import type { FeaturedLevel, PropertyStatus } from '@tar/shared';
import { FEATURED_META, PROPERTY_STATUS_META } from '@/lib/format';

// Pill de estatus de propiedad — mismo lenguaje visual que LeadStatusBadge
// (fondo = color con ~13% de opacidad, texto = color sólido).
export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const meta = PROPERTY_STATUS_META[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

// Chip de destaque (Premium/Destacada). No renderiza nada para `normal`.
export function FeaturedBadge({ level }: { level: FeaturedLevel }) {
  const meta = FEATURED_META[level];
  if (!meta) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

// Chip "En remate" — convive con el destaque y con cualquier estatus.
export function RemateBadge({ isRemate }: { isRemate: boolean }) {
  if (!isRemate) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: '#D2103E22', color: '#D2103E' }}
    >
      En remate
    </span>
  );
}

// Chip "Exclusiva" — propiedad en exclusiva con TAR. Cuenta como destacada en el
// orden por relevancia, así que además de la insignia entra sola a la portada.
export function ExclusiveBadge({ isExclusive }: { isExclusive: boolean }) {
  if (!isExclusive) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: '#0F1B2D14', color: '#0F1B2D' }}
    >
      Exclusiva
    </span>
  );
}
