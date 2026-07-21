# ESTADO — Plataforma TAR Internacional

> **Partida guardada del proyecto.** Este archivo (+ `git log`) es lo ÚNICO que se lee al iniciar sesión. NO releer el PRD, el plan ni el código completos: consultar solo la sección puntual que toque la tarea en curso. Se regenera (se sobrescribe) al final de cada sesión.

**Última actualización:** 2026-07-20 · sesión: **FASE B — Grupo 2 de pulido de código COMPLETO** (todo lo que no depende del cliente). Entregado: (1) **error boundary** del sitio público (`error.tsx`); (2) **revalidación on-demand (ISR)** — al publicar/despublicar/cambiar estatus, la API avisa al sitio y refresca al instante (antes tardaba hasta 1 h); (3) **scripts de marketing `head` en SSR** (GTM/consent cargan antes de la hidratación); (4) **`loading.tsx`** del listado (feedback al cambiar filtros); (5) menores: **paginación con elipsis**, **imagen OG por defecto** (next/og, 1200×630, todo el grupo público), **JSON-LD Organization/WebSite/SearchAction** en la home. **112 tests API en verde**, `typecheck`+`lint`+`build` web en verde. **Verificado end-to-end en vivo**: cambio de estatus vía API → log `sitio público revalidado` + `POST /revalidate 200` en el web; OG genera PNG real (image/png 148 KB); JSON-LD presente en la home; `/revalidate` responde 200/401 según secreto.

**Fase actual:** **FASE B — Frontend público: núcleo + pulido de código (Grupo 2) entregados.** Sigue el prototipo aprobado. **Decisión del cliente: SIN Google Maps** → no hay mapa interactivo (`SearchMap`/página `/mapa` descartados); la ubicación se resuelve con **autocompletado de dirección** (`GET /locations`, ahora público). El lead público entra **solo como contacto** (el asesor agenda la cita). **Avance global:** ~92%. Lo que falta de Fase B ya NO es código propio: depende del cliente (Grupo 1) o es FASE QA/§9 (Grupo 3, Lighthouse).

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
- **FASE B — PULIDO DE CÓDIGO / GRUPO 2 (sesión 2026-07-20):**
  - **`error.tsx`** del grupo público (Client Component con `reset`), en línea con el `not-found.tsx` existente.
  - **Revalidación on-demand (ISR)**: nuevo helper API `lib/revalidate.ts` (`revalidatePublicSite` + `propertyRevalidatePaths`) llamado tras `publishProperty`/`unpublishProperty`/`updateStatus` (se añadió `slug` al select de los dos últimos). Pega a `PUBLIC_SITE_URL/revalidate`, un **route handler de Next** (`apps/web/app/revalidate/route.ts`) protegido por **`REVALIDATE_SECRET`** (nuevo env compartido; en `.env.example` en API y Web). Ruta fuera de `/api/*` a propósito (Caddy enruta `/api/*` a Express). Best-effort con timeout 4 s: sin secreto o si el sitio no responde, **no bloquea** la operación (en dev/test queda desactivada → los 112 tests intactos).
  - **Scripts `head` en SSR**: nuevo `components/public/marketing-scripts-head.tsx` (Server Component, `dangerouslySetInnerHTML`) renderizado en el layout; el injector cliente `marketing-scripts.tsx` ahora maneja SOLO `body`/`footer` (evita doble inyección).
  - **`loading.tsx`** del listado (`/propiedades`): skeleton fiel (barra+sidebar+grid) mientras Next re-renderiza en SSR al cambiar filtros.
  - **Menores**: paginación con ventana + **elipsis** (`paginationRange`, ya no un botón por página) + `aria-current`; **imagen OG por defecto** vía convención `opengraph-image.tsx` con `next/og` (1200×630, marca navy/rojo/dorado) para todo el grupo público (la ficha la sobrescribe con su portada); **JSON-LD** `RealEstateAgent`+`WebSite`+`SearchAction` en la home (sin teléfono/dirección aún — datos del cliente pendientes).

## Siguiente — BACKLOG FASE B (Grupo 2 CERRADO 2026-07-20; quedan Grupo 1 cliente + Grupo 3 QA)
> Grupo 2 (pulido de código) completado y verificado. Lo que queda NO es código propio.

**Grupo 1 — Depende del cliente (no es código; bloquea "cerrar", no "avanzar"):**
- Datos reales de contacto en footer, `/contacto` y `/aviso-privacidad` (hoy son los del prototipo, ficticios: `+52 55 1234 5678`, `info@tarint.mx`, `privacidad@tarint.mx`, `Av. Paseo de la Reforma 123`) + **texto oficial del aviso** (el PDF era escaneado).
- **Publicar inventario real**: 105 propiedades importadas siguen en `borrador` sin `geo` (publicar exige ubicación) → el sitio se ve vacío (solo ~11 de muestra `disponible`). Geocodificar o fijar pines a mano.
- Dominio definitivo + SendGrid (correo de aviso de lead) + `NEXT_PUBLIC_MEDIA_HOSTNAME` en prod + **fijar `REVALIDATE_SECRET`** (mismo valor en API y Web) para activar la revalidación on-demand.

**Grupo 3 — FASE QA (§9), formalmente fuera de Fase B pero necesario para "calidad de entrega":**
- **Lighthouse** sobre `/propiedades` móvil en staging hasta cumplir métricas (LCP<2.5s, INP<100ms, CLS<0.10, TTFB<600ms, Perf≥90). Atención al LCP: el hero de la home carga una imagen grande.
- **Caché HTTP + ETag** en los GET públicos.
- **E2E Playwright** (login admin, publicar, buscar con filtros, enviar lead). Requiere el servidor Ubuntu (accesos del cliente).

**Después:** FASE Lanzamiento — deploy prod (Caddy/TLS), respaldos 3 capas, corrida definitiva del importador (antes de cancelar EasyBroker), capacitación, entrega.

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
- **Suite**: `pnpm --filter api test` → **112 verdes** (DB Docker arriba). `pnpm --filter web build` valida el sitio.
- **Revalidación on-demand**: desactivada mientras `REVALIDATE_SECRET` esté vacío (el sitio se refresca solo por tiempo, ISR). Para activarla en prod, fijar el MISMO secreto en el `.env` de API y de Web; la API llamará a `PUBLIC_SITE_URL/revalidate` en cada publish/unpublish/cambio de estatus.
- **next/image**: en dev el optimizador busca media en `localhost:4000` (funciona aun abriendo por IP de WSL, porque el fetch lo hace el server de Next). En prod, fijar `NEXT_PUBLIC_MEDIA_HOSTNAME` (host de media) para `remotePatterns`.
