# PRD — Plataforma Inmobiliaria TAR Internacional

> Documento maestro de requerimientos técnicos. Es la **fuente única de verdad** del proyecto.
> Si algo no está aquí, está **fuera de alcance** (ver Política de Control de Cambios, §13).
> Stack contratado: **PERN + Next.js 14**. Inversión: **$115,000 MXN** (esquema en §12 del documento comercial).

---

## 0. Cómo usar este PRD

1. Coloca en la raíz del repo: este archivo, `PLAN_EJECUCION_FASES.md`, `SETUP_SERVIDOR_UBUNTU.md`, `ESTADO.md` y `.gitignore`.
2. Trabaja **fase por fase** siguiendo `PLAN_EJECUCION_FASES.md`. No avances de fase hasta cumplir la *Definición de Hecho* (DoD).
3. Toda funcionalidad debe mapear a una sección de este PRD. Si no mapea, es cambio de alcance.
4. Las **métricas de rendimiento (§9)** son condición contractual de entrega. El código fuente **no se libera** hasta alcanzarlas en producción.

---

## 1. Objetivo del producto

Construir un portal inmobiliario de alto rendimiento, indexable por Google, con:
- Catálogo de propiedades con búsqueda en tiempo real y filtros combinados.
- Mapa interactivo con *clustering* y búsqueda por desplazamiento.
- Captación de *leads* con disparo de *webhooks* a CRMs externos.
- Panel de administración (backoffice) autónomo para el equipo del cliente.
- Propiedad intelectual 100% transferible, sin *vendor lock-in*.

**No-objetivos (fuera de alcance):** app móvil nativa, pasarela de pagos, firma de contratos digital, multi-idioma, multi-tenant, integración profunda con un CRM específico (solo webhooks genéricos), **botón de WhatsApp dinámico**, **asignación de agentes a propiedades** y **sincronización continua con EasyBroker** (excluidos por decisión del cliente; un botón de WhatsApp simple puede insertarse vía Gestor de Scripts sin desarrollo, y el importador EB puede re-ejecutarse manualmente).

---

## 2. Stack tecnológico (versiones exactas)

| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| BD | PostgreSQL + PostGIS | 16 / 3.4 | Imagen Docker `postgis/postgis:16-3.4` |
| Runtime | Node.js | 20 LTS | `.nvmrc` = `20` |
| API | Express | 5.x | TypeScript estricto |
| ORM | Drizzle ORM + `pg` (node-postgres) | drizzle ≥0.30 | PostGIS vía SQL crudo (operador `sql`) |
| Cola/Webhooks | pg-boss | ≥9 | Cola respaldada en PostgreSQL (sin Redis, mantiene el VPS ligero) |
| Validación | Zod | ≥3.23 | Esquemas compartidos en `packages/shared` |
| Auth | jsonwebtoken + argon2 | — | Access 15 min + refresh rotativo 7 días |
| Docs API | @asteasolutions/zod-to-openapi + swagger-ui-express | — | OpenAPI 3.0 generado desde Zod |
| Seguridad | helmet, cors, express-rate-limit, hpp | — | Ver §8 |
| Imágenes | sharp | ≥0.33 | Conversión a WebP + responsive sizes |
| Almacenamiento | Disco local del VPS (Hostinger) | — | Volumen Docker `/srv/tar/media`; Caddy lo sirve como estático con caché agresivo. `lib/storage` abstraído por driver (migrar a S3 sería adenda, no reescritura) |
| Frontend | React + Next.js (App Router) | 18 / 14 | SSR/SSG/ISR |
| Data fetching FE | TanStack Query | v5 | Buscador en tiempo real |
| Mapas | @vis.gl/react-google-maps + supercluster | — | Clustering en cliente; Google Maps Platform (cuenta del cliente) |
| Estilos | Tailwind CSS | v3 | JIT, purge agresivo para performance |
| Email | @sendgrid/mail | v8 | Email transaccional (notificación de leads) |
| Logging | pino + pino-http | — | JSON logs estructurados |
| Testing | Vitest, Supertest, Playwright, Lighthouse CI | — | Ver §10 |
| Lint/Format | ESLint + Prettier | — | Config compartida |
| Monorepo | pnpm workspaces + Turborepo | pnpm ≥9 | `turbo` para build/test paralelos |
| Deploy | Docker Compose + Caddy | — | TLS automático; ver §11 |

**Restricción dura:** todo es open-source, sin licencias propietarias. Cualquier desarrollador Node.js/React debe poder mantenerlo.

### 2.1 ADR-001 — Base de datos: PostgreSQL dedicado vs Supabase self-hosted

**Decisión: PostgreSQL 16 + PostGIS en contenedor dedicado. NO usar Supabase self-hosted.**

