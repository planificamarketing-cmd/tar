# PLAN DE EJECUCIÓN POR FASES — Plataforma TAR Internacional

Mapeado al roadmap de 16 semanas del documento comercial. Cada fase tiene **tareas accionables** (marca `[x]` al completar), **entregable** y **Definición de Hecho (DoD)**. No avanzar de fase sin cerrar la DoD. Referencias `§N` apuntan al `PRD_Plataforma_TAR.md`. El aprovisionamiento del servidor sigue `SETUP_SERVIDOR_UBUNTU.md`.

---

## FASE 0 — Cimientos del proyecto · Semana 1

**Objetivo:** monorepo operativo, BD levantada, CI básico.

> **Nota de infraestructura:** las Fases 0–B se desarrollan **100% en equipo local** (Docker Compose para la BD; api/web con `pnpm dev`). El servidor del cliente NO se necesita hasta la FASE QA (semanas 14–15); no tenerlo las primeras semanas no bloquea nada. Lo único que sí se necesita antes de la Fase B: API key de Google Maps y cuenta SendGrid (pueden ser keys de desarrollo temporales).

- [x] Inicializar monorepo: `pnpm-workspace.yaml`, `turbo.json`, ESLint + Prettier + tsconfig base compartido, `.gitattributes` (LF), `.nvmrc` (Node 20).
- [x] BD local **con Docker** (misma imagen `postgis/postgis:16-3.4` que producción), nunca instalación nativa — asegura paridad con el VPS.
- [x] Crear `apps/api` (Express 5 + TS), `apps/web` (Next.js 14 + TS + Tailwind), `packages/db`, `packages/shared`; copiar el prototipo v3 y logo a `design-reference/`. _(carpeta `design-reference/` creada con placeholder; el prototipo/logo se copian tras la firma del cliente — Fase 1.)_
- [x] `infra/docker-compose.yml` con `db` (postgis/postgis:16-3.4); levantar PostgreSQL + PostGIS local.
- [x] Configurar Drizzle en `packages/db` (conexión `pg`, comandos `db:generate`/`db:migrate`).
- [x] `.env.example` completo (§12) + carga de env tipada con Zod.
- [x] `logger` (pino), `errorHandler`, `/health` en API.
- [x] CI GitHub Actions: `lint → typecheck → build`.

**Entregable:** `pnpm dev` levanta API (`/health` OK) y web (página vacía) contra Postgres+PostGIS.
**DoD:** repo compila, lint/typecheck en verde, CI pasa, BD conecta.

---

## FASE 1 — Planeación técnica y prototipos UI/UX · Semanas 1–2

**Objetivo:** modelo de datos definitivo, contratos Zod, prototipos aprobados. (Hasta 3 rondas de revisión, §13.)

- [x] Implementar esquema Drizzle completo (§4.1): users, refresh_tokens, locations, properties (con `geo` geography + índices GIN/GiST, estatus comercial, **precios duales venta/renta MXN-USD + normalizados**, `external_ref` EB, medios baños, piso, CP, tipos del inventario real), amenities, property_amenities, property_images, leads (`type` contacto/cita, `preferred_at`, `consent_at`), lead_events, webhook_subscriptions, webhook_deliveries, **api_keys**, **property_events**, marketing_scripts.
- [x] Migración inicial + `db:seed` con datos de muestra tomados del CSV real (10 propiedades representativas: venta/renta, MXN/USD, los 7 tipos), amenidades derivadas de la columna `características`, 1 admin. _(seed con datos de muestra **representativos** sintéticos; el CSV real es entrega del cliente y se importa con `pnpm import:inventario` en Fase A/Lanzamiento.)_
- [x] Definir esquemas Zod compartidos en `packages/shared` para todas las entidades y filtros (§5).
- [~] Publicar el **prototipo v3 en URL navegable** (hosting estático gratuito; es HTML autocontenido) para que TAR interactúe con él y entienda cómo puede quedar. _Prototipo v3 ingerido en `design-reference/prototipo-v3/` y navegable local (`pnpm prototipo`); falta el **deploy público** (elegir host/cuenta gratis)._
- [x] Aplicar el rojo de marca definitivo **#D2103E** (✔ confirmado, tomado del logo) al prototipo antes de publicarlo. _Sustituido `#C41930`/`#A01428` → `#D2103E`/`#A80D32` en todo el prototipo._
- [ ] Sesión de revisión con TAR: capturar correcciones por escrito; aplicarlas al prototipo (hasta **3 rondas formales**, §13). ⏳ _bloqueado: cliente._
- [ ] **Firma del diseño** por TAR → la versión corregida del v3 se versiona en `design-reference/` como referencia obligatoria y se cierra la ventana de cambios UI sin costo. ⏳ _bloqueado: cliente._
- [ ] Tras la firma: portar tokens definitivos a `tailwind.config` (colores, Fraunces/Inter/DM Mono vía `next/font`). ⏳ _depende de la firma._
- [x] Generar borrador de ERD (`docs/ERD.pdf`) desde el esquema. _(borrador como `docs/ERD.md` (Mermaid) + `docs/schema.sql`; el PDF definitivo §15 se genera en Lanzamiento.)_

