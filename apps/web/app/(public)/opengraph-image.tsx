import { ImageResponse } from 'next/og';

// Imagen social (OpenGraph/Twitter) por defecto para todo el sitio público, generada
// en el servidor con next/og (SVG→PNG, sin binarios en el repo). La ficha de
// propiedad la sobrescribe con su portada; el resto de páginas (home, listado,
// nosotros, contacto) hereda esta. 1200×630 es el tamaño canónico de OG.
export const alt = 'TAR Internacional — Grupo Inmobiliario';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Tokens de marca (design-reference v3): navy de fondo, rojo de acento, dorado premium.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0F1B2D 0%, #16263D 60%, #3A1119 100%)',
          padding: '80px',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 54, height: 6, background: '#D2103E' }} />
          <div
            style={{
              marginLeft: 24,
              fontSize: 30,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.72)',
            }}
          >
            TAR Internacional
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Bienes raíces que
          </div>
          <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            construyen patrimonio.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              color: 'rgba(255,255,255,0.66)',
              maxWidth: 820,
            }}
          >
            Departamentos, oficinas, locales y bodegas en las mejores zonas de México.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: 26 }}>
          <span style={{ color: '#E4C66A' }}>60+ años de experiencia</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 16px' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.72)' }}>Venta y renta</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