| Criterio | PostgreSQL dedicado (elegido) | Supabase self-hosted (descartado) |
|---|---|---|
| Contenedores en el VPS | 1 (`postgis/postgis:16-3.4`) | ~12 (Kong, GoTrue, PostgREST, Realtime, Storage, Studio, imgproxy, Vector, etc.) |
| RAM consumida en el VPS de 8GB | ~1–2 GB, deja recursos a Next.js + API | 4 GB+ solo para la pila Supabase, compitiendo con Next.js + Express |
| Duplicación funcional | Ninguna | Total: GoTrue duplica nuestro auth JWT, PostgREST duplica la API Express (contractual), Storage duplica nuestro almacenamiento local+sharp, Realtime no se usa |
| Cumplimiento de TTFB <600ms / Lighthouse ≥90 | Directo (menos saltos, más RAM libre) | En riesgo por contención de memoria |
| Mantenibilidad ("cualquier dev Node.js/React") | Estándar de industria | Requiere conocer la operación de la pila Supabase (upgrades multi-servicio, Kong, claves JWT propias) |
| Imagen PostGIS | Oficial, directa | Imagen Postgres custom de Supabase; PostGIS posible pero acoplado a su pipeline de upgrades |
| Respaldos / restore <2h | `pg_dump` simple, documentado | Restore implica re-orquestar 12 servicios y secretos |

**Justificación:** Supabase aporta valor cuando se usan sus servicios (Auth, PostgREST, Realtime, Storage) *en lugar de* construir un backend. Este proyecto **ya contrató** una API Express 5 con JWT, almacenamiento propio y procesamiento sharp; añadir Supabase duplicaría cada capa, consumiría la mitad de la RAM del VPS y complicaría la promesa contractual de independencia del proveedor. Supabase self-hosted queda documentado como alternativa evaluada y descartada.

**Consecuencia:** la BD corre como un servicio Docker estándar con volumen persistente, respaldada por `pg_dump` (§14) y administrable por cualquier DBA/dev PostgreSQL.

---

## 3. Arquitectura y estructura de repositorio

Monorepo desacoplado: API REST independiente del frontend (escalan por separado).

```
tar-internacional/
├── apps/
│   ├── api/                 # Express 5 + TS (backend REST)
│   │   ├── src/
│   │   │   ├── modules/     # auth, properties, leads, webhooks, media, admin, users, scripts
│   │   │   │   └── <mod>/   # *.routes.ts | *.controller.ts | *.service.ts | *.schema.ts
│   │   │   ├── middleware/  # auth, errorHandler, rateLimit, validate
│   │   │   ├── lib/         # db, storage, mailer, queue, openapi, logger
│   │   │   ├── jobs/        # workers pg-boss (webhook delivery)
│   │   │   ├── app.ts       # ensamblado Express
│   │   │   └── server.ts    # bootstrap
│   │   └── tests/
│   └── web/                 # Next.js 14 App Router + TS
│       ├── app/
│       │   ├── (public)/    # home, listado, detalle, buscar
│       │   ├── (admin)/admin/  # backoffice (route group protegido)
│       │   ├── api/         # route handlers BFF si se requiere
│       │   ├── sitemap.ts   # sitemap dinámico
│       │   └── robots.ts
│       ├── components/
│       ├── lib/             # api-client, query-client, auth
│       └── tests/
├── packages/
│   ├── db/                  # esquema Drizzle + migraciones + seed
│   └── shared/              # Zod schemas, tipos, constantes compartidas API<->Web
├── infra/
│   ├── docker-compose.yml
│   ├── Caddyfile
│   └── backup/              # script pg_dump + tar de media, rotación 30 días
├── docs/                    # entregables §15 (OpenAPI, ERD, manuales, README deploy)
├── .github/workflows/       # CI: lint, test, lighthouse
├── turbo.json
├── pnpm-workspace.yaml
├── .gitignore
├── ESTADO.md                # "partida guardada" del avance (se regenera cada sesión)
├── PRD_Plataforma_TAR.md
├── PLAN_EJECUCION_FASES.md
└── SETUP_SERVIDOR_UBUNTU.md
```

**Reglas de capas (API):** `routes → controller → service → db`. La lógica de negocio vive en `service`. Los `controller` solo orquestan. Validación con Zod en `middleware/validate` antes del controller.

---

## 4. Modelo de datos (PostgreSQL 16 + PostGIS)

Diseño normalizado. Tipos geográficos `geography(Point,4326)`. Índices GIN para filtros combinados, índice GiST para geometría.

### 4.1 Tablas

**users** — operadores del backoffice
- `id` uuid PK, `email` citext unique, `password_hash` text, `name` text
- `role` enum(`admin`,`broker`), `is_active` bool, `created_at`, `updated_at`

**refresh_tokens** — rotación de sesión
- `id` uuid PK, `user_id` FK→users, `token_hash` text, `expires_at`, `revoked_at` null, `created_at`

**locations** — catálogo geográfico (estado/municipio/colonia)
- `id` uuid PK, `estado` text, `municipio` text, `colonia` text, `slug_estado`, `slug_colonia`
- unique(`estado`,`municipio`,`colonia`)

