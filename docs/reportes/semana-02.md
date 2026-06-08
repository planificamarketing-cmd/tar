# Reporte semanal — Semana 02

**Fase del cronograma:** Fase 1 (Datos definitivos + prototipos UI/UX) · **Corte:** 2026-06-07

## Objetivo de la semana
Cerrar el modelo de datos y los contratos, e **integrar el prototipo de diseño v3**
para que el cliente lo revise; capturar y aplicar correcciones.

## Entregables / lo realizado
- **Validaciones compartidas (Zod)** para toda entrada de la API (propiedades,
  filtros, leads, webhooks, etc.) — una sola fuente de verdad para API y Web.
- **Borrador de ERD** (`docs/ERD.md`) + volcado del esquema (`docs/schema.sql`).
- **Prototipo v3 integrado** en `design-reference/` con el **rojo de marca definitivo
  `#D2103E`** tomado del logo. Navegable en local (`pnpm prototipo`) y preparado para
  publicarse al cliente (GitHub Pages / Netlify; zip listo).
- **Ronda de revisión con el cliente aplicada al prototipo** (varios ajustes):
  - Home: se quitó el badge “60 años” y la tarjeta destacada; **mapa real** en vez
    de un dibujo; preguntas frecuentes con animación suave.
  - Se quitó WhatsApp del sitio público; “Guardar/favoritos” se ocultó (se reactiva
    cuando existan cuentas de usuario público).
  - “Nosotros” con foto real y valores rediseñados.
  - **Panel admin**: “Brokers” → **“Usuarios”**; alta de propiedad **por dirección
    con geolocalización** (sin capturar coordenadas); filtros e **integraciones
    (webhooks) explicadas**; sin emojis; acceso al panel oculto.
  - **CRM funcional** con el pipeline del negocio (Nuevo · Cita agendada · Cita
    concretada · Apartado · Firma de contrato) y **webhooks bidireccionales** en vivo.
  - Mejoras UX de portal inmobiliario: contador de fotos, breadcrumbs, precio por m²,
    “Buscar en esta área” en el mapa.
- **Datos reales del cliente resguardados** en `data/` (gitignored): CSV de
  inventario (105 propiedades), aviso de privacidad, etc.

## Evidencia de que funciona
- Prototipo navegable (`pnpm prototipo` → http://localhost:4173) con todos los cambios.
- Esquema migrado + seed; consultas geográficas y de texto verificadas.

## Decisiones / desviaciones (acordadas con el cliente)
- **Rol** `broker` → **`editor`** (usuarios administrativos).
- **Pipeline de leads** redefinido (5 etapas + descartado).
- **Sin WhatsApp** en el público; “Guardar” diferido a una futura fase con cuentas.
- **Acceso al panel** por subdominio aparte detrás de login (en prod).

## Riesgos / bloqueos / pendientes del cliente
- **Firma del prototipo v3** (hasta 3 rondas) — es **prerequisito de la Fase B
  (frontend público)**. No bloquea backend ni backoffice.

## Métricas
- Fase 1 (parte técnica): **100%**. Diseño: revisado, **pendiente de firma**.

## Lo que sigue
- Construir la **Fase A (Backend)**: autenticación y API de propiedades.
