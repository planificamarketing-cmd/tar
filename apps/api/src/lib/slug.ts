import { eq } from 'drizzle-orm';
import { db, schema } from '@tar/db';

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

// Genera un slug único para properties.slug. `excludeId` permite re-publicar
// la misma propiedad sin colisionar consigo misma.
export async function generateUniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base) || 'propiedad';
  let candidate = root;
  let n = 1;
  for (;;) {
    const [hit] = await db
      .select({ id: schema.properties.id })
      .from(schema.properties)
      .where(eq(schema.properties.slug, candidate))
      .limit(1);
    if (!hit || hit.id === excludeId) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}
