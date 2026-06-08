# Reporte semanal — Semana 04

**Fase del cronograma:** Fase A — Backend (A.3 Media, A.4 Leads + Webhooks) · **Corte:** 2026-06-07

## Objetivo de la semana
Permitir cargar fotos optimizadas a las propiedades y montar toda la **captación de
prospectos (leads)** con su **CRM** y la **integración con sistemas externos
(webhooks)**.

## Entregables / lo realizado
- **Media (A.3):** subida de imágenes que **siempre se re-optimizan a WebP** (versión
  grande + miniatura), se guardan en disco con nombre por contenido y se registran en
  la BD. Reordenar, marcar portada, texto alternativo y borrar (también del disco).
- **Leads (A.4):**
  - Formulario público con **anti-spam (honeypot)**, **rate-limit** y **consentimiento
    de privacidad (LFPDPPP)** sellado con fecha. Notificación por email (SendGrid).
  - **CRM**: listado, detalle con bitácora y cambio de etapa del **pipeline**
    (Nuevo → Cita agendada → Cita concretada → Apartado → Firma de contrato).
  - Registro de **vistas** de propiedad para la analítica del panel.
- **Webhooks (A.4):**
  - **Salientes**: cuando ocurre un evento (nuevo lead, cambio de estatus, publicación)
    se **envía un aviso firmado (HMAC-SHA256)** al sistema del cliente, con
    **reintentos automáticos** (hasta 5, con espera creciente) y bitácora.
  - **Entrantes**: un sistema externo (CRM/Zapier) puede actualizar leads o propiedades
    con una **llave de API** y permisos (scopes).
  - Se usa una **cola de trabajos (pg-boss)** para que la entrega sea confiable.

## Evidencia de que funciona
- **34 pruebas** en verde (suman media, leads y webhooks; incluye la **firma HMAC**).
- El verificador `pnpm smoke` **entrega un webhook real** a un receptor local y
  confirma la firma y la bitácora `entregado`.

## Decisiones / desviaciones
- “Guardar/favoritos” queda diferido (requiere cuentas de usuario público).

## Riesgos / bloqueos / pendientes del cliente
- API key de SendGrid (para enviar emails de verdad) — el sistema funciona sin ella
  (no-op en desarrollo).

## Métricas
- Fase A: **~70%** (A.1–A.4 de 6).

## Lo que sigue
- Importador del inventario real (EasyBroker) y documentación interactiva de la API.
