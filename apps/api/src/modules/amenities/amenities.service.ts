import { asc, sql } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import type { CreateAmenityInput } from '@tar/shared';

const { amenities } = schema;

// Catálogo de amenidades (para el selector del backoffice y los filtros públicos).
export async function listAmenities() {
  return db
    .select({ id: amenities.id, name: amenities.name, icon: amenities.icon })
    .from(amenities)
    .orderBy(asc(amenities.name));
}

// Alta de amenidad (backoffice). Idempotente por nombre normalizado: si ya existe
// una con el mismo nombre (ignorando mayúsculas/acentos vía unaccent+lower), la
// devuelve en lugar de duplicarla.
export async function createAmenity(input: CreateAmenityInput) {
  const existing = await db
    .select({ id: amenities.id, name: amenities.name, icon: amenities.icon })
    .from(amenities)
    .where(sql`lower(${amenities.name}) = lower(${input.name})`)
    .limit(1);
  if (existing[0]) return existing[0];

  const [row] = await db
    .insert(amenities)
    .values({ name: input.name, icon: input.icon ?? null })
    .returning({ id: amenities.id, name: amenities.name, icon: amenities.icon });
  return row;
}
