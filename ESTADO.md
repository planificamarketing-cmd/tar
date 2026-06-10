# ESTADO — Plataforma TAR Internacional

> **Partida guardada del proyecto.** Este archivo (+ `git log`) es lo ÚNICO que se lee al iniciar sesión. NO releer el PRD, el plan ni el código completos: consultar solo la sección puntual que toque la tarea en curso. Se regenera (se sobrescribe) al final de cada sesión.

**Última actualización:** 2026-06-09 · sesión: prototipo ronda 2 + Fase C (slices 1–2)
**Fase actual:** FASE C — Backoffice **EN PROGRESO**. Hecho: slice 1 (fundación/auth), slice 2 (dashboard + leads) y panel **fiel al diseño del prototipo admin**. Siguiente: slice 3 (CRUD de propiedades). (Fase A cerrada; Fase B bloqueada hasta firma del diseño.) **Avance global:** ~55%
**Prototipo:** ronda 2 de correcciones del cliente APLICADA; **zip `tar-prototipo-v3.zip` regenerado** (raíz del repo, 10 archivos, listo para Netlify drop).

## Hecho
- **FASE 0** completa (cimientos, ver `git log`).
- **Esquema Drizzle completo** (`packages/db/src/schema.ts`, §4.1): 14 tablas con enums, precios duales + normalizados MXN, `geo geography(Point,4326)`, full-text español (`search_vector`), soft delete, índices btree/GIN/GiST. Migración `0000_*` aplicada (con `CREATE EXTENSION postgis, citext`).
- **Seed** (`pnpm db:seed`, idempotente): 1 admin (`admin@tarinternacional.com` / `admin123`), 8 amenidades, 5 colonias (CDMX/Edomex/Qro), **10 propiedades** de muestra (venta/renta, MXN/USD, los tipos del inventario). Verificado: normalización MXN, `ST_Within`/bbox y full-text funcionando.
- **Esquemas Zod compartidos** (`packages/shared/src/*`, §5): enums, paginación, auth, users, **filtros de propiedades + create/update + bbox del mapa**, leads (honeypot + consentimiento LFPDPPP + cita), webhooks (salientes/entrantes/api-keys), scripts.
- **ERD borrador**: `docs/ERD.md` (Mermaid) + `docs/schema.sql` (dump del esquema aplicado).
- **Prototipo v3 ingerido + revisado (ronda 1 del cliente)** en `design-reference/prototipo-v3/`: HTML + 4 JSX + logo. Rojo corregido a **`#D2103E`**. Cambios aplicados (commit `9776f25`): Home sin badge/destacada, mapa real (Leaflet), FAQ animado; sin WhatsApp; Nosotros con foto + valores en tarjetas; Admin: Brokers→Usuarios, alta por geocoding (sin GPS manual), filtros ricos + Exportar CSV, Scripts proveedor→nombre, Ajustes sin Marca/Facturación + Integraciones/Webhooks visibles, sin emojis, acceso oculto. Navegable: `pnpm prototipo` (http://localhost:4173). Falta deploy público (GitHub Pages, repo aparte).
- **Datos del cliente resguardados** en `data/` (gitignored, PII): **CSV real de inventario (105 propiedades)** para el importador (Fase A.5), aviso de privacidad PDF (para `/aviso-privacidad`), capturas del diseño desplegado y contenido "Nosotros".
- **FASE A.1 — Auth COMPLETA** (`apps/api/src/modules/auth/`, `lib/jwt.ts`, `lib/tokens.ts`, `middleware/require-auth.ts`): argon2 + login → access JWT (15m) + refresh rotativo (7d, hash SHA-256 en `refresh_tokens`, rotación con revocación), `requireAuth`/`requireRole(admin|editor)`, rate-limit estricto en `/auth/login`, cookie httpOnly + body. Endpoints en `/api/v1/auth/{login,refresh,logout,me}`.
- **FASE A.2 — Propiedades COMPLETA** (`apps/api/src/modules/properties/`, `lib/{events,slug,pricing}.ts`): CRUD (borrador/patch/soft-delete), `publish` (valida geo+precio, slug inmutable, `property.published`), `PATCH /:id/status` (`property.status_changed`), `GET /properties` (filtros combinados sobre `price_*_mxn` + orden relevancia-premium/precio/recientes + paginación + full-text español), `GET /properties/map` (bbox `ST_Within`, SQL crudo, payload ligero, precio en moneda original), `GET /:slug` (detalle + imágenes + amenidades). Rutas públicas + protegidas (`requireRole`). Eventos vía `lib/events` (stub → pg-boss en A.4).
- **FASE A.3 — Media COMPLETA** (`apps/api/src/modules/media/`, `lib/storage.ts`): `lib/storage` (interfaz abstracta + driver `local`, `MEDIA_DIR`); subida con **multer** (memoria, 10 MB) → **sharp re-encode a WebP (full ≤1600px) + thumbnail** (nunca confía en el archivo) → guardado con hash de contenido → `property_images`. PATCH (reordenar/cover/alt) y DELETE (borra disco+BD, promueve portada). Media servida en `/media` (dev). 5 tests.
- **FASE A.4 — Leads + Webhooks COMPLETA** (`modules/{leads,tracking,webhooks}`, `lib/{mailer,webhooks,queue}.ts`): `POST /leads` público (honeypot + consentimiento LFPDPPP + rate-limit, emite `lead.created`, mailer SendGrid best-effort), `POST /events/track` (`property_events`), CRUD leads admin con bitácora `lead_events` (pipeline nuevo) + `lead.status_changed`; **pg-boss** entrega webhooks salientes (fan-out → `webhook_deliveries`, firma **HMAC-SHA256** `X-TAR-Signature`, backoff 5 intentos, reintento manual); CRUD `webhook_subscriptions`, `api_keys` (llave en claro solo al crear) y `POST /webhooks/inbound` (X-API-Key + scopes → `lead/property.update_status`). `lib/events` ya conectado a pg-boss; la cola arranca en `index.ts`.
- **FASE A.5 — Importador EasyBroker COMPLETA** (`apps/api/src/jobs/importer.ts`, `scripts/import-inventario.ts`): `pnpm import:inventario <csv> [--dry-run --no-images --no-geo --limit=N]`. Mapea columnas EB (precios $/comas, tipos→enum, **col `0`→recámaras**, medios baños, piso, CP, dirección, características→amenidades con creación), geocoding Google (sin geo→borrador), descarga imágenes→sharp WebP+thumb, **idempotente por `external_ref`**, reporte. Dry-run sobre el CSV real: **105 filas, 35/70 venta/renta** ✔ (§4.3). 7 tests (helpers + dry-run + idempotencia BD).
- **Herramienta de verificación**: `pnpm smoke` (21 pasos, incl. webhook real) + `pnpm import:inventario … --dry-run` + `docs/VERIFICACION.md` + `apps/api/requests.http`. 
- **FASE A.6 — OpenAPI/Swagger COMPLETA** (`apps/api/src/openapi/`): spec OpenAPI 3.0 generado desde los Zod compartidos (`@asteasolutions/zod-to-openapi`), Swagger UI en **`/docs`**, export `pnpm openapi` → `docs/openapi.json` (23 rutas). A.7: 44 tests (unit + integración). **Fase A cerrada (DoD §5/§10).**
- Verificado: `lint`, `typecheck`, `build`, **`test` (44)** en verde + `pnpm smoke` 21/21 + importador dry-run + `/docs` 200.
- **Documentación de entrega + sistema de reportes** creados (`docs/`): `README` (índice), `ARQUITECTURA`, `GLOSARIO`, `PUESTA-EN-MARCHA`, `VERIFICACION`, `ERD`, `openapi.json`; `docs/reportes/` con semanales (1–6) + quincenales (1–3) + **INFORME-EJECUTIVO** (para el cliente) + plantillas, alineados al cronograma.
- **FASE C — Backoffice fiel al prototipo** (`apps/web`): el panel replica el diseño del prototipo admin (`v3-admin.jsx`): **sidebar blanco** con nav agrupada (General/CRM/Configuración), logo cuadro rojo "TAR", item activo en rojo con borde izquierdo; **dashboard** con header de bienvenida + Exportar CSV, tarjetas KPI con chip de icono, y gráficas (Leads por mes, Mix de inventario, Estado de propiedades, Leads recientes con avatares) — **alimentadas con datos reales** de la API (`/properties`, `/leads`, límite de paginación 50). Login en el mismo lenguaje (cuadro rojo TAR). Iconos del prototipo portados a `components/icons.tsx`.
- **FASE C.2 — Dashboard + Leads** (`apps/web`): cliente de datos (`lib/queries.ts`, TanStack Query) + tipos/formatos (`lib/types.ts`, `lib/format.ts`). **Dashboard con KPIs en vivo** (publicadas, leads nuevos/citas/totales) + leads recientes. **Gestión de leads**: tablero con filtro por status + paginación (`/admin/leads`), detalle con datos/mensaje/**bitácora** y **cambio de estado en vivo** (`PATCH /leads/:id` → emite `lead.status_changed`) (`/admin/leads/[id]`). Nav "Leads" activo. 7 leads de muestra sembrados (variados) en la BD dev para demo. typecheck/lint/build verdes; flujo verificado E2E por API. Pendiente: asignación a usuario (llega con Usuarios), visualizaciones por propiedad y conteo de borradores (requieren endpoint admin de propiedades).
- **FASE C.1 — Fundación del backoffice** (`apps/web`): tokens de marca + familia DM (`next/font`) en `tailwind.config`/`layout`; **cliente API** (`lib/api.ts`, Bearer + refresh httpOnly + reintento en 401, base derivada del host para WSL/local) y **sesión** (`lib/auth.tsx`, rehidrata vía refresh al montar); rutas `app/admin/login` (login validado con Zod compartido) + grupo `(panel)` con **guard** + sidebar estilo prototipo (logo, usuario/rol, logout) + **shell de dashboard**. TanStack Query montado. `typecheck`/`lint`/`build` en verde; login E2E verificado (curl 200 + cookie + CORS) por `localhost` y por IP de WSL. Logos en `apps/web/public/brand/`.

## En progreso
- **FASE C — Backoffice (slice 3): CRUD de propiedades.** Requiere primero un **endpoint admin** de listado (el público fuerza estados públicos → no muestra borradores). Luego: tabla admin (todos los estados) + asistente (datos → LocationPicker → ImageUploader masivo → amenidades → publicar; estatus + toggle premium). `LocationPicker` necesita la API key de Google Maps (pendiente del cliente, vacía en `.env`) → fallback pin arrastrable / coords manuales mientras tanto.

## Siguiente (máx. 3)
1. **Fase C — resto de bloques:** gestión de leads (tablero + bitácora), usuarios (admin), scripts de marketing (head/body/footer), webhooks salientes + API keys entrantes.
2. **FASE B — Frontend público**: bloqueada hasta la **firma del prototipo v3** (cliente). Publicar el prototipo en Netlify y abrir la ronda de firma.
3. Portar el resto de tokens del diseño a `tailwind.config` tras la firma (los de marca + familia DM ya están).

## Decisiones / desviaciones respecto al PRD
- 2026-06-09: **Correcciones del cliente al prototipo (ronda 2)** aplicadas en `design-reference/prototipo-v3/` (sin tocar backend):
  - **Logo:** header = logo original `tar-logo.svg`; footer = logo nuevo `tar-logo.webp` (blanco, entregado por el cliente, sobre el navy del footer).
  - **Tipografía → familia DM:** `DM Serif Display` (títulos) + `DM Sans` (interfaz) + `DM Mono` (cifras). Sustituye Fraunces + Inter. (Al portar a `tailwind.config`/`next/font` en Fase B, usar estas fuentes.)
  - **Buscadores con autocompletado** (`Autocomplete3`) en hero, sidebar y mapa: sugieren colonias/alcaldías/zonas; búsqueda sin acentos y multi-campo (título, ubicación, colonia, ciudad, zona).
  - **Filtro "Ubicación" de 3 niveles** (estado/zona, alcaldía/municipio, colonia) en `<optgroup>`; reemplaza el viejo selector que solo listaba estados.
  - **Filtro de precio coherente** por operación (rentas en $/mes, ventas en MDP).
  - **Precios `$/m²`:** las propiedades comerciales que en EasyBroker vienen por metro cuadrado se etiquetan `$X/m²[/mes]` (campo `priceUnit:"m2"` en `tar-data.jsx`, 40 props). **Pendiente backend:** el importador Fase A.5 hoy guarda ese valor unitario como total — revisar antes del Lanzamiento (detección $/m² o campo de unidad).
- 2026-06-07: **Decisiones de diseño del cliente (ronda 1, reflejadas en el prototipo)** que afectan la construcción:
  - **Roles:** ya no hay "brokers"; son **usuarios administrativos** (Administrador / Editor). Mapea a §4.1/§5.6. (Enum aplicado — ver abajo.)
  - **Acceso al panel:** no se enlaza desde la web pública; entrada oculta. En producción será un **subdominio aparte** (p.ej. `panel.tarinternacional.com`) detrás de login. Mapea a §7.2/§11 (ajustar Caddyfile + route group).
  - **Alta de propiedad por dirección con geocoding** (Google Geocoding, ya en §4.3), sin captura manual de coordenadas; pin arrastrable como fallback (LocationPicker).
  - **Sin WhatsApp** en el sitio público: los leads entran solo por formulario (contacto/cita). El campo se mantiene en la BD para datos de contacto, pero no hay botón/integración de WhatsApp.
  - **"Guardar / favoritos"** queda como UI preparada pero **diferida**: requiere cuentas de usuario público (no contemplado en el alcance actual; sería adenda). 
  - **Sin "Agendar visita"** como pestaña en el formulario público (se quitó); el lead entra solo como contacto.
  - **Pipeline de leads (CRM) redefinido** a estatus inmobiliarios: `nuevo`, `cita_agendada`, `cita_concretada`, `apartado`, `firma_contrato` (+ `descartado`). ✅ **APLICADO** en `packages/db` (enum `lead_status`) y `packages/shared`; migración regenerada. Cada cambio emite/recibe `lead.status_changed` por webhook (bidireccional vía `/webhooks/inbound` con `X-API-Key`). CRM del admin prototipado **funcional**.
  - **Rol `user_role`** cambiado de `(admin, broker)` a `(admin, editor)` (default `editor`). ✅ **APLICADO** en `packages/db` + `packages/shared` + migración. `requireRole` usará `admin|editor`.
  - Estas decisiones se formalizan al **firmar** el prototipo; recién entonces se actualiza el PRD si aplica.
- 2026-06-07: el **seed usa datos de muestra sintéticos** representativos (no el CSV real, que es entrega del cliente para el Lanzamiento). La carga real será vía `pnpm import:inventario` (Fase A.5).
- 2026-06-07: el tipo `geography(Point,4326)` requiere **quitar las comillas** que drizzle-kit añade al modificador en el SQL generado (nota en `schema.ts`). Migración ya corregida.
- 2026-06-07: ERD entregado como `docs/ERD.md` (Mermaid) + `schema.sql`; el **PDF definitivo** es entregable de Lanzamiento (§15).
- La parte de diseño de la Fase 1 (prototipo/firma) NO bloquea la Fase A (backend); sí es prerequisito duro de la Fase B.

## Bloqueos / pendientes del cliente
- **Revisión y FIRMA del prototipo v3** por TAR (hasta 3 rondas, §13) — bloquea Fase B. (El prototipo ya está ingerido y listo para mostrar.)
- **Elegir host gratuito + cuenta** para el deploy público del prototipo (Netlify/Vercel/GH Pages/Cloudflare).
- Dominio definitivo (pendiente TAR).
- API keys: Google Maps, SendGrid, Cloudflare R2 (pendiente TAR) — necesarias antes de Fase B / importador.

## Cómo retomar
- `git log --oneline -15` para ver el avance real de código.
- Tareas marcadas `[x]` en `PLAN_EJECUCION_FASES.md` = fuente de verdad del checklist.
- Levantar: `pnpm db:up` (BD) + `pnpm dev`. Recargar datos: `pnpm db:migrate && pnpm db:seed`.
- **Backoffice (Fase C):** entra en `/admin/login` (`admin@tarinternacional.com` / `admin123`). Para verlo desde Windows vía WSL: arrancar api y web con `next dev -H 0.0.0.0` y `CORS_ORIGINS` incluyendo la IP de WSL; el cliente API deriva la URL del host del navegador.
- **Leads de muestra:** los 7 leads para la demo se insertaron por SQL en la BD dev (NO están en el seed ni en git). Si reseteas la BD desaparecen → considerar añadirlos a `pnpm db:seed` para reproducibilidad.
- **Pendiente backend para slice 3:** falta endpoint admin de listado de propiedades (el público fuerza estados públicos; no muestra borradores). La paginación de la API limita `limit` a 50.
