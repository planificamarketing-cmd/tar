import { and, asc, eq, type SQL } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import type {
  CreateScriptInput,
  ScriptQuery,
  UpdateScriptInput,
} from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';

const { marketingScripts } = schema;

// Orden de placement para presentación agrupada (head → body → footer).
const placementOrder = { head: 0, body: 1, footer: 2 } as const;

export async function listScripts(q: ScriptQuery) {
  const c: SQL[] = [];
  if (q.placement) c.push(eq(marketingScripts.placement, q.placement));
  if (q.active !== undefined) c.push(eq(marketingScripts.isActive, q.active));
  const rows = await db
    .select()
    .from(marketingScripts)
    .where(c.length ? and(...c) : undefined)
    .orderBy(asc(marketingScripts.createdAt));
  // Orden estable por placement, luego por creación.
  return rows.sort(
    (a, b) => placementOrder[a.placement] - placementOrder[b.placement],
  );
}

// Scripts activos agrupados por placement, para la inyección en el sitio público
// (§7.1). Público (sin auth): solo expone name + code de los activos, ya que su
// finalidad es ejecutarse en el navegador de cualquier visitante.
export async function getActiveScriptsByPlacement() {
  const rows = await db
    .select({
      id: marketingScripts.id,
      name: marketingScripts.name,
      placement: marketingScripts.placement,
      code: marketingScripts.code,
    })
    .from(marketingScripts)
    .where(eq(marketingScripts.isActive, true))
    .orderBy(asc(marketingScripts.createdAt));

  const grouped: Record<'head' | 'body' | 'footer', { id: string; name: string; code: string }[]> = {
    head: [],
    body: [],
    footer: [],
  };
  for (const r of rows) {
    grouped[r.placement].push({ id: r.id, name: r.name, code: r.code });
  }
  return grouped;
}

export async function getScript(id: string) {
  const [row] = await db
    .select()
    .from(marketingScripts)
    .where(eq(marketingScripts.id, id))
    .limit(1);
  if (!row) throw new ApiError(404, 'not_found', 'Script no encontrado.');
  return row;
}

export async function createScript(input: CreateScriptInput) {
  const [row] = await db
    .insert(marketingScripts)
    .values({
      name: input.name,
      placement: input.placement,
      code: input.code,
      isActive: input.isActive,
    })
    .returning();
  return row!;
}

export async function updateScript(id: string, input: UpdateScriptInput) {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) set.name = input.name;
  if (input.placement !== undefined) set.placement = input.placement;
  if (input.code !== undefined) set.code = input.code;
  if (input.isActive !== undefined) set.isActive = input.isActive;

  const [row] = await db
    .update(marketingScripts)
    .set(set)
    .where(eq(marketingScripts.id, id))
    .returning();
  if (!row) throw new ApiError(404, 'not_found', 'Script no encontrado.');
  return row;
}

export async function deleteScript(id: string) {
  const deleted = await db
    .delete(marketingScripts)
    .where(eq(marketingScripts.id, id))
    .returning({ id: marketingScripts.id });
  if (!deleted.length)
    throw new ApiError(404, 'not_found', 'Script no encontrado.');
}
