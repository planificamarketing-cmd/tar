# ESTADO — Plataforma TAR Internacional

> **Partida guardada del proyecto.** Este archivo (+ `git log`) es lo ÚNICO que se lee al iniciar sesión. NO releer el PRD, el plan ni el código completos: consultar solo la sección puntual que toque la tarea en curso. Se regenera (se sobrescribe) al final de cada sesión.

**Última actualización:** 2026-08-03 · sesión: **MAPA INTERACTIVO (reactivado)**. El mapa estaba marcado como *descartado por el cliente*; se pidió de vuelta y se construyó completo: vista de mapa en el buscador, mapa en la ficha y pin arrastrable en el panel. **112 tests API en verde**, `lint` + `typecheck` + `build` web en verde. Endpoint verificado en vivo. **Falta la API key de Google Maps para verlo renderizado.**

**Fase actual:** **FASE B — sitio público.** Avance global ~95%. Lo que falta para cerrar depende del cliente (key de Maps, datos reales, inventario publicado, accesos de prod) o es FASE QA / LANZAMIENTO.

## Hecho esta sesión (2026-08-03) — el mapa
Backend ya existía (`GET /properties/map` con PostGIS `ST_Within` + bbox); todo lo nuevo es frontend.

1. **`SearchMap`** — tercera vista del listado (`/propiedades?view=map`, botón junto a cuadrícula/lista).
   - **supercluster** en cliente (`radius 64`, `maxZoom 16`, `minPoints 3`).
   - Marcadores **price-pill** (`map-marker.tsx`): navy, **dorado + ★** si premium/destacada, **rojo de marca** al seleccionar; burbuja navy con conteo para clusters (clic → `getClusterExpansionZoom` + `panTo`).
   - **Clic en pin → vista previa** (`map-preview-card.tsx`): miniatura, ubicación, specs, precio, enlace a la ficha. Se pide bajo demanda a `/properties/:slug` y se memoriza en un `Map` del componente.
   - **Búsqueda por desplazamiento**: `idle` → bbox → refetch, con `AbortController` para cancelar la petición anterior. Casilla **"Buscar al mover el mapa"** (ON por defecto); apagada aparece el botón **"Buscar en esta zona"**.
   - Encuadre inicial: primera carga **sin bbox** → `fitBounds` sobre el inventario filtrado; a partir de ahí manda el bbox visible. Al cambiar los filtros de la URL se vuelve a encuadrar (`filtersKey` = JSON de filtros).
2. **Mapa en la ficha** (`property-map.tsx`): sección "Ubicación" con el pin, dirección y **"Cómo llegar"** (`maps/dir/?api=1&destination=`). Solo si la propiedad tiene `geo`.
3. **`LocationPicker` con mapa** (`location-map.tsx`): clic en el mapa o **pin arrastrable** para fijar `geo`; `Recenter` reposiciona al pegar un enlace de Maps o teclear coordenadas (no al arrastrar, para no dar el salto). Pegado de enlaces y captura manual siguen funcionando.
4. **Rendimiento (§9)**: los tres mapas se montan con `next/dynamic ssr:false` desde wrappers `*-loader.tsx`. Verificado: chunks aparte (`search-map.tsx.js`, `property-map.tsx.js`) y **First Load JS de `/propiedades` sin cambio (~110 kB)**.
5. **Degradado sin API key**: `mapsEnabled` (en `lib/maps.ts`) es false → aviso claro en las tres pantallas, **nunca un error**; el resto del sitio funciona al 100%.

**Verificado en vivo:** `/properties/map` → 12 puntos totales, **9** con bbox CDMX, **0** con bbox Yucatán, **7** con `operation=renta`, **6** combinando bbox+renta → bbox y filtros componen. Rutas `/propiedades`, `?view=map` y `?view=map&operation=renta` → 200.

**Docs:** `docs/reportes/semana-10.md` (nuevo, tono cliente), índice de reportes, `PLAN` (tarea `SearchMap` marcada `[x]`, DoD actualizada), `MANUAL-ADMIN` §4.4 y §10, `PUESTA-EN-MARCHA` §4. `.env.example`: `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` nuevo.

## Hecho (resumen previo; detalle en `git log`)
- **FASE 0, 1, A (backend §5) y C (backoffice) CERRADAS.** Auth (argon2+JWT+refresh), propiedades (CRUD/publish/filtros/detalle), media (sharp→WebP), leads+webhooks (pg-boss+HMAC), importador EasyBroker, OpenAPI/Swagger en `/docs`. RBAC 4 roles + Grupos A/B (migraciones 0001–0005).
- **FASE B:** home, listado, ficha, contenido, SEO, lead público, error boundary, revalidación on-demand, scripts head SSR, OG, JSON-LD.
- **Sesión 2026-07-28:** 9 peticiones del cliente (orden premium/remate, folleto PDF con pdfkit, logo, buscador y filtros avanzados, short links de Maps, separadores de miles, UTM en webhooks), **exportación CSV** de leads/inventario, **panel admin responsive** (vista de tarjetas en móvil), Reporte 03.

## Siguiente — pendientes
**Depende del cliente (bloquea "cerrar"):**
- 🔑 **API key de Google Maps + Map ID** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`) → es lo único que falta para ver el mapa renderizado; restringir por referrer al dominio final.
- Datos reales de contacto + Aviso de Privacidad oficial.
- **Publicar el inventario real con ubicación** (105 props en borrador sin geo → el mapa y el sitio se ven vacíos).
- Dominio + SendGrid + `NEXT_PUBLIC_MEDIA_HOSTNAME` + fijar `REVALIDATE_SECRET` (mismo valor API/Web).
- Firma del diseño (cierra la ventana de cambios UI).

**Huecos de código/infra detectados esta sesión (NO están hechos, ordenados por impacto):**
1. **Infra de producción inexistente:** no hay `infra/deploy.sh`, ni `infra/Caddyfile` (solo `.demo`), ni `docker-compose.prod.yml`, ni `infra/backup/`. Hoy el proyecto **no se puede desplegar** aunque llegue el servidor. Es el hueco más grande.
2. **E2E Playwright: cero.** `pnpm test:e2e` corre en vacío (ningún paquete define el script). Faltan los 4 flujos del plan.
3. **Lighthouse CI:** no existe `pnpm lighthouse` ni `lighthouserc`, pese a estar documentado. §9 es contrato.
4. **CI incompleto:** `.github/workflows/ci.yml` corre lint+typecheck+build pero **no los tests**, ni e2e, ni Lighthouse como gate.
5. **Caché HTTP + ETag:** solo 2 endpoints tienen `Cache-Control`, ninguno ETag (§9, TTFB).
6. **Entregables §15:** falta `docs/README-DEPLOY.md`, ERD en PDF, manual admin en PDF, checklist de `SETUP_SERVIDOR_UBUNTU.md` cerrado.

## Notas de esta sesión
- `Map` de `@vis.gl/react-google-maps` **choca con el `Map` nativo** de JS: se importa como `GoogleMap`. Costó un error de tipos confuso (`useRef(new Map())`).
- Los marcadores HTML (`AdvancedMarker`) **exigen un Map ID** de Google Cloud. Sin `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` se usa `DEMO_MAP_ID` (válido para dev, no para producción).
- Se instalaron `@vis.gl/react-google-maps`, `supercluster`, `@types/supercluster` y `@types/google.maps` (este último no venía hoisted y faltaba el namespace `google`).
- Cuidado: **no correr `pnpm build` mientras `pnpm dev` está activo** (comparten `apps/web/.next`).

## Recordatorio
Lee solo la sección del PRD/plan que toque la tarea actual. No releas todo.