**Entregable:** BD migrada con seed, tipos compartidos, prototipo v3 revisado y firmado por el cliente.
**DoD:** `db:migrate` + `db:seed` corren limpio; ERD generado; **diseño firmado** (cierra ventana de cambios UI sin costo). Si la firma se retrasa, NO bloquea la Fase A (backend); sí es prerequisito duro de la Fase B (frontend).

---

## FASE A — Core & Backend · Semanas 3–6

**Objetivo:** API RESTful completa, segura, documentada, con webhooks y lógica premium.

### A.1 Autenticación y seguridad (§5.1, §8)
- [x] argon2 para passwords; login → access (15m) + refresh rotativo (7d, `token_hash` SHA-256 en BD).
- [x] Middleware `requireAuth` + `requireRole(admin|editor)`. _(rol broker→editor por decisión del cliente.)_
- [x] `helmet`, `cors` (whitelist), `hpp`, `express-rate-limit` (global + estricto en `/auth/login`).
- [x] Endpoints `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` (base `/api/v1`; refresh por cookie httpOnly o body). Tests Supertest (8) en verde.

### A.2 Propiedades (§5.2, §6.3, §6.4)
- [x] CRUD propiedades (crear borrador, patch, soft delete).
- [x] `POST /properties/:id/publish`: valida `geo` y campos requeridos, genera `slug` inmutable, status → `disponible`, set `published_at`, emite **`property.published`**.
- [x] `PATCH /properties/:id/status`: estatus comercial (disponible/apartado/rentado/vendido/pausado), emite **`property.status_changed`**.
- [x] `GET /properties`: filtros combinados (precio, recámaras, baños, **estacionamientos, m² construcción, m² terreno**, amenidades, colonia, texto) + paginación + param `sort` (relevancia premium / precio asc-desc / recientes).
- [x] `GET /properties/map`: consulta geoespacial por `bbox` (`ST_MakeEnvelope`/`ST_Within`, SQL crudo) con filtros, payload ligero.
- [x] `GET /properties/:slug`: detalle con imágenes + amenidades.

_Eventos `property.published`/`property.status_changed` emitidos vía `lib/events` (stub que A.4 conecta a pg-boss). 9 tests de integración en verde._

### A.3 Media (§5.3)
- [ ] `lib/storage` con driver `local` (disco del VPS, `MEDIA_DIR`); interfaz abstraída para que un futuro driver S3 sea adenda y no reescritura.
- [ ] Subida de imágenes: validar mimetype/tamaño → sharp re-encode a WebP + thumbnail + tamaños responsive → volumen de media (nombre con hash de contenido) → registro en `property_images`.
- [ ] Reordenar / set cover / alt / delete.

### A.4 Leads + Webhooks (§5.4, §5.5, §6.7)
- [ ] `POST /leads` público (`type` contacto/cita + `preferred_at` + consentimiento): rate-limit + honeypot + Zod; crea lead; emite `lead.created`.
- [ ] `POST /events/track` público rate-limited: registra `view` en `property_events`.
- [ ] `lib/mailer` (SendGrid): notificación de nuevo lead a `LEADS_NOTIFY_TO`.
- [ ] CRUD leads admin + cambio de status/asignación → registra `lead_event` + emite `lead.status_changed`.
- [ ] CRUD `webhook_subscriptions`; sistema de entrega con **pg-boss**: firma HMAC SHA-256, backoff exponencial (5 intentos), bitácora en `webhook_deliveries`, reintento manual. Eventos: `lead.created`, `lead.status_changed`, `property.published`, `property.status_changed`.
- [ ] **Webhooks entrantes**: `POST /webhooks/inbound` con `X-API-Key` (scopes en `api_keys`), acciones `lead.update_status` / `property.update_status` + CRUD de API keys.

