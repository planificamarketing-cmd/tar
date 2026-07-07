// Set de iconos del prototipo admin (v3-admin.jsx) — stroke currentColor, sin
// dependencias externas. Mismos trazos para mantener el panel idéntico al prototipo.

export type IconProps = { s?: number; className?: string };

function make(paths: string[], opts?: { fill?: string; sw?: number }) {
  return function I({ s = 18, className }: IconProps) {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill={opts?.fill ?? 'none'}
        stroke="currentColor"
        strokeWidth={opts?.sw ?? 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={{ flexShrink: 0 }}
      >
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  };
}

export const NDash = make(['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z']);
export const NHome = make(['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'M9 22V12h6v10']);
export const NTenant = make([
  'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2',
  'M8.5 11a4 4 0 100-8 4 4 0 000 8z',
  'M23 21v-2a4 4 0 00-3-3.87',
  'M16 3.13a4 4 0 010 7.75',
]);
export const NUser = NTenant;
export const NPlus = make(['M9 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2h-4', 'M12 4v12', 'M8 8l4-4 4 4']);
export const NMsg = make(['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', 'M8 9h8', 'M8 13h5']);
export const NCog = make([
  'M12 15a3 3 0 100-6 3 3 0 000 6z',
  'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
]);
export const NLogout = make(['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4', 'M16 17l5-5-5-5', 'M21 12H9']);
export const NUpload = make(['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12']);
export const NRent = make(['M12 1l3 5h-6z', 'M3 21h18', 'M5 21V8l7-5 7 5v13', 'M9 21v-6h6v6']);
export const NBuilding = make([
  'M3 21h18',
  'M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16',
  'M9 9h.01',
  'M13 9h.01',
  'M9 13h.01',
  'M13 13h.01',
  'M9 17h.01',
  'M13 17h.01',
]);
export const NScript = make(['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M9 15h2', 'M9 11h6', 'M9 7h2']);
export const NSearch = make(['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35']);
export const NMenu = make(['M3 6h18', 'M3 12h18', 'M3 18h18']);
export const NClose = make(['M6 6l12 12', 'M6 18L18 6']);
