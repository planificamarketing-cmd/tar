import { join } from 'node:path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { env } from '../../env';
import { keyFromUrl } from '../../lib/storage';
import { getPropertyByIdAdmin } from './properties.service';
import { TAR_LOGO_WHITE_WEBP } from './flyer-assets';

// Folleto PDF de una propiedad (ficha imprimible tamaño carta) que reúne TODA la
// información de la landing: portada, precio, especificaciones, descripción,
// características, datos de superficie, galería, ubicación y enlace público — con la
// identidad de TAR Internacional (logo + colores de marca).
//
// Se genera con pdfkit (JS puro, sin binarios pesados) y las imágenes WebP se
// convierten a JPEG con sharp antes de incrustarlas (pdfkit solo admite JPEG/PNG).
// Sin dependencias de navegador headless: apto para el VPS.

// Paleta de marca (dorado y muted ajustados para legibilidad sobre blanco).
const NAVY = '#0F1B2D';
const BRAND = '#D2103E';
const GOLD = '#BE8C3C';
const INK = '#1F2937';
const MUTED = '#6B7280';
const LINE = '#E5E7EB';
const SOFT = '#F4F4F1';

// Geometría carta (US Letter, puntos).
const PAGE_W = 612;
const PAGE_H = 792;
const M = 42; // margen de contenido
const CW = PAGE_W - M * 2; // ancho de contenido
const BOTTOM = PAGE_H - 58; // límite antes del pie

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

const numFmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

function money(value: unknown, currency: string | null): string | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `$${numFmt.format(n)} ${currency ?? 'MXN'}`;
}

// Carga una imagen (local por disco o remota por fetch) y la recorta a cobertura al
// tamaño en puntos pedido (se rasteriza a 2× para nitidez de impresión). Devuelve un
// JPEG o null si no se pudo obtener.
async function loadCover(
  url: string | undefined,
  wPt: number,
  hPt: number,
): Promise<Buffer | null> {
  if (!url) return null;
  try {
    let input: Buffer | string;
    if (url.startsWith(env.MEDIA_BASE_URL)) {
      input = join(env.MEDIA_DIR, keyFromUrl(url));
    } else if (/^https?:\/\//.test(url)) {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      input = Buffer.from(await res.arrayBuffer());
    } else {
      input = join(env.MEDIA_DIR, keyFromUrl(url));
    }
    return await sharp(input)
      .resize(Math.round(wPt * 2), Math.round(hPt * 2), {
        fit: 'cover',
        position: 'attention',
      })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    return null;
  }
}

export interface FlyerPdfOptions {
  // La dirección exacta (calle y número) solo se imprime cuando el staff lo pide.
  // Por defecto queda FUERA: los folletos que salen hacia un prospecto muestran
  // únicamente la zona (colonia, municipio, estado), porque la ubicación exacta se
  // reserva hasta que la operación avanza al cierre.
  includeAddress?: boolean;
}

