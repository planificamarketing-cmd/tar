'use client';

// Marcadores del mapa (§7.3): *price-pill* navy para propiedades y burbuja de
// conteo para clusters. Son HTML puro dentro de `AdvancedMarker`, así que se
// estilan con Tailwind y respetan los tokens de marca (nada de iconos PNG).

// Burbuja de cluster: el diámetro crece con la cantidad, con tope para que no
// tape el mapa.
export function ClusterBubble({ count }: { count: number }) {
  const size = Math.round(38 + Math.min(count, 60) * 0.5);
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-navy font-semibold text-white shadow-[0_4px_14px_rgba(15,27,45,0.45)] ring-[5px] ring-navy/25 transition-transform hover:scale-105"
    >
      <span className={count >= 100 ? 'text-[12px]' : 'text-[13px]'}>{count}</span>
    </div>
  );
}

// Price-pill: navy por defecto (token `--dark` del PRD §7.0), dorado si la
// propiedad es premium/destacada y rojo de marca cuando está seleccionada.
export function PricePill({
  label,
  featured,
  selected,
}: {
  label: string;
  featured: 'normal' | 'destacada' | 'premium';
  selected: boolean;
}) {
  const premium = featured !== 'normal';
  const body = selected
    ? 'bg-brand text-white ring-white'
    : premium
      ? 'bg-gradient-to-br from-premium-from to-premium-to text-[#3A2A08] ring-white'
      : 'bg-navy text-white ring-white';
  const tail = selected ? 'bg-brand' : premium ? 'bg-premium-to' : 'bg-navy';

  return (
    <div className="relative -translate-y-1 transition-transform hover:scale-[1.06]">
      <div
        className={`whitespace-nowrap rounded-full px-2.5 py-[5px] text-[12px] font-bold tracking-tight shadow-[0_3px_10px_rgba(0,0,0,0.28)] ring-2 ${body}`}
      >
        {premium && !selected && <span className="mr-0.5">★</span>}
        {label}
      </div>
      <div
        className={`absolute left-1/2 top-full -mt-[4px] h-[9px] w-[9px] -translate-x-1/2 rotate-45 ${tail}`}
      />
    </div>
  );
}
