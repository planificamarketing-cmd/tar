# ESTADO — Plataforma TAR Internacional

> **Partida guardada del proyecto.** Este archivo (+ `CLAUDE.md` + `git log`) es lo ÚNICO que se lee al iniciar sesión. NO releer el PRD, el plan ni el código completos: consultar solo la sección puntual que toque la tarea en curso. Se regenera (se sobrescribe) al final de cada sesión.

**Última actualización:** 2026-06-07 · sesión Fase 0
**Fase actual:** FASE 0 — Cimientos · **COMPLETA** (DoD cumplida) → siguiente FASE 1 · **Avance global:** ~12%

## Hecho
- Monorepo pnpm + Turborepo operativo: `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, ESLint + Prettier. **pnpm fijado a 9.15.9** vía `packageManager` (la 11.x de corepack exige Node 22; el repo corre en Node 20).
- BD local en Docker con `postgis/postgis:16-3.4` (`infra/docker-compose.yml`). Verificado: PostGIS 3.4.3 / PG16. Comandos `pnpm db:up` / `db:down`.
- `apps/api` (Express 5 + TS): env tipado con Zod (`src/env.ts`), logger pino, `errorHandler` central con formato `{ error: { code, message } }`, `helmet`/`cors`/`hpp`/`rate-limit`, **`GET /health`** que comprueba conectividad a PostGIS. Test supertest en verde (health + 404).
- `apps/web` (Next.js 14 App Router + Tailwind v3): página placeholder, tokens de marca base (rojo `#D2103E` confirmado). `output: standalone`, `transpilePackages: ['@tar/shared']`.
- `packages/db` (Drizzle + pg): cliente `db`/`pool`, `drizzle.config.ts`, runner de migración y seed (placeholders), comandos `db:generate`/`db:migrate`/`db:seed`.
- `packages/shared`: placeholder de esquemas Zod (se pueblan en Fase 1).
- `.env.example` completo (§12); CI GitHub Actions `lint → typecheck → build`; carpeta `design-reference/` con placeholder.
- **Verificado:** `pnpm install`, `lint`, `typecheck`, `build`, `test` en verde; `pnpm dev` levanta API con `/health` → `{ db: true, postgis: ... }`.

## En progreso
- _(ninguna — fase cerrada)_

## Siguiente (máx. 3)
1. **Iniciar FASE 1:** implementar esquema Drizzle completo (§4.1) en `packages/db/src/schema.ts` (users, properties con `geo` geography + índices, precios duales normalizados, leads, webhooks, api_keys, etc.).
2. Migración inicial + `db:seed` con 10 propiedades reales del CSV; definir esquemas Zod compartidos en `packages/shared` (§5).
3. Publicar el prototipo v3 en URL navegable (con rojo `#D2103E`) para revisión del cliente.

## Decisiones / desviaciones respecto al PRD
- 2026-06-07: **pnpm 9.15.9** (no la 11.x) por compatibilidad con Node 20. Sin impacto en el stack.
- 2026-06-07: API se empaqueta con **tsup** (CJS) y los paquetes `@tar/*` se exponen como fuente TS (inlined vía `noExternal`); web los transpila con `transpilePackages`. Evita un paso de build intermedio en los packages.
- 2026-06-07: `design-reference/` contiene solo un placeholder; copiar prototipo v3 + logo reales tras la firma (bloqueo de cliente).

## Bloqueos / pendientes del cliente
- Dominio definitivo (pendiente TAR)
- Firma del diseño v3 tras revisión (pendiente TAR) — prerequisito duro de la Fase B
- API keys: Google Maps, SendGrid, Cloudflare R2 (pendiente TAR)

## Cómo retomar
- `git log --oneline -15` para ver el avance real de código.
- Tareas marcadas `[x]` en `PLAN_EJECUCION_FASES.md` = fuente de verdad del checklist.
- Levantar: `pnpm db:up` (BD) + `pnpm dev` (api+web). Copiar `.env.example` → `.env` si no existe.
