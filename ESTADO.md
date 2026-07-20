# ESTADO — Plataforma TAR Internacional

> **Partida guardada del proyecto.** Este archivo (+ `git log`) es lo ÚNICO que se lee al iniciar sesión. NO releer el PRD, el plan ni el código completos: consultar solo la sección puntual que toque la tarea en curso. Se regenera (se sobrescribe) al final de cada sesión.

**Última actualización:** 2026-07-19 · sesión: **FASE B — Frontend público (núcleo COMPLETO) + webhook de formulario enriquecido**. El cliente **aprobó el diseño** → se levantó el gate de la Fase B. Construido el sitio público fiel al prototipo v3: **Home, Listado, Ficha de propiedad + LeadForm, Nosotros, Contacto, Aviso de Privacidad, SEO** (sitemap/robots/JSON-LD/OG/404). Además, el **webhook `lead.created`** (que dispara el formulario) ahora manda el **snapshot completo de la propiedad** (m² útil/rentable, áreas exteriores, remate, precio, ubicación, enlace, portada). **112 tests API en verde**, OpenAPI **48 rutas**, `pnpm --filter web build` en verde (18 rutas). Verificado en vivo contra la API (incl. la bitácora de entregas).

**Fase actual:** **FASE B — Frontend público: núcleo entregado.** Sigue el prototipo aprobado. **Decisión del cliente: SIN Google Maps** → no hay mapa interactivo (`SearchMap`/página `/mapa` descartados); la ubicación se resuelve con **autocompletado de dirección** (`GET /locations`, ahora público). El lead público entra **solo como contacto** (el asesor agenda la cita). **Avance global:** ~90%. Falta de Fase B solo la optimización de métricas §9 (Lighthouse), que es tarea de **FASE QA** en staging.

## Hecho (resumen; el detalle está en `git log`)
- **FASE 0, 1 (técnica), A (backend §5) y C (backoffice) CERRADAS.** Backend completo: auth (argon2+JWT+refresh), propiedades (CRUD/publish/filtros/`map`/detalle), media (sharp→WebP), leads+webhooks (pg-boss+HMAC), importador EasyBroker, OpenAPI/Swagger en `/docs`. Backoffice fiel al prototipo admin: dashboard, propiedades (asistente+editor), leads (CRM), usuarios, integraciones (webhooks+API keys), scripts.
- **RBAC 4 roles** (admin/editor/ventas/lector, migración 0001) + **Grupo A** (m² oficina, áreas exteriores, remate; migración 0002) + **Grupo B** (flyer, segmentación Meta con feed CSV Home Listings/commerce, videos H/V; migraciones 0003–0005). Todo en el backoffice.
- **FASE B — SITIO PÚBLICO (esta sesión):**
  - **Backend (2 endpoints públicos para el sitio):** `GET /locations` pasó a **público** (autocompletado; solo nombres de lugar, sin PII); nuevo `GET /scripts/public` (scripts de marketing activos agrupados por placement head/body/footer para la inyección). Tests actualizados/añadidos (+2). OpenAPI 48 rutas.
  - **Fundación web** (`apps/web/app/(public)/` + `components/public/`): grupo de rutas con layout (header fijo translúcido→blanco, footer navy con logo blanco), **inyección de `marketing_scripts`** por placement (recrea nodos `<script>` para que se ejecuten). Capa de datos `lib/public.ts` (fetchers SSR/ISR contra endpoints públicos, `formatPricePublic` estilo prototipo —MDP / $/mes, moneda original—, helpers de tipo/ubicación, `buildSuggestions`). Iconos, `PropertyCard`, `LocationAutocomplete` (reutilizable, sin mapa).
  - **Home (`/`)**: hero con `HeroSearch` (operación/tipo/precio/ubicación autocompletada/recámaras → navega al listado), stats strip, **destacadas** (relevancia/premium), **explora por categoría** (sustituye el mapa), **catálogo reciente**, FAQ acordeón.
  - **Listado (`/propiedades`)**: SSR con **filtros en la URL** (operación, tipo, precio máx por operación, recámaras, búsqueda por ubicación) + orden + **cuadrícula/lista** + paginación; sidebar sticky (escritorio) + panel colapsable (móvil).
  - **Ficha (`/propiedades/[slug]`)**: galería (imágenes + **videos H/V**), badges (destacado/remate/tipo), precio+specs, descripción, características (amenidades), **datos** (m² útil/rentable de oficina, áreas exteriores, precio/m²), similares; **LeadForm** (contacto) con **consentimiento LFPDPPP obligatorio + honeypot + captura UTM**, validado con el Zod compartido; **TrackView** (POST /events/track). SEO: metadata + OG + **JSON-LD RealEstateListing**; 404 propio.
  - **Contenido**: Nosotros (historia/trayectoria/valores), Contacto (datos + LeadForm general), Aviso de Privacidad (LFPDPPP, noindex).
  - **SEO**: `sitemap.xml` dinámico (estáticas + todas las propiedades disponibles) + `robots.txt` (bloquea `/admin` y `/api`). `next/font` (familia DM) + `next/image` con `remotePatterns` (localhost dev + host de prod por `NEXT_PUBLIC_MEDIA_HOSTNAME`).
  - **Verificado en vivo** contra la API dev: `/`, `/propiedades` (filtros combinados cambian el conteo: 11 → venta+depto 1, polanco 1, renta 6), `/propiedades/[slug]` 200 + 404 correcto, **lead 201 / honeypot 400**, `/nosotros`,`/contacto`,`/aviso-privacidad`,`/sitemap.xml`,`/robots.txt` 200. `typecheck`+`lint`+**`build` (18 rutas)** en verde.
  - **Webhook del formulario enriquecido** (`lead.created`): el `POST /leads` público ya disparaba el webhook; ahora el payload incluye el **lead completo** + un **snapshot de la propiedad** con los campos del Grupo A/B (m² útil/rentable, patio/terraza/balcón/jardín, remate, precio, ubicación, `url`, portada), como `property.published`. El CRM/n8n recibe todo sin 2ª llamada. Reflejado en el panel (Ajustes → Integraciones → referencia de payloads). Prueba de contrato + verificado por la bitácora de entregas. **El flujo requiere suscribir un webhook a `lead.created`** en Ajustes → Integraciones (apuntando a la URL del CRM/n8n).