export async function generateFlyerPdf(
  id: string,
  opts: FlyerPdfOptions = {},
): Promise<Buffer> {
  const includeAddress = opts.includeAddress ?? false;
  const p = await getPropertyByIdAdmin(id);

  // Prepara imágenes (portada + hasta 6 de galería) en paralelo.
  const cover = p.images.find((i) => i.isCover) ?? p.images[0];
  const gallery = p.images.filter((i) => i.id !== cover?.id).slice(0, 6);
  const coverJpeg = await loadCover(cover?.urlWebp, CW, 232);
  const galleryJpegs = await Promise.all(
    gallery.map((i) => loadCover(i.urlWebp, 168, 116)),
  );
  const logoPng = await sharp(TAR_LOGO_WHITE_WEBP)
    .resize({ height: 96 })
    .png()
    .toBuffer();

  const doc = new PDFDocument({ size: 'LETTER', margin: 0, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  // ---- Encabezado de marca (banda navy con logo) ----
  const headerH = 76;
  doc.rect(0, 0, PAGE_W, headerH).fill(NAVY);
  doc.rect(0, headerH, PAGE_W, 4).fill(BRAND); // filete rojo de marca
  doc.image(logoPng, M, 20, { height: 38 });
  const domain = (() => {
    try {
      return new URL(env.PUBLIC_SITE_URL).host;
    } catch {
      return 'tarinternacional.com';
    }
  })();
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#C8CDD6')
    .text('FICHA DE PROPIEDAD', M, 28, { width: CW, align: 'right' })
    .fillColor('#8A93A3')
    .fontSize(8)
    .text(domain.toUpperCase(), M, 42, { width: CW, align: 'right' });

  let y = headerH + 4 + 18;

  // ---- Portada ----
  const coverH = 232;
  if (coverJpeg) {
    doc.image(coverJpeg, M, y, { width: CW, height: coverH });
  } else {
    doc.rect(M, y, CW, coverH).fill(SOFT);
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(MUTED)
      .text('Sin imagen de portada', M, y + coverH / 2 - 6, {
        width: CW,
        align: 'center',
      });
  }

  // Etiquetas (remate / destaque) sobre la portada.
  const badges: { text: string; bg: string; fg: string }[] = [];
  if (p.isRemate) badges.push({ text: 'EN REMATE', bg: BRAND, fg: '#FFFFFF' });
  if (p.isExclusive) badges.push({ text: 'EXCLUSIVA', bg: NAVY, fg: '#FFFFFF' });
  if (p.featured === 'premium')
    badges.push({ text: 'PREMIUM', bg: GOLD, fg: '#FFFFFF' });
  else if (p.featured === 'destacada')
    badges.push({ text: 'DESTACADA', bg: GOLD, fg: '#FFFFFF' });
  let bx = M + 12;
  for (const b of badges) {
    doc.font('Helvetica-Bold').fontSize(8.5);
    const w = doc.widthOfString(b.text) + 18;
    doc.roundedRect(bx, y + 12, w, 20, 10).fill(b.bg);
    doc
      .fillColor(b.fg)
      .text(b.text, bx, y + 18, { width: w, align: 'center' });
    bx += w + 8;
  }
  y += coverH + 18;

  // ---- Precio + tipo ----
  const sale = money(p.priceSale, p.currencySale);
  const rent = money(p.priceRent, p.currencyRent);
  const priceMain = sale ?? rent ?? 'Precio a consultar';
  const priceNote = sale && rent ? `Renta ${rent} /mes` : rent && !sale ? 'Renta mensual' : '';
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(GOLD)
    .text((TYPE_LABEL[p.propertyType] ?? p.propertyType).toUpperCase(), M, y, {
      characterSpacing: 1,
    });
  y += 14;
  doc.font('Helvetica-Bold').fontSize(26).fillColor(NAVY).text(priceMain, M, y);
  if (priceNote) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(MUTED)
      .text(priceNote, M, y + 30);
    y += 12;
  }
  y += 34;

  // ---- Título + ubicación ----
  doc.font('Helvetica-Bold').fontSize(17).fillColor(INK);
  doc.text(p.title, M, y, { width: CW });
  y = doc.y + 4;
  const loc = p.location
    ? [p.location.colonia, p.location.municipio, p.location.estado].filter(Boolean).join(', ')
    : '';
  const fullLoc = locationLine(p.address, loc, includeAddress);
  if (fullLoc) {
    doc.font('Helvetica').fontSize(10.5).fillColor(MUTED).text(fullLoc, M, y, { width: CW });
    y = doc.y;
  }
  y += 14;

  // ---- Fila de especificaciones (tarjetas) ----
  const specs: { label: string; value: string }[] = [];
  if (p.bedrooms != null) specs.push({ label: 'Recámaras', value: String(p.bedrooms) });
  if (p.bathrooms != null) specs.push({ label: 'Baños', value: String(p.bathrooms) });
  if (p.halfBathrooms) specs.push({ label: 'Medios baños', value: String(p.halfBathrooms) });
  if (p.parking != null) specs.push({ label: 'Estac.', value: String(p.parking) });
  const areaVal =
    p.propertyType === 'oficina' ? (p.usableAreaM2 ?? p.areaM2) : (p.areaM2 ?? p.lotM2);
  if (areaVal != null)
    specs.push({ label: 'Superficie', value: `${numFmt.format(Number(areaVal))} m²` });
  if (specs.length) {
    const gap = 8;
    const n = specs.length;
    const cw = (CW - gap * (n - 1)) / n;
    specs.forEach((s, i) => {
      const x = M + i * (cw + gap);
      doc.roundedRect(x, y, cw, 46, 8).fill(SOFT);
      doc.font('Helvetica-Bold').fontSize(15).fillColor(NAVY).text(s.value, x, y + 9, {
        width: cw,
        align: 'center',
      });
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(s.label.toUpperCase(), x, y + 29, {
        width: cw,
        align: 'center',
        characterSpacing: 0.5,
      });
    });
    y += 46 + 16;
  }

  // ---- Descripción ----
  if (p.description) {
    y = sectionTitle(doc, 'Descripción', y);
    doc.font('Helvetica').fontSize(10).fillColor(INK);
    const desc = p.description.length > 900 ? p.description.slice(0, 897) + '…' : p.description;
    doc.text(desc, M, y, { width: CW, align: 'left', lineGap: 2 });
    y = doc.y + 16;
  }

  // ---- Datos de superficie adicionales ----
  const extra: { label: string; value: string }[] = [];
  const m2 = (v: unknown) => `${numFmt.format(Number(v))} m²`;
  if (p.usableAreaM2 != null) extra.push({ label: 'Superficie útil', value: m2(p.usableAreaM2) });
  if (p.rentableAreaM2 != null) extra.push({ label: 'Superficie rentable', value: m2(p.rentableAreaM2) });
  if (p.lotM2 != null) extra.push({ label: 'Terreno', value: m2(p.lotM2) });
  if (p.patioM2 != null) extra.push({ label: 'Patio', value: m2(p.patioM2) });
  if (p.terraceM2 != null) extra.push({ label: 'Terraza', value: m2(p.terraceM2) });
  if (p.balconyM2 != null) extra.push({ label: 'Balcón', value: m2(p.balconyM2) });
  if (p.gardenM2 != null) extra.push({ label: 'Jardín', value: m2(p.gardenM2) });
  if (extra.length) {
    y = ensureSpace(doc, y, 26 + extra.length * 8);
    y = sectionTitle(doc, 'Superficies', y);
    doc.font('Helvetica').fontSize(10);
    for (const e of extra) {
      doc.fillColor(MUTED).text(e.label, M, y, { width: CW * 0.5, continued: false });
      doc.fillColor(INK).font('Helvetica-Bold').text(e.value, M + CW * 0.5, y, {
        width: CW * 0.5,
        align: 'right',
      });
      doc.font('Helvetica');
      y += 16;
    }
    y += 8;
  }

  // ---- Características (amenidades) ----
  if (p.amenities.length) {
    y = ensureSpace(doc, y, 60);
    y = sectionTitle(doc, 'Características', y);
    let cx = M;
    const chipH = 22;
    doc.fontSize(9.5).font('Helvetica');
    for (const a of p.amenities) {
      const w = doc.widthOfString(a.name) + 22;
      if (cx + w > M + CW) {
        cx = M;
        y += chipH + 8;
        y = ensureSpace(doc, y, chipH + 8);
      }
      doc.roundedRect(cx, y, w, chipH, 11).fill(SOFT);
      doc.fillColor(INK).text(a.name, cx, y + 6, { width: w, align: 'center' });
      cx += w + 8;
    }
    y += chipH + 18;
  }

  // ---- Galería ----
  const galleryOk = galleryJpegs.filter(Boolean) as Buffer[];
  if (galleryOk.length) {
    y = ensureSpace(doc, y, 26 + 116 + 8);
    y = sectionTitle(doc, 'Galería', y);
    const cols = 3;
    const gap = 8;
    const gw = (CW - gap * (cols - 1)) / cols;
    const gh = 116;
    galleryOk.forEach((img, i) => {
      const col = i % cols;
      if (col === 0 && i > 0) y += gh + gap;
      if (col === 0) y = ensureSpace(doc, y, gh);
      const x = M + col * (gw + gap);
      doc.image(img, x, y, { width: gw, height: gh });
    });
    y += gh + 16;
  }

  // ---- Pie de página (en todas las páginas) ----
  const url = `${env.PUBLIC_SITE_URL}/propiedades/${p.slug ?? ''}`;
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.rect(0, PAGE_H - 42, PAGE_W, 42).fill(NAVY);
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#FFFFFF')
      .text('TAR Internacional', M, PAGE_H - 30, { width: CW * 0.5 });
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#C8CDD6')
      .text(url, M + CW * 0.4, PAGE_H - 29, { width: CW * 0.6, align: 'right' });
  }

  doc.end();
  return done;
}