**properties** — núcleo del catálogo (modelado sobre el inventario real EasyBroker, §4.3)
- `id` uuid PK, `slug` text unique (ej. `casa-3-recamaras-polanco`), `external_ref` text unique null (id público EB, trazabilidad de la migración)
- `title` text, `description` text, `property_type` enum(`casa`,`departamento`,`oficina`,`local_comercial`,`bodega_industrial`,`terreno_industrial`,`edificio`,`terreno`) ← tipos presentes en el inventario actual
- **Precios duales** (una propiedad puede ofrecerse en venta, renta o ambas): `price_sale` numeric(14,2) null + `currency_sale` char(3), `price_rent` numeric(14,2) null + `currency_rent` char(3). El inventario actual maneja **MXN y USD**.
- Columnas normalizadas para filtrar/ordenar: `price_sale_mxn`, `price_rent_mxn` (calculadas al guardar con `USD_MXN_RATE` del env; el display siempre usa el precio y moneda originales). **Decisión de UX (✔ aprobada):** un solo slider de precio en MXN que incluye las propiedades en USD convertidas internamente — práctica estándar de portales mexicanos; el usuario nunca ve precios convertidos ni elige moneda para filtrar, y la tasa solo afecta dónde cae una propiedad USD dentro del rango, no su precio mostrado.
- `bedrooms` int, `bathrooms` int, `half_bathrooms` int (medios baños, campo real de EB), `parking` int, `floor` text null (nivel/piso en departamentos y oficinas), `area_m2` numeric(10,2), `lot_m2` numeric(10,2)
- `location_id` FK→locations, `address` text, `postal_code` text, `geo` geography(Point,4326)
- `status` enum(`borrador`,`disponible`,`apartado`,`rentado`,`vendido`,`pausado`) default `borrador`  ← estatus de inmueble del CMS. Visibles en sitio público: `disponible` y `apartado` (con badge); el resto no se lista.
- `featured` enum(`normal`,`destacada`,`premium`) default `normal`  ← posicionamiento premium (§6.4)
- `published_at` null, `created_by` FK→users, `created_at`, `updated_at`
- **Índices:** btree compuestos para filtros escalares (`status`+`property_type`+`price_sale_mxn`, `status`+`property_type`+`price_rent_mxn`, `bedrooms`, `featured`+`published_at`), **GIN full-text** (`tsvector` en español sobre `title`+`description`, cubre el filtro `q`), GiST sobre `geo`, btree único sobre `slug` y `external_ref`. *Nota: GIN sobre columnas escalares requeriría `btree_gin`; la combinación btree+GIN-fulltext cumple el compromiso contractual de "índices GIN para filtros masivos" de forma técnicamente correcta.*

**amenities** — catálogo (`alberca`, `gym`, `seguridad`, etc.)
- `id` uuid PK, `name` text unique, `icon` text

**property_amenities** — N:M
- `property_id` FK, `amenity_id` FK, PK compuesta

**property_images**
- `id` uuid PK, `property_id` FK, `url_webp` text, `url_thumb` text, `alt` text, `position` int, `width` int, `height` int, `is_cover` bool
- index(`property_id`,`position`)

**leads** — captación (contacto y citas)
- `id` uuid PK, `property_id` FK null, `name` text, `email` text, `phone` text, `message` text
- `type` enum(`contacto`,`cita`) default `contacto`, `preferred_at` timestamptz null (fecha/hora deseada de la cita)
- `source` text (utm/referrer), `utm` jsonb, `status` enum(`nuevo`,`contactado`,`calificado`,`descartado`,`cerrado`) default `nuevo`
- `assigned_to` FK→users null, `consent_at` timestamptz (consentimiento LFPDPPP), `created_at`, `updated_at`

**lead_events** — bitácora de estatus/asignación
- `id` uuid PK, `lead_id` FK, `type` text, `payload` jsonb, `user_id` FK null, `created_at`

**webhook_subscriptions** — destinos externos (Zapier/HubSpot/Salesforce/genérico)
- `id` uuid PK, `name` text, `target_url` text, `secret` text, `events` text[] — catálogo de eventos: `lead.created`, `lead.status_changed`, `property.published`, `property.status_changed`
- `is_active` bool, `created_at`, `updated_at`

**webhook_deliveries** — bitácora + reintentos (gestionada por pg-boss)
- `id` uuid PK, `subscription_id` FK, `event` text, `payload` jsonb, `status` enum(`pendiente`,`entregado`,`fallido`), `attempts` int, `last_error` text, `response_code` int, `created_at`, `delivered_at` null

**api_keys** — webhooks entrantes (integraciones de terceros, §5.5)
- `id` uuid PK, `name` text, `key_hash` text, `scopes` text[] (`leads:write`,`properties:write`), `is_active` bool, `last_used_at`, `created_at`

**property_events** — analítica básica (§6.6)
- `id` uuid PK, `property_id` FK, `type` enum(`view`), `meta` jsonb, `created_at` (enum extensible para futuros eventos vía adenda)
- index(`property_id`,`type`,`created_at`)

