// Iconos del sitio público (prototipo v3, componentes I3* de v3-ui.jsx). Mismos
// trazos que el prototipo aprobado para mantener el look idéntico. Stroke
// currentColor, sin dependencias externas. Los que van rellenos (pin, corazón,
// verificado) pasan fill:'currentColor'.

export type IconProps = { s?: number; className?: string };

function make(paths: string[], opts?: { fill?: string; sw?: number }) {
  return function I({ s = 16, className }: IconProps) {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill={opts?.fill ?? 'none'}
        stroke="currentColor"
        strokeWidth={opts?.sw ?? 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={{ display: 'block', flexShrink: 0 }}
      >
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  };
}

export const ISearch = make(['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35']);
export const IPin = make(
  ['M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z'],
  { fill: 'currentColor', sw: 0 },
);
export const IBed = make(['M2 7a2 2 0 012-2h16a2 2 0 012 2v10H2V7z', 'M2 13h20', 'M7 13V9', 'M17 13V9']);
export const IBath = make(['M4 12h16M4 12V7a1 1 0 011-1h3m-4 6v5a2 2 0 002 2h12a2 2 0 002-2v-5M15 6a2 2 0 012 2v4']);
export const ICar = make(['M5 17H3v-7l2-5h14l2 5v7h-2', 'M5 17v2h2v-2', 'M17 17v2h2v-2', 'M5 12h14']);
export const IRuler = make(['M21 3L3 21M9.5 14.5l5-5M7 7l2 2M15 11l2 2']);
export const IClose = make(['M18 6L6 18M6 6l12 12']);
export const IChevL = make(['M15 18l-6-6 6-6']);
export const IChevR = make(['M9 18l6-6-6-6']);
export const IChevD = make(['M6 9l6 6 6-6']);
export const IMap = make([
  'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
]);
export const IMail = make(['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6l-10 7L2 6']);
export const IPhone = make([
  'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z',
]);
export const IUser = make(['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 11a4 4 0 100-8 4 4 0 000 8z']);
export const IPlus = make(['M12 5v14M5 12h14']);
export const ICheck = make(['M20 6L9 17l-5-5']);
export const IGrid = make(['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z']);
export const IList = make(['M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01']);
export const IVerif = make(['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4']);
export const ICamera = make([
  'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z',
  'M12 17a4 4 0 100-8 4 4 0 000 8z',
]);
export const IMenu = make(['M3 6h18', 'M3 12h18', 'M3 18h18']);
export const IPlay = make(['M8 5v14l11-7z'], { fill: 'currentColor', sw: 0 });
export const ITag = make([
  'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z',
  'M7 7h.01',
]);
export const IStar = make(['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01z'], {
  fill: 'currentColor',
  sw: 0,
});
