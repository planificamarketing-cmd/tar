/**
 * Publica en lote las propiedades en `borrador` que ya cumplen los requisitos
 * (ubicación en el mapa + al menos un precio), tras el backfill de coordenadas.
 *
 *   pnpm --filter api publish:borrador [--dry-run] [--limit=N]
 *
 * Replica EXACTAMENTE lo que hace `publishProperty` (genera slug único, fija
 * status='disponible' y published_at), PERO **no emite el webhook
 * `property.published`**: se trata de hacer visible inventario que ya existía,
 * no de anunciar 105 altas nuevas a un CRM/n8n suscrito. Las validaciones de
 * geo y precio se comprueban aquí igual que en el servicio.
 *
 *   --dry-run   reporta qué se publicaría, sin escribir.
 *   --limit=N   procesa como mucho N (para pruebas).
 */
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db, pool, schema } from '@tar/db';
import { generateUniqueSlug } from '../src/lib/slug';

const { properties } = schema;
const G = '\x1b[32m';
const Y = '\x1b[33m';
const R = '\x1b[31m';
const D = '\x1b[90m';
const B = '\x1b[1m';
const X = '\x1b[0m';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1] ?? '', 10) : undefined;

  const rows = await db
    .select({
      id: properties.id,
      title: properties.title,
      slug: properties.slug,
      priceSale: properties.priceSale,
      priceRent: properties.priceRent,
      hasGeo: sql<boolean>`${properties.geo} IS NOT NULL`,
    })
    .from(properties)
    .where(and(eq(properties.status, 'borrador'), isNull(properties.deletedAt)))
    .limit(limit ?? 100000);

  console.log(
    `${B}Publicación en lote de borradores${X} ${D}(sin emitir webhooks)${X}`,
  );
  console.log(
    `${rows.length} candidatas` + (dryRun ? `  ${Y}[DRY-RUN]${X}` : '') + '\n',
  );

  let publicadas = 0;
  let saltadas = 0;

  for (let i = 0; i < rows.length; i++) {
    const p = rows[i]!;
    const n = `${D}[${String(i + 1).padStart(3)}/${rows.length}]${X}`;

    if (!p.hasGeo) {
      saltadas++;
      console.log(`${n} ${R}✗${X} ${p.title.slice(0, 45)}  ${D}sin geo${X}`);
      continue;
    }
    if (!p.priceSale && !p.priceRent) {
      saltadas++;
      console.log(`${n} ${R}✗${X} ${p.title.slice(0, 45)}  ${D}sin precio${X}`);
      continue;
    }

    const slug = p.slug ?? (await generateUniqueSlug(p.title, p.id));

    if (!dryRun) {
      await db
        .update(properties)
        .set({
          slug,
          status: 'disponible',
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(properties.id, p.id));
    }

    publicadas++;
    console.log(`${n} ${G}✓${X} ${p.title.slice(0, 42).padEnd(42)} ${D}/${slug}${X}`);
  }

  console.log(`\n${B}Resumen${X}`);
  console.log(`  ${G}✓ publicadas:${X} ${publicadas}`);
  if (saltadas) console.log(`  ${R}✗ saltadas (sin geo/precio):${X} ${saltadas}`);
  if (dryRun) console.log(`\n${Y}DRY-RUN: no se escribió nada.${X}`);

  await pool.end();
}

main().catch((err: unknown) => {
  console.error(`${R}✖ Error:${X}`, err);
  process.exit(1);
});
