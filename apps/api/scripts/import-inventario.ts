/**
 * Importador de inventario EasyBroker (§4.3). Idempotente por external_ref.
 *
 *   pnpm import:inventario <ruta.csv> [--dry-run] [--no-images] [--no-geo] [--limit=N]
 *
 * --dry-run   solo parsea y reporta (no escribe ni descarga).
 * --no-images no descarga imágenes.  --no-geo no geocodifica.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { pool } from '@tar/db';
import { runImport, type CsvRow } from '../src/jobs/importer';

const G = '\x1b[32m';
const Y = '\x1b[33m';
const R = '\x1b[31m';
const D = '\x1b[90m';
const B = '\x1b[1m';
const X = '\x1b[0m';

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((a) => !a.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const noImages = args.includes('--no-images');
  const noGeo = args.includes('--no-geo');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1] ?? '', 10) : undefined;

  if (!fileArg) {
    console.error(
      'Uso: pnpm import:inventario <ruta.csv> [--dry-run] [--no-images] [--no-geo] [--limit=N]',
    );
    process.exit(1);
  }

  // INIT_CWD = directorio donde el usuario invocó pnpm (cwd real).
  const baseDir = process.env.INIT_CWD ?? process.cwd();
  const path = resolve(baseDir, fileArg);
  const csv = readFileSync(path, 'utf8');
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
  }) as CsvRow[];

  console.log(
    `\n${B}📥 Importador EasyBroker${X} ${D}(${rows.length} filas${dryRun ? ', dry-run' : ''}${limit ? `, limit ${limit}` : ''})${X}\n`,
  );

  const r = await runImport(rows, { dryRun, noImages, noGeo, limit });

  console.log(`${B}Resumen${X}`);
  console.log(`  Filas procesadas:   ${r.total}`);
  console.log(`  ${G}Creadas:${X}            ${r.created}`);
  console.log(`  ${G}Actualizadas:${X}       ${r.updated}`);
  console.log(`  Disponibles:        ${r.disponible}`);
  console.log(`  Borrador (revisar): ${r.borrador}`);
  console.log(`  Con venta / renta:  ${r.withSale} / ${r.withRent}`);
  console.log(
    `  Imágenes:           ${r.imagesDownloaded} descargadas${r.deadImages ? `, ${r.deadImages} caídas` : ''}`,
  );
  console.log(`  Geocodificadas:     ${r.geocoded}`);
  console.log(
    `  Por tipo:           ${Object.entries(r.byType)
      .map(([t, n]) => `${t}:${n}`)
      .join('  ')}`,
  );

  if (r.warnings.length) {
    console.log(`\n${Y}Advertencias (${r.warnings.length}):${X}`);
    for (const w of r.warnings.slice(0, 15)) console.log(`  ${Y}·${X} ${w}`);
    if (r.warnings.length > 15)
      console.log(`  ${D}… y ${r.warnings.length - 15} más${X}`);
  }
  if (r.failed.length) {
    console.log(`\n${R}Fallidas (${r.failed.length}):${X}`);
    for (const f of r.failed.slice(0, 15))
      console.log(`  ${R}✗${X} ${f.ref}: ${f.reason}`);
  }
  console.log('');

  await pool.end();
  process.exit(r.failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error(`${R}Error fatal del importador:${X}`, e);
  await pool.end().catch(() => {});
  process.exit(1);
});