**marketing_scripts** — Gestor de scripts/etiquetas (§6.5)
- `id` uuid PK, `name` text, `placement` enum(`head`,`body`,`footer`), `code` text, `is_active` bool, `created_at`, `updated_at`
  - `head`: GTM, píxeles Meta/Google · `body` (inicio): widgets de soporte, WhatsApp flotante, chats · `footer`: analítica secundaria, feedback

### 4.2 Reglas de integridad
- `slug` se genera al publicar; inmutable tras la primera publicación (preserva SEO/URLs indexadas).
- Borrado de propiedades = *soft delete* vía `status` o columna `deleted_at` (no hard delete; preserva leads históricos).
- `geo` obligatorio para que la propiedad aparezca en el mapa; opcional en `borrador`.

---

### 4.3 Migración del inventario actual (EasyBroker → plataforma)

El cliente opera hoy con **105 propiedades** exportadas de EasyBroker (`INVENTARIO DE PROPIEDADES.csv`: 35 en venta, 70 en renta; CDMX, Edomex y Querétaro; ~11 imágenes por propiedad alojadas en `assets.easybroker.com`). La migración es **parte del alcance** mediante un importador idempotente (`pnpm import:inventario`):

| Columna CSV | Destino | Transformación |
|---|---|---|
| id público (EB) | `external_ref` | Clave de idempotencia: re-ejecutar actualiza, no duplica |
| título / descripción | `title` / `description` | Limpieza de espacios |
| precio/moneda de venta y renta | `price_sale/currency_sale`, `price_rent/currency_rent` | Parseo `$4,350,000.00` → numeric; normalizados a MXN |
| tipo de propiedad | `property_type` | Mapeo directo (Casa→casa, Bodega industrial→bodega_industrial, etc.) |
| baños / medios baños | `bathrooms` / `half_bathrooms` | int; vacío → null |
| piso, estacionamientos, m² construcción/terreno | `floor`, `parking`, `area_m2`, `lot_m2` | Cast |
| calle + número ext/int + CP + colonia + ciudad + estado | `address`, `postal_code`, `locations` | Crea/reusa `locations`; **geocodifica con Google Geocoding API** → `geo`. Fallos de geocoding quedan en `borrador` con bandera para fijar el pin manualmente en el admin (`LocationPicker`) |
| características | `property_amenities` | Split por coma → match difuso contra catálogo `amenities`; las no existentes se crean |
| imágenes (URLs EB) | `property_images` | Descarga → sharp re-encode WebP + thumb → volumen de media local. Reporte de URLs caídas |
| columna `0` | `bedrooms` | **Encabezado roto del export: es recámaras** (✔ confirmado por el cliente; valores 1–4, presente solo en departamentos y casas) |

**Reglas:** importación a estatus `disponible` cuando geocoding e imágenes son exitosos, `borrador` si requieren revisión; reporte final (importadas / con advertencias / fallidas). La **corrida definitiva** se hace en el Lanzamiento con un CSV fresco del cliente — el inventario habrá cambiado entre hoy y el go-live.

**Relación con EasyBroker post-lanzamiento (definido por el cliente):** TAR seguirá usando EasyBroker en paralelo, pero **la plataforma TAR es la principal** y la captura cotidiana se hace en el nuevo CMS. **NO hay sincronización continua ni bidireccional** (no-objetivo, §1). Si el cliente quisiera refrescar desde EB en el futuro, puede re-ejecutarse el importador manualmente con un CSV nuevo (es idempotente por `external_ref`), entendiendo que sobrescribe los campos importados; una sincronización automática sería adenda.

---

## 5. API REST (Express 5) — contrato de endpoints

Base: `/api/v1`. Respuestas JSON. Errores con formato `{ error: { code, message, details? } }`. Paginación: `?page=&limit=` (límite máx 50) con `{ data, meta: { page, limit, total } }`. Toda mutación admin requiere JWT + rol.

### 5.1 Auth (`/auth`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/login` | — | email+password → access (15m) + refresh (cookie httpOnly o body) |
| POST | `/auth/refresh` | refresh | Rota refresh token, emite nuevo access |
| POST | `/auth/logout` | refresh | Revoca refresh token |
| GET | `/auth/me` | access | Datos del usuario autenticado |

### 5.2 Propiedades (`/properties`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/properties` | — | Listado público. Filtros: `operation` (venta\|renta — selecciona qué precio aplica), `type, minPrice, maxPrice` (slider; opera sobre `price_*_mxn` normalizado), `bedrooms, bathrooms, parking, minArea, maxArea` (construcción m²), `minLot, maxLot` (terreno m²), `amenities[], colonia, q`. Param `sort`: `relevancia` (default, premium primero), `precio_asc`, `precio_desc` (sobre normalizado MXN), `recientes`. Display siempre en moneda original (MXN/USD). |
| GET | `/properties/map` | — | Datos ligeros para clustering: `{id, slug, lat, lng, price, currency, featured}` donde `price/currency` corresponden a la operación filtrada (venta\|renta) en moneda original — alimenta el *price-pill* del marcador. Acepta `bbox` (búsqueda por desplazamiento) y los mismos filtros del listado. |
| GET | `/properties/:slug` | — | Detalle público (incluye imágenes + amenidades). |
| POST | `/properties` | admin/broker | Crear (status `borrador`). |
| PATCH | `/properties/:id` | admin/broker | Actualizar campos. |
| POST | `/properties/:id/publish` | admin/broker | Publica (genera slug, valida `geo` y campos requeridos; status → `disponible`; emite `property.published`). |
| PATCH | `/properties/:id/status` | admin/broker | Cambia estatus comercial (disponible/apartado/rentado/vendido/pausado); emite `property.status_changed`. |
| DELETE | `/properties/:id` | admin | Soft delete. |

