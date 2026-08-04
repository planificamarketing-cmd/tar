# ESTADO — Plataforma TAR Internacional

> **Partida guardada del proyecto.** Este archivo (+ `git log`) es lo ÚNICO que se lee al iniciar sesión. NO releer el PRD, el plan ni el código completos: consultar solo la sección puntual que toque la tarea en curso. Se regenera (se sobrescribe) al final de cada sesión.

**Última actualización:** 2026-08-04 · sesión: **MAPA (Google → Leaflet) + INFRAESTRUCTURA DE PRODUCCIÓN**. Tres bloques: (1) se reactivó el mapa que estaba descartado y se construyó completo; (2) se construyó desde cero toda la infra de despliegue, que **no existía**; (3) al descartar el cliente la cuenta de Google, se **migró el mapa a Leaflet + OpenStreetMap** (sin llave). **112 tests API en verde**, `lint` + `typecheck` + `build` en verde, **stack de producción probado de punta a punta** y **mapa verificado con capturas en navegador real**.

**Fase actual:** cierre de **FASE B** + adelanto de **FASE QA/LANZAMIENTO**. Avance global ~96%. Lo que falta depende del cliente (servidor, datos reales, inventario publicado) o es QA medible solo en el servidor. **El mapa funciona sin depender de nadie**: Leaflet + OpenStreetMap, sin llave ni cuenta.

---

## Bloque 1 (2026-08-03) — el mapa
Backend ya existía (`GET /properties/map`, PostGIS `ST_Within` + bbox); todo lo nuevo es frontend.

1. **`SearchMap`** — tercera vista del listado (`/propiedades?view=map`, botón junto a cuadrícula/lista).
   - **supercluster** en cliente (`radius 64`, `maxZoom 16`, `minPoints 3`).
   - Marcadores **price-pill** (`map-marker.ts`): navy, **dorado + ★** premium/destacada, **rojo de marca** al seleccionar; burbuja con conteo para clusters (clic → `getClusterExpansionZoom` + `setView`).
   - **Clic en pin → vista previa** (`map-preview-card.tsx`): miniatura, ubicación, specs, precio, enlace a la ficha. Se pide bajo demanda a `/properties/:slug` y se memoriza.
   - **Búsqueda por desplazamiento**: `moveend` (cubre arrastre y zoom) → bbox → refetch con `AbortController`. Casilla "Buscar al mover el mapa" (ON); apagada aparece "Buscar en esta zona".
   - Encuadre inicial: primera carga **sin bbox** → `fitBounds`; luego manda el bbox visible. Cambiar filtros vuelve a encuadrar (`filtersKey`).
2. **Mapa en la ficha** (`property-map.tsx`): sección "Ubicación" con pin, dirección y **"Cómo llegar"** (enlace a Google Maps del visitante, no cuesta nada). Solo si hay `geo`. `scrollWheelZoom={false}` para no secuestrar el scroll de la página.
   - Fix detectado en las capturas: la dirección salía **duplicada** ("Roma Norte, Cuauhtémoc, Roma Norte, Cuauhtémoc") cuando el campo `address` ya incluía la colonia — habitual en datos importados. Nuevo helper `displayAddress()` en `lib/public.ts`.
3. **`LocationPicker` con mapa** (`location-map.tsx`): clic o **pin arrastrable**; `Recenter` reposiciona al pegar un enlace de Maps o teclear coordenadas (no al arrastrar). Pegado de enlaces y captura manual siguen como respaldo.
4. **Rendimiento (§9)**: los tres mapas con `next/dynamic ssr:false` desde wrappers `*-loader.tsx` → chunks aparte; **First Load JS de `/propiedades` sin cambio (~110 kB)**.
5. **PROVEEDOR: Leaflet + CARTO/OpenStreetMap, NO Google Maps** (desviación del PRD §7.0, decidida con el cliente el 2026-08-03: no quiso abrir cuenta de facturación en Google). Sin llave, sin tarjeta, sin cuotas. Los mosaicos son **configurables por entorno** (`NEXT_PUBLIC_MAP_TILES_URL` / `..._ATTRIBUTION`) para poder cambiar de proveedor sin tocar código; por defecto CARTO "voyager". **La atribución es obligatoria por licencia de OSM: no quitarla.**
   - Se eliminaron `@vis.gl/react-google-maps`, `@types/google.maps` y todo el *gating* por API key (`mapsEnabled` ya no existe).
   - `map-marker.tsx` → `map-marker.ts`: los marcadores pasaron de componentes React a **funciones que devuelven HTML** (Leaflet usa `divIcon`, que recibe una cadena) — así se evita meter `react-dom/server` en el bundle. Las clases de Tailwind dentro de las plantillas SÍ las detecta el rastreador.
   - Anclaje de marcadores: icono de **0×0** + contenido en absoluto con `translate(-50%,-100%)`, para que la punta caiga en la coordenada sin importar el ancho de la etiqueta.
   - El control de zoom va **abajo a la derecha** (`zoomControl={false}` + `<ZoomControl position="bottomright" />`): arriba a la izquierda tapaba el contador.