// Línea de ubicación del folleto. Sin `includeAddress` solo sale la zona
// (colonia, municipio, estado). Con ella, une la calle a la zona SIN repetirla:
// en el inventario importado el campo `address` ya suele traer la colonia (mismo
// criterio que `displayAddress` de la web).
export function locationLine(
  address: string | null | undefined,
  zone: string,
  includeAddress: boolean,
): string {
  if (!includeAddress) return zone;
  const addr = (address ?? '').trim();
  if (!addr) return zone;
  if (!zone) return addr;
  const norm = (t: string) =>
    t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return norm(addr).includes(norm(zone)) ? addr : `${addr}, ${zone}`;
}

// Título de sección con filete, gestionando salto de página si no cabe.
function sectionTitle(doc: PDFKit.PDFDocument, text: string, y: number): number {
  y = ensureSpace(doc, y, 30);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text(text.toUpperCase(), M, y, {
    characterSpacing: 0.6,
  });
  doc
    .moveTo(M, y + 17)
    .lineTo(M + CW, y + 17)
    .lineWidth(0.75)
    .strokeColor(LINE)
    .stroke();
  return y + 26;
}

// Añade una página nueva si el bloque de altura `h` no cabe antes del pie.
function ensureSpace(doc: PDFKit.PDFDocument, y: number, h: number): number {
  if (y + h <= BOTTOM) return y;
  doc.addPage();
  return M + 8;
}