### A.5 Importador de inventario EasyBroker (§4.3)
- [ ] Comando `pnpm import:inventario <csv>`: parseo + mapeo de columnas (precios $/comas, tipos, medios baños, piso, CP, **columna `0` → recámaras** ✔ confirmado).
- [ ] Geocodificación de direcciones (Google Geocoding API) → `geo`; fallos quedan en `borrador` con bandera de revisión.
- [ ] Descarga de imágenes EB → sharp WebP + thumb → volumen de media; manejo de URLs caídas.
- [ ] Mapeo `características` → amenidades (match difuso, creación de faltantes).
- [ ] Idempotencia por `external_ref` + reporte final (importadas / advertencias / fallidas).
- [ ] Corrida de prueba con el CSV actual (105 propiedades) en local; validar muestra contra EasyBroker.

### A.6 Documentación API (§5.7)
- [ ] OpenAPI 3.0 generado desde Zod (zod-to-openapi); servir Swagger UI en `/docs`; export a `docs/openapi.json`.

### A.7 Pruebas backend (§10)
- [ ] Vitest unit: generación de slug, ordenamiento premium, firma de webhook, filtros.
- [ ] Supertest: auth, CRUD propiedades, lead→webhook (con mock del target), paginación.

**Entregable:** API v1 completa y documentada en `/docs`, con pruebas en verde.
**DoD:** todos los endpoints de §5 implementados, validados, seguros, probados; webhooks entregan y reintentan; OpenAPI exportado.

---

## FASE C — Panel de Administración (Backoffice) · Semanas 6–8

**Objetivo:** backoffice autónomo (sin conocimientos técnicos), §7.2.

- [ ] Layout admin protegido (route group `(admin)`), login + manejo de sesión (refresh).
- [ ] Dashboard con KPIs: propiedades por estatus, leads por status, **leads recientes y visualizaciones por propiedad** (§6.6).
- [ ] CRUD propiedades con asistente: datos → `LocationPicker` (fijar `geo`) → `ImageUploader` (**subida masiva** drag&drop, WebP server-side) → amenidades → publicar. Selector de estatus comercial + **toggle Premium/Destacada**.
- [ ] Gestión de leads: tablero por status, asignación a broker, detalle con bitácora (`lead_events`).
- [ ] Gestión de usuarios (solo admin): alta/baja/rol.
- [ ] Gestor de scripts de marketing (**head / body / footer**, activar/desactivar) — §6.5.
- [ ] Configuración de webhooks salientes + bitácora + reintento manual + **gestión de API keys de webhooks entrantes**.

**Entregable:** backoffice funcional end-to-end contra la API.
**DoD:** un usuario no técnico puede publicar una propiedad con imágenes y ubicación, gestionar leads e insertar un script de marketing, todo desde el panel.

---

## FASE B — Frontend público & Experiencia · Semanas 8–13

**Objetivo:** sitio público SSR/SSG indexable y rápido, §7.1, §7.4.

- [ ] Layout público + inyección dinámica de `marketing_scripts` por placement.
- [ ] Home (`/`) SSG+ISR: buscador destacado (venta/renta, ubicación, tipo) + **sección Premium arriba** + **sección Recientes**.
- [ ] Listado (`/propiedades`) SSR: `PropertyFilters` con **slider de precio**, estacionamientos y m² (TanStack Query, debounce 300ms, sin recarga) + selector de **ordenamiento** + alternar lista/mapa + paginación.
- [ ] `SearchMap` (`next/dynamic`, `ssr:false`): clustering con supercluster, **vista previa (miniatura) al clic en pin**, botón "Buscar en esta área" (bbox → `/properties/map`), filtros aplicados sobre el mapa.
- [ ] Detalle (`/propiedades/[estado]/[colonia]/[slug]`) SSG+ISR (revalidate 3600): `PropertyGallery` (lazy + WebP + 360°/video embebido), mapa, amenidades, `LeadForm` (contacto **y cita** con fecha/hora).
- [ ] SEO On-Page: metadatos dinámicos por propiedad, Open Graph, JSON-LD `RealEstateListing`, `sitemap.xml` y `robots.txt` dinámicos.
- [ ] `LeadForm` → `POST /leads` con honeypot, **casilla de consentimiento LFPDPPP** enlazada a `/aviso-privacidad` (guarda `consent_at`) y feedback de éxito/error.
- [ ] Páginas `not-found`/`error` personalizadas; `images.remotePatterns` hacia el dominio de media.
- [ ] `next/font` self-hosted; `next/image` en todo; code-splitting del mapa.

**Entregable:** sitio público completo, navegable, conectado a la API.
**DoD:** todas las rutas de §7.1 funcionan; una propiedad publicada en el backoffice aparece indexable con URL semántica; enviar un lead dispara webhook + email.

