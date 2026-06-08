# Arquitectura — Plataforma TAR Internacional

## 1. Qué es
Un **portal inmobiliario** con dos caras:
- **Sitio público** (Fase B): catálogo navegable e indexable (SEO), mapa, fichas,
  formularios de contacto/cita.
- **Panel de administración / backoffice** (Fase C): donde el equipo de TAR publica
  propiedades, gestiona prospectos (leads), usuarios, scripts de marketing y webhooks.

Ambas caras hablan con una **API REST** central respaldada por una base de datos
**PostgreSQL + PostGIS** (geográfica).

## 2. Stack (versiones exactas)
| Capa | Tecnología |
|---|---|
| Base de datos | **PostgreSQL 16 + PostGIS 3.4** (en Docker) |
| API | **Node 20 · Express 5 · TypeScript** estricto |
| ORM / migraciones | **Drizzle ORM** + `pg` |
| Cola de trabajos | **pg-boss** (sobre la misma BD; entrega de webhooks) |
| Validación | **Zod** (esquemas compartidos en `packages/shared`) |
| Imágenes | **sharp** (re-encode a WebP) · almacenamiento local en disco |
| Email | **SendGrid** |
| Frontend | **Next.js 14 (App Router) + React 18 + Tailwind v3** |
| Datos en cliente | TanStack Query v5 |
| Mapa (producción) | Google Maps + supercluster |
| Pruebas | **Vitest + Supertest** (+ Playwright/Lighthouse en QA) |
| Docs API | OpenAPI 3.0 (zod-to-openapi) + Swagger UI en `/docs` |

> Sin vendor lock-in: todo open-source y autoalojado. **No** se usa Supabase, Redis,
> Prisma ni S3 (decisiones del PRD).

## 3. Estructura del repositorio (monorepo pnpm + Turborepo)
```
apps/
  api/      API Express 5  (modules/ middleware/ lib/ jobs/ scripts/ openapi/)
  web/      Next.js 14     (sitio público + panel admin)
packages/
  db/       Esquema Drizzle + migraciones + seed
  shared/   Esquemas Zod + tipos compartidos (API ↔ Web)
infra/      docker-compose (BD + visor pgweb)
design-reference/  Prototipo v3 (referencia de diseño, pendiente de firma)
docs/       Esta documentación + reportes + openapi.json + ERD + schema.sql
data/       Datos del cliente (CSV real, PII) — fuera de git
```
**Capas de la API:** `rutas → controlador → servicio → BD`. La lógica vive en el
*servicio*; el controlador solo valida (Zod) y responde.

## 4. Cómo encajan las piezas (flujo)
1. El **sitio público** (o el **panel**) hace peticiones a la **API** (`/api/v1/...`).
2. La API **valida** la entrada con Zod, aplica **seguridad** (JWT/roles/rate-limit) y
   ejecuta la lógica en el **servicio**, que consulta **PostgreSQL/PostGIS**.
3. Acciones de negocio **emiten eventos** (`lead.created`, `property.published`, …).
4. Un evento **encola** la entrega de **webhooks** (pg-boss): se firma el payload
   (HMAC-SHA256) y se hace POST al sistema del cliente, con reintentos.
5. Sistemas externos pueden **actualizar** datos vía webhook entrante (`/webhooks/inbound`)
   con una **llave de API** y permisos.
6. Las **imágenes** se suben, se re-optimizan a WebP y se sirven desde disco (en
   producción, vía Caddy).

## 5. Modelo de datos (resumen)
14 tablas. Núcleo: `properties` (con `geo` geography, **precios duales** venta/renta
en MXN/USD + columnas normalizadas a MXN para filtrar, **búsqueda full-text** en
español), `locations`, `amenities`, `property_images`, `leads` (+ `lead_events`),
`users` (+ `refresh_tokens`), `webhook_subscriptions`/`webhook_deliveries`/`api_keys`,
`property_events`, `marketing_scripts`. Detalle: [ERD.md](ERD.md) · [schema.sql](schema.sql).

## 6. Seguridad
- Contraseñas con **argon2**; sesión con **JWT de acceso (15m)** + **refresh rotativo
  (7d)** hasheado en BD y revocable.
- **Roles**: `admin` / `editor`. Middlewares `requireAuth` / `requireRole`.
- **helmet**, **CORS** (whitelist), **hpp**, **rate-limit** (global + estricto en login
  y captación de leads). Queries **parametrizadas** (sin SQL injection).
- Webhooks salientes **firmados (HMAC-SHA256)**; entrantes con **llave de API + scopes**.
- Secretos solo en `.env` (nunca en el repo). Borrado **suave** (soft delete) de
  propiedades y leads.

## 7. Paridad desarrollo ↔ producción
La BD de desarrollo usa la **misma imagen** que producción (`postgis/postgis:16-3.4`)
vía Docker. Migrar al VPS = clonar repo + crear `.env` de prod + desplegar; el código
no cambia, solo el entorno. Finales de línea LF forzados; imports con mayúsculas
exactas (Linux es case-sensitive).

## 8. Decisiones clave (ADR resumido)
- **PostgreSQL dedicado** (no Supabase) para no duplicar auth/API/storage ni consumir
  RAM del VPS (ADR-001 del PRD).
- **Almacenamiento local** abstraído (`lib/storage`) para que un futuro S3 sea adenda.
- **Eventos desacoplados** (`lib/events`) → la cola pg-boss se puede cambiar sin tocar
  los emisores.
- Decisiones de producto del cliente (rol `editor`, pipeline de leads, etc.) en
  `ESTADO.md` → *Decisiones*.