### 5.3 Media (`/media`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/properties/:id/images` | admin/broker | Sube imagen(es), sharp→WebP + thumb, guarda en el volumen de media del VPS, registra en `property_images`. |
| PATCH | `/properties/:id/images/:imgId` | admin/broker | Reordenar / set cover / alt. |
| DELETE | `/properties/:id/images/:imgId` | admin/broker | Elimina del disco + BD. |

### 5.4 Leads (`/leads`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/leads` | — | Captación pública (`type`: `contacto` o `cita` con `preferred_at`). Rate-limit estricto + honeypot anti-spam + consentimiento LFPDPPP. Dispara evento `lead.created` (webhooks + email). |
| POST | `/events/track` | — | Registra eventos de analítica (`view`) en `property_events`. Rate-limited, payload mínimo. |
| GET | `/leads` | admin/broker | Listado filtrable por status/property/assigned. |
| GET | `/leads/:id` | admin/broker | Detalle + `lead_events`. |
| PATCH | `/leads/:id` | admin/broker | Cambiar status / asignar → registra `lead_event` y dispara `lead.status_changed`. |

### 5.5 Webhooks (`/webhooks`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET/POST | `/webhooks/subscriptions` | admin | Listar/crear destinos. |
| PATCH/DELETE | `/webhooks/subscriptions/:id` | admin | Editar/eliminar. |
| GET | `/webhooks/deliveries` | admin | Bitácora de entregas + reintentos. |
| POST | `/webhooks/deliveries/:id/retry` | admin | Reencolar entrega fallida. |
| POST | `/webhooks/inbound` | API key | **Webhooks entrantes**: terceros (CRM, Zapier) actualizan estatus de leads o propiedades. Header `X-API-Key` (hash en `api_keys`, con scopes). Acciones: `lead.update_status`, `property.update_status`. Validación Zod + bitácora. |
| GET/POST/DELETE | `/webhooks/api-keys` | admin | Gestión de llaves para webhooks entrantes (la llave solo se muestra al crearla). |

**Entrega:** cada evento encola un job en pg-boss. El worker firma el payload (HMAC SHA-256 con `secret`, header `X-TAR-Signature`), hace POST al `target_url`, reintenta con *backoff* exponencial (5 intentos: 30s, 2m, 10m, 1h, 6h). Estado final en `webhook_deliveries`.

### 5.6 Usuarios y Scripts (admin)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET/POST/PATCH/DELETE | `/users` | admin | CRUD de operadores (admin/broker). |
| GET/POST/PATCH/DELETE | `/scripts` | admin | CRUD de scripts de marketing (GTM, Meta Pixel). |