---

## FASE QA — Pruebas integrales y optimización · Semanas 14–15

**Objetivo:** alcanzar las métricas comprometidas (§9) y blindar calidad (§10).

- [ ] **Aprovisionar el servidor Ubuntu 24.04** del cliente siguiendo `SETUP_SERVIDOR_UBUNTU.md` (hardening SSH, UFW, fail2ban, swap, Docker, timezone, unattended-upgrades). Cerrar su checklist §10.
- [ ] Levantar ambiente **staging** (`staging.`, BD separada, no indexable, auth básica) con seed realista para auditorías.
- [ ] E2E Playwright: login admin, publicar propiedad, búsqueda con filtros, envío de lead.
- [ ] Auditoría Lighthouse CI sobre `/propiedades` móvil **en staging (servidor real)**; iterar hasta: Performance ≥90, LCP <2.5s, INP <100ms, CLS <0.10, TTFB <600ms, galería <1s.
- [ ] Optimización: caché HTTP (Cache-Control + ETag) en GET públicos, revisar índices BD, brotli/gzip, eliminar JS muerto, presupuesto de imágenes.
- [ ] Hardening de seguridad: revisar CSP con scripts de marketing, rate-limits, validaciones.
- [ ] Integrar Lighthouse CI al pipeline como *gate* de merge.

**Entregable:** métricas §9 verificadas en ambiente de producción/preview.
**DoD:** reporte Lighthouse cumple los 6 objetivos; E2E en verde; CI bloquea regresiones de rendimiento.

---

## FASE LANZAMIENTO — Producción, capacitación y entrega · Semana 16

**Objetivo:** salir a producción y transferir propiedad total (§11, §14, §15).

- [ ] Desplegar producción con `infra/deploy.sh` (Docker Compose + Caddy, TLS automático, brotli) sobre el servidor ya aprovisionado en FASE QA.
- [ ] Activar respaldos en 3 capas: cron local (`pg_dump` + tar de media, retención 30 días) + **sincronización diaria a Cloudflare R2 vía rclone** (bucket del cliente con regla de ciclo de vida) + snapshots de Hostinger; respaldo semanal de código; **probar restore <2h desde R2** en contenedor limpio.
- [ ] Configurar UptimeRobot.
- [ ] Generar entregables (§15): `docs/openapi.json`, `docs/ERD.pdf` + `schema.sql`, manual de administración (PDF), `docs/README-DEPLOY.md`, `SETUP_SERVIDOR_UBUNTU.md` con checklist cerrado.
- [ ] **Corrida definitiva del importador** con CSV fresco del cliente (el inventario habrá cambiado); revisar en admin las propiedades en `borrador` por geocoding fallido y fijar pines. ⚠️ **Ejecutar ANTES de que TAR cancele EasyBroker**: al cancelar, las URLs de `assets.easybroker.com` mueren y las imágenes serían irrecuperables. Verificar el reporte del importador (imágenes descargadas vs. esperadas) antes de autorizar la cancelación.
- [ ] Capacitación del equipo del cliente sobre el backoffice.
- [ ] Entrega formal de credenciales/accesos (dominio, servidor, APIs, repo, panel).
- [ ] Activar periodo de estabilización (4 semanas) + garantía 12 meses.

**Entregable:** plataforma en producción + paquete de documentación + accesos transferidos.
**DoD:** sitio en línea cumpliendo §9; respaldos corriendo; los 7 entregables de §15 existen; cliente capacitado; PI transferida.

---

## Tablero resumen de fases

| Fase | Semanas | Foco | Gate de salida |
|---|---|---|---|
| 0 | 1 | Cimientos | `pnpm dev` + CI verde |
| 1 | 1–2 | Datos + prototipos | Migración+seed, prototipos aprobados |
| A | 3–6 | API/Backend | API §5 completa y probada |
| C | 6–8 | Backoffice | Publicar/gestionar sin técnica |
| B | 8–13 | Frontend público | Rutas §7.1 + SEO |
| QA | 14–15 | Servidor + métricas + tests | Servidor aprovisionado; Lighthouse §9 cumplido en staging |
| Lanzamiento | 16 | Prod + entrega | §15 completo, PI transferida |

> **Corresponsabilidad del cliente:** textos, imágenes de muestra, accesos a dominio y cuentas de servicios (Google Maps, SendGrid) deben entregarse antes de iniciar la Semana 3. Retrasos extienden el cronograma en la misma proporción sin costo adicional (§13).
