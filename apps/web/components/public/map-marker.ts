// Marcadores del mapa (§7.3): *price-pill* para propiedades y burbuja de conteo
// para clusters. Leaflet dibuja marcadores HTML con `divIcon`, que recibe una
// CADENA de HTML — por eso son funciones que devuelven markup y no componentes
// React (evita meter `react-dom/server` en el bundle solo para esto).
//
// Las clases de Tailwind dentro de estas plantillas SÍ las detecta el compilador:
// su rastreador lee el texto de los archivos `.ts`/`.tsx`, no el árbol JSX.
//
// Truco de anclaje: el icono se registra con tamaño 0×0 y el contenido se
// posiciona en absoluto con `translate(-50%,-100%)`, de modo que la punta del
// marcador cae exactamente sobre la coordenada sin importar cuánto mida la
// etiqueta (los precios tienen anchos muy distintos).

import type { FeaturedLevel } from '@tar/shared';

// Los textos vienen de datos propios ya formateados, pero el markup se inyecta
// como HTML: se escapa por principio.
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ANCHOR = 'position:absolute;left:0;top:0;transform:translate(-50%,-100%);';

// Burbuja de cluster: el diámetro crece con la cantidad, con tope para que no
// tape el mapa. Se ancla por el centro, no por la punta.
export function clusterBubbleHtml(count: number): string {
  const size = Math.round(38 + Math.min(count, 60) * 0.5);
  const text = count >= 100 ? 'text-[12px]' : 'text-[13px]';
  return `<div style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:${size}px;height:${size}px" class="flex cursor-pointer items-center justify-center rounded-full bg-navy font-semibold text-white shadow-[0_4px_14px_rgba(15,27,45,0.45)] ring-[5px] ring-navy/25">
    <span class="${text}">${count}</span>
  </div>`;
}

// Price-pill: navy por defecto (token `--dark` del PRD §7.0), dorado si la
// propiedad es premium/destacada y rojo de marca cuando está seleccionada.
export function pricePillHtml(
  label: string,
  featured: FeaturedLevel,
  selected: boolean,
): string {
  const premium = featured !== 'normal';
  const body = selected
    ? 'bg-brand text-white'
    : premium
      ? 'bg-gradient-to-br from-premium-from to-premium-to text-[#3A2A08]'
      : 'bg-navy text-white';
  const tail = selected ? 'bg-brand' : premium ? 'bg-premium-to' : 'bg-navy';
  const star = premium && !selected ? '<span class="mr-0.5">★</span>' : '';

  return `<div style="${ANCHOR}" class="relative cursor-pointer">
    <div class="whitespace-nowrap rounded-full px-2.5 py-[5px] text-[12px] font-bold tracking-tight shadow-[0_3px_10px_rgba(0,0,0,0.28)] ring-2 ring-white ${body}">${star}${esc(label)}</div>
    <div class="absolute left-1/2 top-full -mt-[4px] h-[9px] w-[9px] -translate-x-1/2 rotate-45 ${tail}"></div>
  </div>`;
}

// Pin sencillo de una sola propiedad (ficha) y del selector del panel.
export function pinHtml(): string {
  return `<div style="${ANCHOR}" class="relative">
    <div class="h-[22px] w-[22px] rounded-full bg-brand shadow-[0_3px_12px_rgba(210,16,62,0.45)] ring-[3px] ring-white"></div>
    <div class="absolute left-1/2 top-full -mt-[5px] h-[10px] w-[10px] -translate-x-1/2 rotate-45 bg-brand"></div>
  </div>`;
}
