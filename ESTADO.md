# ESTADO — Plataforma TAR Internacional

> **Partida guardada del proyecto.** Este archivo (+ `git log`) es lo ÚNICO que se lee al iniciar sesión. NO releer el PRD, el plan ni el código completos: consultar solo la sección puntual que toque la tarea en curso. Se regenera (se sobrescribe) al final de cada sesión.

**Última actualización:** 2026-07-28 · sesión: **FASE B — mejoras solicitadas por el cliente + Reporte 03**. Se atendieron 9 peticiones del cliente sobre el sitio público/panel y se generó el **3er reporte entregable** (`docs/reportes/TAR_Reporte_03.md`). **112 tests API en verde**, `typecheck`+`lint`+`build` web en verde, OpenAPI 50 rutas. **Verificado en vivo.**

**Fase actual:** **FASE B — sitio público + herramientas de captación.** Avance global ~93%. Lo que falta para "cerrar" Fase B sigue dependiendo del cliente (datos reales, publicar inventario, accesos de prod) o es QA/§9 (Lighthouse).

## Hecho esta sesión (2026-07-28) — 9 peticiones del cliente
1. **Orden premium/remate.** El listado público ya prioriza `premium > destacada > normal` y, dentro de cada nivel, las **en remate** primero (`properties.service.ts`, `remateRank`). Además `updateProperty` ahora **revalida el sitio** al editar (antes solo publish/status/unpublish) y la **home** revalida cada 60 s (antes 1 h) → los cambios de destaque se ven pronto. Verificado: `test2` (premium+remate) encabeza home y listado.
2. **Folleto PDF** (`flyer-pdf.service.ts`, con **pdfkit** — nuevo dep, JS puro sin binarios; imágenes vía sharp). Reúne toda la ficha (portada, precio, specs, descripción, superficies, galería, ubicación, enlace) con logo/colores TAR. **2 rutas nuevas**: `GET /properties/admin/:id/flyer.pdf` (staff, ve borradores) y `GET /properties/:slug/flyer.pdf` (público, solo publicadas). Botones: en el panel (detalle: "Folleto PDF" navy + "Flyer imagen") y en la **ficha pública** ("Descargar folleto (PDF)"). Verificado: PDF válido de 2 páginas, 404 en no publicadas.
3. **Logo header más grande** (`site-header.tsx`: `h-[52px] lg:h-[66px]`).
4. **Buscador más vistoso/claro** (`hero-search.tsx` rediseñado: toggle Comprar/Rentar, selects con ícono+chevron, 7 tipos; `listing-sidebar.tsx` rediseñado + **filtros avanzados** plegables).
5. **Short links de Google Maps** (`geo.service.ts`): además de `res.url`, ahora **lee el HTML** de la página intermedia y extrae la URL de destino embebida o las coords del pin. Verificado: parseo largo OK, fallo controlado (422) sin crash.
6. **Congruencia de filtros**: se expusieron los avanzados que la API ya soportaba (minPrice, baños, estac., min/maxArea) en URL (`use-listing-params.ts`), página (`propiedades/page.tsx`) y sidebar. Verificado SSR vs API: 12→7→2→6 coinciden.
7. **Separadores de miles (MX)** en el panel (`property-fields.tsx`: `NumberInput` que muestra `8,500,000` y guarda crudo; `num()` en `property-form.ts` tolera comas). Aplica a precio y todos los m².
8. **UTM en webhooks**: el flujo ya capturaba y enviaba UTM; se enriqueció el **payload de prueba** (`webhooks.service.ts` `samplePayload('lead.created')`) para incluir `utm_*` y probar la integración desde Ajustes.
9. **Responsive**: cambios con clases mobile-first; páginas clave 200 y marcadores responsive presentes.

- **Reporte 03**: `docs/reportes/TAR_Reporte_03.md` (entregable al cliente, tono no técnico). OpenAPI regenerado (50 rutas).

**Adicional (mismo día): panel admin usable desde el celular.** El layout ya tenía drawer+hamburguesa; el problema eran las **tablas** (Propiedades/Leads/Usuarios: `min-w` + scroll horizontal + hasta 5 botones por fila). Ahora hay **vista de tarjetas en móvil/tablet (`<lg`)** y tabla solo en escritorio (`hidden lg:block`); controles de estatus/acciones extraídos a helpers reutilizables. También: header del detalle apila+wrap en móvil; buscador full-width; `image-uploader` con acciones Portada/Eliminar visibles al tacto (antes solo hover); modales API key/usuario con `max-h/overflow`; footer del webhook-modal con wrap; tabla de leads recientes del dashboard scrollable. Fix aparte: `bg-white/98` no lo genera Tailwind → tarjeta del buscador y menú móvil pasan a `bg-white/95`.

## Hecho (resumen previo; detalle en `git log`)
- **FASE 0, 1, A (backend §5) y C (backoffice) CERRADAS.** Auth (argon2+JWT+refresh), propiedades (CRUD/publish/filtros/detalle), media (sharp→WebP), leads+webhooks (pg-boss+HMAC), importador EasyBroker, OpenAPI/Swagger en `/docs`. Backoffice completo. RBAC 4 roles + Grupos A/B (migraciones 0001–0005).
- **FASE B — SITIO PÚBLICO** (sesiones previas): fundación, home, listado, ficha, contenido, SEO, sin mapa (decisión cliente), lead público como contacto. Pulido Grupo 2 (error boundary, revalidación on-demand, scripts head SSR, loading, OG, JSON-LD).

## Siguiente — pendientes (NO son código propio)
**Depende del cliente (bloquea "cerrar"):** datos reales de contacto + Aviso de Privacidad oficial; **publicar el inventario real** con ubicación (105 props en borrador sin geo → sitio casi vacío); dominio + SendGrid + `NEXT_PUBLIC_MEDIA_HOSTNAME` + fijar `REVALIDATE_SECRET` (mismo valor API/Web) para activar revalidación on-demand en prod; confirmar acceso Google Maps.
**FASE QA (§9):** Lighthouse sobre `/propiedades` móvil en staging; caché HTTP+ETag en GET públicos; E2E Playwright. Requiere el servidor Ubuntu.

## Notas de esta sesión
- **pdfkit** queda como dependencia **externa** en el bundle (`tsup` noExternal solo `@tar/*`) → sus fuentes `.afm` cargan en runtime; sin problema en prod.
- Cuidado: **no correr `pnpm build` mientras `pnpm dev` está activo** (comparten `apps/web/.next` → `MODULE_NOT_FOUND` en dev; se resuelve reiniciando el dev).

## Recordatorio
Lee solo la sección del PRD/plan que toque la tarea actual. No releas todo.