### 5.7 Documentación y utilidades
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/docs` | — | Swagger UI (OpenAPI 3.0 generado desde Zod). |
| GET | `/health` | — | Healthcheck (`{status, db, queue}`). |

---

## 6. Reglas de negocio clave

**6.1 Búsqueda en tiempo real:** los filtros se aplican vía query params; el frontend usa TanStack Query con *debounce* (300ms) y `keepPreviousData`. Sin recarga de página.

**6.2 Búsqueda geoespacial:** `/properties/map` consulta `ST_Within(geo, ST_MakeEnvelope(bbox))` (SQL crudo Drizzle). El *clustering* se calcula en cliente con supercluster a partir de los puntos del bbox.

**6.3 SEO por propiedad:** cada propiedad publicada tiene URL única `/propiedades/{slug_estado}/{slug_colonia}/{slug}`. Renderizada con SSG+ISR (revalidate 3600s). Metadatos dinámicos + Open Graph + JSON-LD `RealEstateListing`.

**6.4 Posicionamiento premium:** ordenamiento por `featured` (`premium` > `destacada` > `normal`), luego por criterio secundario (relevancia de filtros o `published_at` DESC). Aplica en listado y mapa.

**6.5 Gestor de scripts:** los scripts activos en `marketing_scripts` se inyectan en su `placement` (`head` / `body` inicio / `footer`) del layout público de Next.js, sin tocar código (autonomía del cliente).

**6.6 Analítica básica (dashboard):** vistas de ficha (`view`, registrado server-side en el detalle o vía `/events/track`) alimentan el dashboard del backoffice: visualizaciones por propiedad y leads recientes. Sin herramientas externas; la analítica avanzada (incl. clics) se cubre con GTM vía el gestor de scripts.

**6.7 Anti-spam y cumplimiento de leads:** rate-limit por IP + campo *honeypot* + validación Zod. Sin CAPTCHA en v1 (fuera de alcance salvo adenda). **Cumplimiento LFPDPPP (México):** el `LeadForm` incluye casilla de consentimiento con enlace al Aviso de Privacidad (`/aviso-privacidad`); el consentimiento y su timestamp se guardan en `leads.utm`/`consent_at`. El texto del aviso lo provee el cliente.

---

## 7. Frontend (Next.js 14 App Router)

### 7.0 Sistema de diseño (propuesta v3 — PENDIENTE de aprobación del cliente)

La propuesta de diseño vigente es el **prototipo v3** (referencia de diseño en `design-reference/`). **No está aprobado**: debe presentarse a TAR como prototipo interactivo navegable, recibir sus correcciones (hasta 3 rondas formales, §13) y firmarse en la Fase 1. Hasta entonces, los tokens y mapeos de esta sección son la *propuesta base*, no la referencia final. Los archivos fuente se versionan en el repo bajo `design-reference/`: `TAR_Internacional_v3.html` (tokens + shell), `v3-ui.jsx` (componentes), `v3-pages.jsx` (Home, Listado, Mapa, Detalle), `v3-admin.jsx` (backoffice), `v3-content.jsx` (contenido), `assets/tar-logo.svg`.

**Tokens propuestos (se portan a `tailwind.config` como única fuente de verdad SOLO tras la firma del diseño):**

| Token | Valor | Uso |
|---|---|---|
| `--tar` | `#D2103E` | Rojo primario de marca (tomado del logo, ✔ confirmado por el cliente) — CTAs, acentos, badge "Nuevo" |
| `--tar-dark` | `#A80D32` | Hover/estados del primario (derivado de `#D2103E`) |
| `--dark` | `#0F1B2D` | Azul-marino: header, footer, price-pills del mapa, texto de alto contraste |
| `--text` / `--muted` | `#374151` / `#6B7280` | Texto cuerpo / secundario |
| `--border` / `--bg` | `#E5E5E4` / `#FAFAF8` | Bordes / fondo cálido |
| Premium (gradiente) | `#E4C66A → #BE8C3C` | Badge dorado de propiedades Premium |
| `--display` | **Fraunces** (serif) | Titulares |
| `--sans` | **Inter** | UI y cuerpo |
| `--mono` | **DM Mono** | Cifras/precios |

**Proceso de aprobación:** (1) publicar el prototipo v3 en una URL navegable para que TAR interactúe con él (es HTML autocontenido; un hosting estático gratuito basta — no requiere el servidor del cliente); (2) sesión de revisión y captura de correcciones; (3) iterar hasta 3 rondas; (4) firma → el v3 corregido se convierte en la referencia obligatoria de la Fase B. Mientras tanto, la Fase A (backend) avanza en paralelo sin depender del diseño.