## Siguiente (máx. 3)
1. **Pulido de Fase B**: revisar el sitio en el navegador (WSL) con el cliente; ajustar textos/datos de contacto reales (footer, contacto, aviso), y publicar inventario real (los 105 importados están en `borrador` sin geo → al llegar coords se publican y aparecen en el sitio). Actualizar `MANUAL`/reportes con la Fase B.
2. **FASE QA (§9)**: aprovisionar el servidor Ubuntu cuando el cliente dé accesos; staging; **Lighthouse** sobre `/propiedades` móvil hasta cumplir métricas (LCP<2.5s, INP<100ms, CLS<0.10, TTFB<600ms, Perf≥90); E2E Playwright (login admin, publicar, buscar, enviar lead); caché HTTP/ETag en GET públicos.
3. **FASE Lanzamiento**: deploy prod (Caddy/TLS), respaldos 3 capas, corrida definitiva del importador (antes de cancelar EasyBroker), capacitación, entrega.

## Decisiones / desviaciones respecto al PRD
- **2026-07-19: diseño APROBADO por el cliente** → Fase B desbloqueada.
- **2026-07-19: SIN Google Maps API** (cliente). Se descartan `SearchMap` y la página `/mapa` del §7.1; la ubicación se resuelve con autocompletado de texto (`/locations`). El endpoint `/properties/map` sigue disponible por si se reactiva con otra tecnología.
- **Lead público = solo contacto** (decisión ronda 1): el formulario público no ofrece "agendar cita"; el asesor agenda tras el contacto. El backend sigue soportando `type=cita`.
- **Ruta canónica de la ficha = `/propiedades/:slug`** (no la de 3 niveles del PRD), consistente con el enlace ya usado en los payloads de webhook.
- **Precio**: display siempre en moneda original; ventas MXN grandes se compactan a "MDP" (como el prototipo). Sigue pendiente el ajuste **$/m²** del importador (guarda el valor unitario como total en comerciales por m²) — revisar antes del Lanzamiento.
- Rojo de marca `#D2103E`; tipografías familia DM (DM Serif Display / DM Sans / DM Mono) vía `next/font`.

## Bloqueos / pendientes del cliente
- **Datos reales**: teléfono/correo/dirección para footer, contacto y aviso de privacidad (hoy son los del prototipo); texto oficial del aviso (el PDF era escaneado). Dominio definitivo.
- **API keys**: Google Maps (ya NO bloquea el sitio; solo si algún día se quiere geocodificar el inventario en `borrador`), SendGrid (para el correo real de leads).
- **Accesos al servidor Ubuntu** para FASE QA.
- Publicar el inventario real (105 en `borrador`): al no haber geocoding siguen sin `geo`; el sitio público solo muestra `disponible`/`apartado` (hoy ~11 de muestra).

## Cómo retomar
- `git log --oneline -15` = avance real. Casillas `[x]` en `PLAN_EJECUCION_FASES.md` = checklist.
- Levantar: `pnpm db:up` + `pnpm dev` (o api y web por separado). BD dev = `tar_portal`. Admin: `/admin/login` (`admin@tarinternacional.com` / `admin123`).
- **Sitio público**: `/` (Home), `/propiedades` (listado con filtros en la URL), `/propiedades/[slug]` (ficha + LeadForm), `/nosotros`, `/contacto`, `/aviso-privacidad`. Todo SSR/ISR contra los endpoints públicos.
- **Acceso desde Windows (WSL)**: `http://<IP-WSL>:3000/` (la IP la da `hostname -I`); api y web escuchan en `0.0.0.0`; CORS de dev y host de media son dinámicos.
- **Suite**: `pnpm --filter api test` → **111 verdes** (DB Docker arriba). `pnpm --filter web build` valida el sitio.
- **next/image**: en dev el optimizador busca media en `localhost:4000` (funciona aun abriendo por IP de WSL, porque el fetch lo hace el server de Next). En prod, fijar `NEXT_PUBLIC_MEDIA_HOSTNAME` (host de media) para `remotePatterns`.
