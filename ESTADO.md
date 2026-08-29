# ESTADO — Plataforma TAR Internacional

> **Partida guardada del proyecto.** Este archivo (+ `git log`) es lo ÚNICO que se lee al iniciar sesión. NO releer el PRD, el plan ni el código completos: consultar solo la sección puntual que toque la tarea en curso. Se regenera (se sobrescribe) al final de cada sesión.

**Última actualización:** 2026-08-29 · sesión: **AJUSTES PEDIDOS POR EL CLIENTE** (privacidad de la ubicación, exclusivas, marca y folleto hacia el prospecto). Antes de empezar se trajeron de `origin/main` 6 commits del 18 de agosto (geocodificación del inventario, página `/mapa`, hero a pantalla completa y galería con lightbox) y se verificaron: `lint` + `typecheck` + **112 tests** en verde. Al cerrar la sesión: **121 tests**, `lint`, `typecheck` y `build` de producción en verde.

**Fase actual:** Fase B cerrada + **bloque de ajustes del cliente** (ver `PLAN_EJECUCION_FASES.md` → "Ajustes solicitados por el cliente"). Avance global ~97%. Lo que falta depende del cliente (servidor, dominio, datos oficiales, marcar exclusivas) o es QA medible solo en el servidor.

---

## Lo hecho en esta sesión (2026-08-29)
Criterio de negocio detrás de casi todo: **TAR no divulga la ubicación exacta hasta que la operación avanza al cierre**.

1. **Dirección opcional en el folleto PDF, apagada por defecto** (`flyer-pdf.service.ts`).
   - `generateFlyerPdf(id, { includeAddress })` — por defecto `false`.
   - Público (`/properties/:slug/flyer.pdf`) → **siempre sin calle**. Staff (`/properties/admin/:id/flyer.pdf`) → **con calle**, salvo `?direccion=0`.
   - Panel: botón nuevo **"PDF sin dirección"** junto a **"Folleto PDF"**; el archivo baja con sufijo `-sin-direccion`.
   - `locationLine()` (exportada, con test unitario) evita la colonia duplicada del inventario importado.
2. **La ficha pública ya no imprime la calle** (`propiedades/[slug]/page.tsx`): solo colonia/municipio/estado. `displayAddress()` queda en `lib/public.ts` sin usarse, por si se revierte.
3. **Zona aproximada en el mapa de la ficha** (`property-map.tsx`): se conserva el pin (así lo pidió el cliente) y se añade un `Circle` de **400 m** configurable con `NEXT_PUBLIC_MAP_AREA_RADIUS_M`, más la nota al pie. Zoom inicial 15 → 14 para que el círculo entre completo.
4. **Logo del portal más grande** (`site-header.tsx`): 52/66 px → **64/84 px**, con `py` reducido. Se reajustó el `pt-*` de todas las páginas públicas (`/propiedades`, `[slug]`, `/mapa`, `/nosotros`, `/contacto`, `/aviso-privacidad`).
5. **Campo "En exclusiva"** (migración `0006_exotic_sunfire.sql`, columna `is_exclusive`).
   - **Cuenta como destacada** en el `featuredRank` del orden por relevancia → entra sola a la portada. Verificado en vivo.
   - Insignia en tarjeta, fila, ficha, vista previa del mapa, panel y **los dos flyers** (PNG y PDF).
   - Filtro `?exclusiva=true` (listado admin y exportación), columna en el CSV, casilla en el editor, se copia al duplicar, viaja en el snapshot de los webhooks.
   - El seed marca el **loft de Roma Norte** como exclusiva con destaque *normal*: sirve para comprobar el orden.
6. **Ficha PDF hacia el prospecto por webhook** (`leads.service.ts`): `data.property.flyer = { url, filename, contentType, includesAddress: false }` en `lead.created`, solo si la propiedad está publicada. Nueva env **opcional** `PUBLIC_API_URL` (si falta, se deriva de `PUBLIC_SITE_URL` + `/api/v1`, que es lo correcto en producción detrás de Caddy).

**Documentación al día:** `docs/MANUAL-ADMIN.md` (dos versiones del folleto, campo exclusiva, receta de n8n para adjuntar el PDF), `docs/README-DEPLOY.md` y `.env.example` (dos variables nuevas), `docs/reportes/semana-11.md` + índice, y el bloque "Ajustes solicitados por el cliente" en `PLAN_EJECUCION_FASES.md`.

## Cómo verificarlo rápido
```bash
pnpm --filter api dev &                 # API en :4000 (Docker `tar-db` arriba)
curl -s "localhost:4000/api/v1/properties?sort=relevancia&limit=6"   # el loft exclusiva sale en la portada
curl -so f.pdf "localhost:4000/api/v1/properties/<slug>/flyer.pdf"   # 200, PDF sin calle
pnpm test                                # 121 en verde
```

## Pruebas de navegador (Playwright) — nuevo en esta sesión
`@playwright/test` instalado en `apps/web` con `playwright.config.ts` (proyectos **escritorio 1440** y **móvil 390**; levanta API y web solo si no están corriendo). `pnpm test:e2e` → **18 en verde**, 0 omitidas. Especificaciones en `apps/web/e2e/`: humo del sitio público y verificación de los ajustes de agosto (altura del logo medida sobre el elemento, ausencia de la calle en la ficha, círculo + pin en el mapa, insignia Exclusiva y su entrada a la portada). Capturas en `apps/web/test-results/capturas/` (ignorado por git).
- **Requisito del SO (una vez):** `sudo apt-get update && sudo apt-get install -y libnss3 libnspr4 libasound2t64`. Sin eso Chromium no arranca (`libnspr4.so`). No usar `playwright install-deps`: quiere 244 paquetes (Firefox, WebKit, xvfb).
- El seed ahora pone **calle real** en dos propiedades (`street`), porque antes guardaba "Colonia, Municipio" como dirección y no se podía comprobar que el portal la oculta.

## Mosaicos del mapa: CARTO → OpenStreetMap estándar (2026-08-29)
Las capturas del navegador destaparon que **CARTO empezó a estampar "API KEY REQUIRED"** sobre los mosaicos servidos sin llave (comprobado también con `curl` al tile: responde 200 pero marcado). El cliente descartó abrir cuenta también en CARTO, así que el valor por defecto de `MAP_TILES_URL` pasa a los **mosaicos estándar de OpenStreetMap** (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`), que responden limpios y sin cuenta. Verificado en navegador: ficha y `/mapa` pintan el mosaico completo, con la atribución obligatoria.
- Sin `{s}` (subdominios) ni `{r}` (retina): esa URL no los admite.
- **Condición de uso:** atribución visible, nada de descargas masivas y tráfico razonable. Si el portal creciera, la salida es proveedor de pago o servidor propio — solo cambian dos variables de entorno.

## Pendiente del cliente
- Confirmar si la **ficha del portal** debe quedarse sin calle (hoy así está) y si **400 m** es el radio correcto del círculo.
- **Marcar en el panel** qué propiedades son exclusivas (el campo existe, el dato lo tiene TAR).
- Los de siempre: servidor, dominio, datos oficiales de contacto.

## Recordatorio
Lee solo la sección del PRD/plan que toque la tarea actual. No releas todo.
