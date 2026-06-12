import { asc } from 'drizzle-orm';
import { db, schema } from '@tar/db';

const { amenities } = schema;

// Catálogo de amenidades (para el selector del backoffice y los filtros públicos).
export async function listAmenities() {
  return db
    .select({ id: amenities.id, name: amenities.name, icon: amenities.icon })
    .from(amenities)
    .orderBy(asc(amenities.name));
}
