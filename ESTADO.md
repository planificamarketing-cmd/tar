# ESTADO — Plataforma TAR Internacional

> **Partida guardada del proyecto.** Este archivo (+ `CLAUDE.md` + `git log`) es lo ÚNICO que se lee al iniciar sesión. NO releer el PRD, el plan ni el código completos: consultar solo la sección puntual que toque la tarea en curso. Se regenera (se sobrescribe) al final de cada sesión.

**Última actualización:** 2026-06-07 · sesión Fase 1→A
**Fase actual:** FASE A — Core & Backend (iniciada). Fase 1 técnica COMPLETA; resta firma de diseño (cliente) para Fase B. **Avance global:** ~28%
**Prototipo:** revisado (rondas del cliente); listo para publicar en Netlify (zip `tar-prototipo-v3.zip`).

## Hecho
- **FASE 0** completa (cimientos, ver `git log`).
- **Esquema Drizzle completo** (`packages/db/src/schema.ts`, §4.1): 14 tablas con enums, precios duales + normalizados MXN, `geo geography(Point,4326)`, full-text español (`search_vector`), soft delete, índices btree/GIN/GiST. Migración `0000_*` aplicada (con `CREATE EXTENSION postgis, citext`).
- **Seed** (`pnpm db:seed`, idempotente): 1 admin (`admin@tarinternacional.com` / `admin123`), 8 amenidades, 5 colonias (CDMX/Edomex/Qro), **10 propiedades** de muestra (venta/renta, MXN/USD, los tipos del inventario). Verificado: normalización MXN, `ST_Within`/bbox y full-text funcionando.
- **Esquemas Zod compartidos** (`packages/shared/src/*`, §5): enums, paginación, auth, users, **filtros de propiedades + create/update + bbox del mapa**, leads (honeypot + consentimiento LFPDPPP + cita), webhooks (salientes/entrantes/api-keys), scripts.
- **ERD borrador**: `docs/ERD.md` (Mermaid) + `docs/schema.sql` (dump del esquema aplicado).
- **Prototipo v3 ingerido + revisado (ronda 1 del cliente)** en `design-reference/prototipo-v3/`: HTML + 4 JSX + logo. Rojo corregido a **`#D2103E`**. Cambios aplicados (commit `9776f25`): Home sin badge/destacada, mapa real (Leaflet), FAQ animado; sin WhatsApp; Nosotros con foto + valores en tarjetas; Admin: Brokers→Usuarios, alta por geocoding (sin GPS manual), filtros ricos + Exportar CSV, Scripts proveedor→nombre, Ajustes sin Marca/Facturación + Integraciones/Webhooks visibles, sin emojis, acceso oculto. Navegable: `pnpm prototipo` (http://localhost:4173). Falta deploy público (GitHub Pages, repo aparte).
- **Datos del cliente resguardados** en `data/` (gitignored, PII): **CSV real de inventario (105 propiedades)** para el importador (Fase A.5), aviso de privacidad PDF (para `/aviso-privacidad`), capturas del diseño desplegado y contenido "Nosotros".
- Verificado: `lint`, `typecheck`, `build`, `test` en verde.

## En progreso
- _(ninguna técnica — esperando insumos del cliente para el bloque de diseño)_

## Siguiente (máx. 3)
1. **FASE A.1 — Auth:** argon2 + login → access (15m) + refresh rotativo (7d, `token_hash`), `requireAuth`/`requireRole(admin|editor)`, rate-limit estricto en `/auth/login`, endpoints `/auth/{login,refresh,logout,me}` + tests (sobre el esquema y los Zod ya listos).
2. A.2 Propiedades: CRUD + `publish` (slug inmutable, valida geo) + `GET /properties` (filtros sobre `price_*_mxn`, sort premium) + `GET /properties/map` (bbox `ST_Within`, SQL crudo).
3. Publicar el prototipo en Netlify (cliente) y abrir ronda de firma (desbloquea Fase B).

## Decisiones / desviaciones respecto al PRD
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
