/**
 * Backfill de coordenadas (`geo`) para propiedades sin ubicación en el mapa.
 *
 *   pnpm --filter api geocode:borrador [--dry-run] [--limit=N] [--only-null]
 *
 * Contexto: el importador (§4.3) geocodifica con Google, pero el cliente no abrió
 * cuenta de Google, así que 105 propiedades quedaron en `borrador` sin `geo`.
 * El portal ya usa OpenStreetMap para el mapa; este script cierra el hueco
 * geocodificando con **Nominatim** (OSM, sin llave) a partir de la dirección que
 * cada desarrollo ya tiene en la BD (address + colonia + municipio + estado).
 *
 * Estrategia: cascada de respaldo — intenta la dirección exacta y va bajando de
 * precisión hasta el centro de la colonia o del municipio. Marca la precisión de
 * cada resultado para que las aproximadas se revisen luego con el pin arrastrable.
 *
 * Respeta la política de uso de Nominatim: 1 petición/segundo y User-Agent con
 * contacto. No modifica el `status`: las propiedades siguen en borrador para
 * revisión humana antes de publicarse.
 *
 *   --dry-run    geocodifica y reporta, pero NO escribe en la BD.
 *   --limit=N    procesa como mucho N propiedades (para pruebas).
 *   --only-null  (por defecto) solo las que no tienen geo.
 */
import { pool } from '@tar/db';

const G = '\x1b[32m';
const Y = '\x1b[33m';
const R = '\x1b[31m';
const C = '\x1b[36m';
const D = '\x1b[90m';
const B = '\x1b[1m';
const X = '\x1b[0m';

const USER_AGENT = 'TAR-Portal-geocoder/1.0 (Sistemas@gbs-digital.com)';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const RATE_MS = 1100; // política Nominatim: máx. 1 req/segundo

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

type Row = {
  id: string;
  title: string;
  address: string | null;
  postal_code: string | null;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
};

type Hit = { lat: number; lng: number; precision: string; via: string };

// Quita el interior ("Int 3", "Int PH", "Int 1103") y entidades HTML: confunden
// a Nominatim y no aportan a la ubicación en el mapa.
function cleanStreet(address: string | null): string {
  if (!address) return '';
  return address
    .replace(/&amp;/gi, '&')
    .replace(/\s+int\.?\s+.*$/i, '')
    .replace(/\s+interior\s+.*$/i, '')
    .trim();
}

async function query(q: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM}?format=jsonv2&limit=1&countrycodes=mx&q=${encodeURIComponent(q)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { lat: string; lon: string }[];
      if (!json.length) return null;
      const lat = Number(json[0]!.lat);
      const lng = Number(json[0]!.lon);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      return { lat, lng };
    } catch {
      if (attempt === 0) await sleep(RATE_MS);
    }
  }
  return null;
}

// Cascada: de más preciso (calle+número) a menos (centro del municipio).
async function geocode(row: Row): Promise<Hit | null> {
  const street = cleanStreet(row.address);
  const { colonia, municipio, estado } = row;
  const levels: { parts: (string | null)[]; precision: string; via: string }[] =
    [
      { parts: [street, colonia, municipio, estado], precision: 'calle', via: 'calle+colonia+mun+estado' },
      { parts: [street, municipio, estado], precision: 'calle', via: 'calle+mun+estado' },
      { parts: [colonia, municipio, estado], precision: 'aproximada', via: 'centro de colonia' },
      { parts: [municipio, estado], precision: 'aproximada', via: 'centro de municipio' },
    ];

  for (const level of levels) {
    const q = level.parts.filter((p) => p && p.trim()).join(', ');
    if (!q) continue;
    const hit = await query(q);
    await sleep(RATE_MS);
    if (hit) return { ...hit, precision: level.precision, via: level.via };
  }
  return null;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1] ?? '', 10) : undefined;

  const { rows } = await pool.query<Row>(
    `select p.id, p.title, p.address, p.postal_code,
            l.colonia, l.municipio, l.estado
       from properties p
       left join locations l on l.id = p.location_id
      where p.geo is null
      order by p.created_at asc
      ${limit ? `limit ${limit}` : ''}`,
  );

  console.log(
    `${B}Geocodificación de propiedades sin ubicación${X} ${D}(Nominatim / OpenStreetMap)${X}`,
  );
  console.log(
    `${C}${rows.length}${X} propiedades a procesar` +
      (dryRun ? `  ${Y}[DRY-RUN: no se escribe]${X}` : '') +
      `  ${D}~${Math.ceil((rows.length * 2 * RATE_MS) / 1000)}s${X}\n`,
  );

  let exactas = 0;
  let aprox = 0;
  let fallidas = 0;
  const fallidasList: string[] = [];
  const aproxList: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const n = `${D}[${String(i + 1).padStart(3)}/${rows.length}]${X}`;
    const hit = await geocode(row);

    if (!hit) {
      fallidas++;
      fallidasList.push(row.title);
      console.log(`${n} ${R}✗${X} ${row.title.slice(0, 45)}  ${D}sin resultado${X}`);
      continue;
    }

    if (!dryRun) {
      await pool.query(
        `update properties
            set geo = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                updated_at = now()
          where id = $3`,
        [hit.lng, hit.lat, row.id],
      );
    }

    if (hit.precision === 'calle') {
      exactas++;
      console.log(
        `${n} ${G}✓${X} ${row.title.slice(0, 45).padEnd(45)} ${D}${hit.lat.toFixed(5)},${hit.lng.toFixed(5)}  ${hit.via}${X}`,
      );
    } else {
      aprox++;
      aproxList.push(row.title);
      console.log(
        `${n} ${Y}≈${X} ${row.title.slice(0, 45).padEnd(45)} ${D}${hit.lat.toFixed(5)},${hit.lng.toFixed(5)}  ${hit.via}${X}`,
      );
    }
  }

  console.log(`\n${B}Resumen${X}`);
  console.log(`  ${G}✓ exactas (nivel calle):${X} ${exactas}`);
  console.log(`  ${Y}≈ aproximadas (centro colonia/municipio):${X} ${aprox}`);
  console.log(`  ${R}✗ sin resultado:${X} ${fallidas}`);
  if (aproxList.length) {
    console.log(`\n${Y}Aproximadas — conviene afinar con el pin arrastrable:${X}`);
    aproxList.forEach((t) => console.log(`  ${D}·${X} ${t.slice(0, 60)}`));
  }
  if (fallidasList.length) {
    console.log(`\n${R}Sin resultado — requieren dirección manual:${X}`);
    fallidasList.forEach((t) => console.log(`  ${D}·${X} ${t.slice(0, 60)}`));
  }
  if (dryRun) {
    console.log(`\n${Y}DRY-RUN: no se escribió nada en la base de datos.${X}`);
  }

  await pool.end();
}

main().catch((err: unknown) => {
  console.error(`${R}✖ Error:${X}`, err);
  process.exit(1);
});