**Verificado:** `/properties/map` → 12 puntos, **9** con bbox CDMX, **0** en Yucatán, **7** con `operation=renta`, **6** combinando → bbox y filtros componen. Rutas `?view=map` → 200.

## Bloque 2 (2026-08-03) — infraestructura de producción
No existía **nada**: ni `deploy.sh`, ni `Caddyfile`, ni compose de producción, ni respaldos. Se construyó y **se probó todo en local**.

- **`apps/api/Dockerfile` y `apps/web/Dockerfile`** — multi-stage con pnpm. Truco clave: `node-linker=hoisted` en las etapas de instalación (el árbol de enlaces simbólicos de pnpm se rompe al copiar entre etapas de Docker). La web sale como Next `standalone`.
- **`infra/docker-compose.prod.yml`** — `db`, `migrate` (una vez, con `service_completed_successfully` bloqueando a la API), `api`, `web`, `caddy`. **Solo Caddy publica puertos**; verificado que 5432/4000/3000 quedan cerrados desde el host.
- **`infra/Caddyfile`** — un solo origen (sin CORS), TLS automático, `zstd gzip`, cabeceras de seguridad, `/media` servido desde disco con caché inmutable, `www` → dominio canónico, `import /etc/caddy/sites/*.caddy` para staging.
- **`infra/deploy.sh`** — valida el `.env` (detecta los errores clásicos: `DATABASE_URL` a localhost, URLs de dev, falta de la carpeta de media), construye, migra, levanta, comprueba el health y ofrece `--rollback`.
- **`infra/docker-compose.staging.yml` + `caddy-sites/`** — staging en el mismo servidor, BD aparte, no indexable, auth básica.
- **`infra/backup/backup.sh` y `restore.sh`** — 3 capas; verificación de integridad de cada archivo; rotación 30 días; `rclone sync` a R2; restore con `--dry-run`, confirmación escrita y respaldo de seguridad de las imágenes previas.
- **`apps/api/src/migrate.ts` y `create-admin.ts`** — nuevos entries de tsup. Sin ellos no se podía migrar ni **entrar al panel** de una instalación nueva.
- **`docs/README-DEPLOY.md`** — manual completo para quien opere el servidor.