**Mapeo prototipo → build (aplica a la versión firmada):** `Header3/Footer3` → layout público; `PropCard3` (badge Premium dorado, "Nuevo", tipo de inmueble) → `PropertyCard`; `Filter3` → `PropertyFilters`; `Map3` con marcadores *price-pill* (#0F1B2D) → `SearchMap`; `Detail3 + ContactForm3` → ficha + `LeadForm`; `v3-admin` → backoffice.

**Ajustes obligatorios al portar:** (1) el prototipo usa Leaflet/CDN y Babel standalone — la implementación real usa **Google Maps Platform** (contractual) replicando el estilo *price-pill* de los marcadores, fuentes vía `next/font` (self-hosted, no Google Fonts CDN) y Tailwind en lugar de estilos inline; (2) el prototipo incluye un ícono de WhatsApp — **no implementar** el botón dinámico (no-objetivo §1); (3) el prototipo v3 trae el rojo `#C41930`, pero el rojo de marca definitivo es el del logo **`#D2103E`** (✔ confirmado): actualizar el token en el prototipo antes de publicarlo para revisión del cliente, y usarlo en toda la implementación.


### 7.1 Rutas públicas (SSR/SSG/ISR)
| Ruta | Render | Descripción |
|---|---|---|
| `/` | SSG + ISR | Home: buscador destacado (venta/renta, ubicación, tipo), **sección Premium** (arriba) y **sección Recientes** (último ingreso). |
| `/propiedades` | SSR | Listado con filtros + vista mapa/lista alternable. Crítico para Core Web Vitals (§9). |
| `/propiedades/[estado]/[colonia]/[slug]` | SSG + ISR | Detalle: galería (video + 360°), mapa, amenidades, formulario de contacto **y de cita** (fecha/hora preferida), JSON-LD. |
| `/buscar` | SSR | Resultados de búsqueda. |
| `/contacto`, `/aviso-privacidad` | SSG | Estáticas. |
| `/sitemap.xml`, `/robots.txt` | dinámico | Generado desde propiedades publicadas. |

### 7.2 Backoffice (`/admin`, route group protegido, client-side)
- Login → dashboard (KPIs: propiedades por estatus, leads por status, **leads recientes y visualizaciones por propiedad** — analítica básica §6.6).
- CRUD propiedades con asistente: datos → ubicación (mapa para fijar `geo`) → imágenes (**subida masiva** drag&drop, conversión WebP server-side) → amenidades → publicar. Selector de estatus comercial (disponible/apartado/rentado/vendido/pausado) y **toggle Premium/Destacada**.
- Gestión de leads: tablero por status, asignación a broker, detalle con bitácora.
- Gestión de usuarios (solo admin).
- Gestor de scripts de marketing.
- Configuración de webhooks salientes + bitácora de entregas + **gestión de API keys para webhooks entrantes**.

### 7.3 Componentes core
`PropertyCard`, `PropertyFilters` (incluye slider de precio), `SearchMap` (carga dinámica `next/dynamic`, `ssr:false`; **al clic en pin muestra miniatura/vista previa** de la propiedad), `PropertyGallery` (lazy + WebP), `LeadForm` (contacto/cita), `Pagination`, `AdminTable`, `ImageUploader` (subida masiva), `LocationPicker`.

### 7.4 Reglas de rendimiento en frontend (obligatorias)
- `next/image` para todas las imágenes (WebP, `sizes` responsive, `priority` solo en LCP).
- Mapa cargado con `next/dynamic` + `ssr:false` (no bloquea LCP).
- TanStack Query con caché; sin *waterfalls* de fetch.
- Tailwind con purge; sin librerías de UI pesadas.
- Fuentes con `next/font` (self-hosted, sin FOUT).
- Páginas `not-found` y `error` personalizadas; redirecciones 301 configurables en `next.config` (preserva SEO).
- `next.config`: `images.remotePatterns` apuntando a la ruta pública de media (`/media/*` servida por Caddy). URLs de imagen con hash de contenido → `Cache-Control: immutable`.
- JS de mapa solo en la vista mapa (code-splitting).

---

## 8. Seguridad (obligatoria en API)

- `helmet` (CSP que permita los scripts de marketing configurados), `cors` con whitelist de orígenes, `hpp`.
- `express-rate-limit`: global + límite estricto en `/auth/login` y `POST /leads`.
- Queries parametrizadas (Drizzle) → sin SQL injection. Sanitización de salida → sin XSS.
- JWT: access 15 min (header `Authorization: Bearer`), refresh rotativo 7 días (`token_hash` en BD, revocable). Contraseñas con argon2id.
- Validación Zod en **todas** las entradas (body, query, params).
- Webhooks firmados con HMAC SHA-256.
- Secrets solo en variables de entorno (nunca en repo). `.env.example` documentado.
- Subida de imágenes: validar mimetype + tamaño + re-encode con sharp (descarta payloads maliciosos).

---

## 9. Métricas de rendimiento comprometidas (condición de entrega)

Verificadas con **Google PageSpeed Insights** y **Lighthouse CLI**, sobre la **página de listado de propiedades en móvil simulado** (escenario crítico). **El código fuente no se libera hasta alcanzarlas en producción.**

| Métrica | Objetivo | Cómo se verifica |
|---|---|---|
| Lighthouse Performance | ≥ 90/100 | Lighthouse CI sobre `/propiedades` móvil |
| LCP | < 2.5 s | 4G simulado |
| INP (sustituye FID) | < 100 ms | Respuesta al primer clic del buscador |
| CLS | < 0.10 | Estabilidad de layout |
| TTFB | < 600 ms | Respuesta del Node.js en producción |
| Carga de galería | < 1 s | WebP + Lazy Load |

**Estrategia para cumplirlas:** SSG/ISR en páginas indexables, `next/image`+WebP, carga diferida del mapa, caché en API (Cache-Control + ETag en GET públicos), índices BD correctos (§4.1), `gzip/brotli` en Caddy, fuentes self-hosted.

---

## 10. Estrategia de pruebas (QA)

| Nivel | Herramienta | Cobertura |
|---|---|---|
| Unitarias | Vitest | services (lógica de negocio: filtros, ordenamiento premium, generación de slug, firma webhook) |
| Integración API | Supertest + BD de prueba | flujos auth, CRUD propiedades, captación de lead → webhook, paginación |
| E2E | Playwright | login admin, publicar propiedad, búsqueda con filtros, envío de lead |
| Rendimiento | Lighthouse CI | métricas §9 en build/preview; bloquea merge si no cumple |

CI (GitHub Actions): `lint → typecheck → test → build → lighthouse`. Merge bloqueado si falla cualquiera.

---

## 11. Despliegue (VPS, Docker Compose + Caddy)

Servicios en `infra/docker-compose.yml`:
- `db`: `postgis/postgis:16-3.4`, volumen persistente.
- `api`: imagen Node 20, migraciones al arranque, worker pg-boss.
- `web`: Next.js 14 build standalone.
- `caddy`: reverse proxy con **TLS automático** (Let's Encrypt), brotli/gzip, headers de caché.

**Servidor:** VPS **Ubuntu 24.04 LTS** (cuenta del cliente): 8GB RAM / 2 vCPU / 100GB NVMe (DigitalOcean, Hetzner, Vultr o Hostinger). **El aprovisionamiento del servidor forma parte del alcance** y sigue paso a paso `SETUP_SERVIDOR_UBUNTU.md`: hardening SSH, UFW, fail2ban, swap, Docker, zona horaria `America/Mexico_City`, actualizaciones automáticas de seguridad, despliegue y cron de respaldos.

**Ambientes:**
- *Desarrollo:* local con Docker Compose (`db` únicamente; api/web con `pnpm dev`).
- *Staging/preview:* mismo VPS con compose `-f docker-compose.yml -f docker-compose.staging.yml` en subdominio `staging.` — necesario para medir las métricas §9 en condiciones reales antes del go-live, con datos de seed realistas.
- *Producción:* compose completo tras puertas de QA.

**Despliegue:** script `infra/deploy.sh` (git pull → build imágenes → migraciones → `docker compose up -d` → healthcheck). Documentado en `docs/README-DEPLOY.md` (variables, migraciones, restore < 2h).

*Nota: los dominios `tarinternacional.com` usados en este documento son placeholders; confirmar el dominio definitivo con el cliente y reemplazar en `.env` y Caddyfile. Restringir la API key de Google Maps por referrer HTTP al dominio final.*

---

## 12. Variables de entorno (`.env.example`)

```
# API
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://tar:***@db:5432/tar_portal
JWT_ACCESS_SECRET=***
JWT_REFRESH_SECRET=***
CORS_ORIGINS=https://www.tarinternacional.com
# Storage local (disco del VPS Hostinger)
STORAGE_DRIVER=local
MEDIA_DIR=/srv/tar/media
MEDIA_BASE_URL=https://www.tarinternacional.com/media
# Conversión para filtros/orden (display siempre en moneda original)
USD_MXN_RATE=18.50
# Respaldos off-site — Cloudflare R2 (cuenta del cliente, S3-compatible)
R2_ACCOUNT_ID=***
R2_ACCESS_KEY_ID=***
R2_SECRET_ACCESS_KEY=***
R2_BUCKET=tar-respaldos
# Email
SENDGRID_API_KEY=***
LEADS_NOTIFY_TO=ventas@tarinternacional.com
# Web
NEXT_PUBLIC_API_URL=https://api.tarinternacional.com/api/v1
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=***   # cuenta del cliente
NEXT_PUBLIC_SITE_URL=https://www.tarinternacional.com
```

---

## 13. Control de cambios (resumen contractual)

- Alcance = este PRD. Cambios se clasifican como: ajustes UI/UX (semanas 1–2, hasta 3 rondas, sin costo), funcionales menores (post-capacitación), o nuevas funcionalidades (requieren **adenda** con costo/tiempo).
- Ningún cambio se cobra retroactivamente. Toda adenda se cotiza por escrito antes de ejecutarse.

---

## 14. Garantía y respaldos (resumen)

- Estabilización: 4 semanas post-lanzamiento, corrección sin costo de bugs reproducibles dentro del alcance.
- Garantía extendida: 12 meses para errores críticos (caídas, fallas de auth, pérdida de datos).
- Respaldos en 3 capas: (1) `pg_dump` diario + tar del volumen de media → `/var/backups/tar` local (retención 30 días, rotación automática); (2) **sincronización off-site diaria a Cloudflare R2** (cuenta del cliente, S3-compatible, sin costos de egreso) vía rclone — cumple la promesa contractual de bucket externo y protege contra falla total del VPS; (3) snapshots automatizados de Hostinger. Respaldo semanal de código en Git. Restore documentado < 2h (desde local o desde R2). Monitoreo UptimeRobot + alerta de espacio en disco.

---

## 15. Entregables finales (al liquidar)

1. Código fuente completo (repo Git privado, historial de commits).
2. Documentación API interactiva (Swagger/OpenAPI 3.0) — `docs/openapi.json` + `/docs`.
3. Esquema BD (ERD en PDF + `schema.sql` dump inicial).
4. Manual de administración (backoffice) en PDF — incluye uso del Gestor de Scripts y del módulo de Webhooks (salientes y entrantes).
5. Guía de despliegue (`docs/README-DEPLOY.md`).
6. Guía de aprovisionamiento del servidor (`SETUP_SERVIDOR_UBUNTU.md`) con el servidor ya configurado y endurecido.
7. Credenciales y accesos (dominio, servidor, APIs, repo, panel).

---

## 16. Definición de Hecho (DoD) global

Una funcionalidad está *hecha* solo si: cumple su sección del PRD, tiene validación Zod, tiene pruebas (unit/integración según aplique en verde), pasa lint+typecheck, no rompe métricas §9, y está documentada en OpenAPI (si es endpoint). El proyecto está *terminado* solo cuando los 7 entregables de §15 existen y las métricas §9 se cumplen en producción.
