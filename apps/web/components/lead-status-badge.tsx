import type { LeadStatus } from '@tar/shared';
import { LEAD_STATUS_META } from '@/lib/format';

// Pill de estado igual al prototipo: fondo = color con ~13% de opacidad ("22"),
// texto = color sólido.
export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const meta = LEAD_STATUS_META[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}