**Verificado en local (stack real levantado con `./infra/deploy.sh`):**
- Despliegue completo en verde; `/health` con `"db":true` y PostGIS 3.4.3.
- A través de Caddy con HTTPS: `/`, `/propiedades`, `/admin`, `/health`, `/api/v1/properties`, `/docs/openapi.json` → **200**. HTTP → **308** a HTTPS.
- `content-encoding: gzip`; HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy` presentes; `cache-control: immutable` en `/media` y `/_next/static`.
- **5432, 4000 y 3000 cerrados** desde el host.
- **Respaldo → marcador nuevo → restauración → el marcador posterior desaparece** y los previos quedan: el corte temporal es correcto.
- `create-admin` crea y es idempotente (repetirlo actualiza la contraseña).

### Dos problemas reales que aparecieron (y su arreglo)
1. **El build de la web moría si la API no respondía.** `/` y `/nosotros` se prerrenderizan en `next build` y tiraban el build entero → habría bloqueado el despliegue en el servidor. Se añadieron `fetchPropertiesSafe`/`fetchLocationsSafe` (las páginas dinámicas siguen estrictas).
2. **`pg_dump --clean` no puede restaurar.** Las tablas particionadas de pg-boss tienen restricciones heredadas que no se sueltan una a una. Ahora el volcado va sin `--clean` y `restore.sh` **recrea la base** (`DROP DATABASE ... WITH (FORCE)` + `CREATE`) antes de cargarlo.

---

## Hecho (resumen previo; detalle en `git log`)
- **FASE 0, 1, A (backend §5) y C (backoffice) CERRADAS.** Auth (argon2+JWT+refresh), propiedades (CRUD/publish/filtros/detalle), media (sharp→WebP), leads+webhooks (pg-boss+HMAC), importador EasyBroker, OpenAPI/Swagger en `/docs`. RBAC 4 roles + Grupos A/B (migraciones 0001–0005).
- **FASE B:** home, listado, ficha, contenido, SEO, lead público, error boundary, revalidación on-demand, OG, JSON-LD.
- **Sesión 2026-07-28:** 9 peticiones del cliente (orden premium/remate, folleto PDF, buscador y filtros avanzados, short links de Maps, separadores de miles, UTM), exportación CSV, panel admin responsive, Reporte 03.

## Siguiente — pendientes
**Depende del cliente (bloquea "cerrar"):**
- 🖥️ **Servidor Ubuntu + dominio** → para ejecutar el despliegue que ya está construido y probado.
- 🗺️ **Mapa: ya no depende del cliente.** Funciona con Leaflet + OpenStreetMap. Lo único pendiente es **dejar por escrito la desviación** respecto al PRD §7.0 (que contemplaba Google Maps). No bloquea nada.
- Datos reales de contacto + Aviso de Privacidad oficial.
- **Publicar el inventario real con ubicación** (105 props en borrador sin geo → mapa y sitio casi vacíos).
- SendGrid, `NEXT_PUBLIC_MEDIA_HOSTNAME`, `REVALIDATE_SECRET`, Cloudflare R2.
- Firma del diseño.
- ⚠️ **Corrida final del importador ANTES de cancelar EasyBroker** (al cancelar mueren las URLs de las imágenes).

**Huecos de código que siguen abiertos (ordenados por impacto):**
1. **E2E Playwright: cero.** `pnpm test:e2e` corre en vacío (ningún paquete define el script). Faltan los 4 flujos del plan.
2. **Lighthouse CI:** no existe `pnpm lighthouse` ni `lighthouserc`, pese a estar documentado en CLAUDE.md. §9 es contrato.
3. **CI incompleto:** `.github/workflows/ci.yml` corre lint+typecheck+build pero **no los tests**, ni e2e, ni Lighthouse como gate.
4. **Caché HTTP + ETag en la API:** solo 2 endpoints tienen `Cache-Control`, ninguno ETag (§9, TTFB). Ojo: Caddy ya cachea media y assets, esto es para los GET públicos de la API.
5. **Entregables §15:** falta ERD y manual de administración **en PDF**.

## Notas técnicas de esta sesión
- `Map` de `@vis.gl/react-google-maps` **choca con el `Map` nativo**: se importa como `GoogleMap`.
- `AdvancedMarker` (marcadores HTML) **exige un Map ID**; sin `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` se usa `DEMO_MAP_ID` (dev, no producción).
- Deps nuevas: `@vis.gl/react-google-maps`, `supercluster`, `@types/supercluster`, `@types/google.maps` (este último no venía hoisted).
- Las `NEXT_PUBLIC_*` se **incrustan al construir** la imagen web → llegan como `ARG` en el compose; cambiarlas exige reconstruir (por eso `deploy.sh` siempre reconstruye).
- Docker + pnpm: usar `node-linker=hoisted` o los `COPY --from` entre etapas dejan enlaces simbólicos rotos.
- Cuidado: **no correr `pnpm build` mientras `pnpm dev` está activo** (comparten `apps/web/.next`).
- Para probar el stack de producción en local hay que sustituir el `.env` temporalmente: **respaldarlo antes** y confirmar el md5 al restaurarlo.

## Recordatorio
Lee solo la sección del PRD/plan que toque la tarea actual. No releas todo.
