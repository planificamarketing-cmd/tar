import { asc } from 'drizzle-orm';
import { db, schema } from '@tar/db';

const { locations } = schema;

// Catálogo de ubicaciones ya existentes (estado/municipio/colonia) para alimentar
// los autocompletados en cascada del backoffice y, más adelante, los filtros del
// sitio público. Cada terna es única (locations_unique_idx), así que no hace falta
// DISTINCT; el frontend deriva estados/municipios/colonias y filtra sin acentos.
export async function listLocations() {
  return db
    .select({
      estado: locations.estado,
      municipio: locations.municipio,
      colonia: locations.colonia,
    })
    .from(locations)
    .orderBy(asc(locations.estado), asc(locations.municipio), asc(locations.colonia));
}
