import { join } from 'node:path';
import sharp from 'sharp';
import { env } from '../../env';
import { keyFromUrl } from '../../lib/storage';
import { getPropertyByIdAdmin } from './properties.service';
import { TAR_LOGO_WHITE_WEBP } from './flyer-assets';

// Generación de un flyer compartible por propiedad (imagen vertical 1080×1350,
// formato de post/historia). Se compone con sharp: foto de portada → recorte de
// cobertura + degradado + logo + datos + etiquetas. Sin dependencias nuevas.

const W = 1080;
const H = 1350;
const NAVY = '#0F1B2D';
const BRAND = '#D2103E';
const GOLD = '#E4C66A';
const WHITE = '#FFFFFF';
const MUTED = '#C8CDD6';

const TYPE_LABEL: Record<string, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  oficina: 'Oficina',
  local_comercial: 'Local comercial',
  bodega_industrial: 'Bodega industrial',
  terreno_industrial: 'Terreno industrial',
  edificio: 'Edificio',
  terreno: 'Terreno',
};

// Escapa texto para incrustarlo en el SVG.
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const numFmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

function money(value: string | null, currency: string | null): string | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `$${numFmt.format(n)} ${currency ?? 'MXN'}`;
}

// Reparte un texto en como máximo `maxLines` líneas de ~`maxChars`, con elipsis.
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines) break;
    } else {
      cur = next;
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  // Si quedó texto fuera, marca elipsis en la última línea.
  const consumed = lines.join(' ');
  if (consumed.length < text.length) {
    const last = lines[lines.length - 1] ?? '';
    lines[lines.length - 1] = `${last.slice(0, maxChars - 1).trimEnd()}…`;
  }
  return lines;
}

type PropertyForFlyer = Awaited<ReturnType<typeof getPropertyByIdAdmin>>;

function buildSvg(p: PropertyForFlyer): Buffer {
  // Etiquetas (remate / destaque) como pastillas.
  const pills: { text: string; bg: string; fg: string }[] = [];
  if (p.isRemate) pills.push({ text: 'EN REMATE', bg: BRAND, fg: WHITE });
  if (p.featured === 'premium') pills.push({ text: 'PREMIUM', bg: GOLD, fg: NAVY });
  else if (p.featured === 'destacada')
    pills.push({ text: 'DESTACADA', bg: GOLD, fg: NAVY });

  let pillX = 56;
  const pillSvg = pills
    .map((pl) => {
      const w = 34 + pl.text.length * 17;
      const rect = `<rect x="${pillX}" y="720" rx="18" ry="18" width="${w}" height="46" fill="${pl.bg}"/>` +
        `<text x="${pillX + w / 2}" y="751" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700" fill="${pl.fg}">${esc(pl.text)}</text>`;
      pillX += w + 14;
      return rect;
    })
    .join('');

  // Precio(s).
  const sale = money(p.priceSale, p.currencySale);
  const rent = money(p.priceRent, p.currencyRent);
  const priceMain = sale ?? rent ?? 'Consultar precio';
  const priceSub =
    sale && rent ? `Renta ${rent} /mes` : rent && !sale ? 'Renta mensual' : '';

  // Título (hasta 2 líneas). Baja si hay subtítulo de precio para no encimarse.
  const titleTop = priceSub ? 958 : 928;
  const titleLines = wrap(p.title, 26, 2);
  const titleSvg = titleLines
    .map(
      (ln, i) =>
        `<text x="56" y="${titleTop + i * 60}" font-family="sans-serif" font-size="50" font-weight="700" fill="${WHITE}">${esc(ln)}</text>`,
    )
    .join('');
  const titleBottom = titleTop + (titleLines.length - 1) * 60;

  // Ubicación.
  const loc = p.location
    ? [p.location.colonia, p.location.municipio, p.location.estado]
        .filter(Boolean)
        .join(', ')
    : '';

  // Specs (según disponibilidad).
  const specs: string[] = [];
  if (p.bedrooms != null) specs.push(`${p.bedrooms} rec`);
  if (p.bathrooms != null) specs.push(`${p.bathrooms} baños`);
  const area =
    p.propertyType === 'oficina' ? (p.usableAreaM2 ?? p.areaM2) : (p.areaM2 ?? p.lotM2);
  if (area != null) specs.push(`${numFmt.format(Number(area))} m²`);
  if (p.parking != null) specs.push(`${p.parking} est`);
  const specsText = specs.join('   ·   ');

  const domain = (() => {
    try {
      return new URL(env.PUBLIC_SITE_URL).host;
    } catch {
      return 'tarinternacional.com';
    }
  })();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NAVY}" stop-opacity="0"/>
      <stop offset="0.55" stop-color="${NAVY}" stop-opacity="0.85"/>
      <stop offset="1" stop-color="${NAVY}" stop-opacity="0.96"/>
    </linearGradient>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NAVY}" stop-opacity="0.6"/>
      <stop offset="1" stop-color="${NAVY}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="300" fill="url(#top)"/>
  <rect x="0" y="560" width="${W}" height="${H - 560}" fill="url(#bottom)"/>
  ${pillSvg}
  <text x="56" y="850" font-family="sans-serif" font-size="66" font-weight="800" fill="${WHITE}">${esc(priceMain)}</text>
  ${priceSub ? `<text x="56" y="888" font-family="sans-serif" font-size="30" font-weight="600" fill="${MUTED}">${esc(priceSub)}</text>` : ''}
  ${titleSvg}
  ${loc ? `<text x="56" y="${titleBottom + 52}" font-family="sans-serif" font-size="34" fill="${MUTED}">${esc(loc)}</text>` : ''}
  ${specsText ? `<text x="56" y="${titleBottom + 104}" font-family="sans-serif" font-size="32" font-weight="600" fill="${WHITE}">${esc(specsText)}</text>` : ''}
  <line x1="56" y1="1268" x2="${W - 56}" y2="1268" stroke="${MUTED}" stroke-opacity="0.25" stroke-width="1"/>
  <text x="56" y="1312" font-family="sans-serif" font-size="28" font-weight="600" fill="${GOLD}">${esc(TYPE_LABEL[p.propertyType] ?? p.propertyType)}</text>
  <text x="${W - 56}" y="1312" text-anchor="end" font-family="sans-serif" font-size="28" fill="${MUTED}">${esc(domain)}</text>
</svg>`;
  return Buffer.from(svg);
}

// Genera el flyer PNG de una propiedad. Lanza 404 si no existe (vía el service).
export async function generateFlyer(id: string): Promise<Buffer> {
  const p = await getPropertyByIdAdmin(id);

  // Base: portada recortada a cobertura, o fondo navy si no hay imágenes locales.
  // Solo se usa la portada si es un archivo local (media servido por nosotros);
  // las URLs externas (p. ej. placeholders del seed) caen al fondo navy.
  const cover = p.images.find((i) => i.isCover) ?? p.images[0];
  const isLocal = cover?.urlWebp.startsWith(env.MEDIA_BASE_URL);
  const base = cover && isLocal
    ? sharp(join(env.MEDIA_DIR, keyFromUrl(cover.urlWebp))).resize(W, H, {
        fit: 'cover',
        position: 'attention',
      })
    : sharp({
        create: { width: W, height: H, channels: 4, background: NAVY },
      });

  const logo = await sharp(TAR_LOGO_WHITE_WEBP)
    .resize({ width: 240 })
    .png()
    .toBuffer();

  return base
    .composite([
      { input: buildSvg(p), top: 0, left: 0 },
      { input: logo, top: 56, left: 56 },
    ])
    .png()
    .toBuffer();
}
