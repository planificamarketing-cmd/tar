# Reporte quincenal — Quincena 1 (Semanas 1–2)

**Fases cubiertas:** Fase 0 (Cimientos) y Fase 1 (Datos + Prototipos) · **Corte:** 2026-06-07

## Resumen ejecutivo
Quedó montada toda la **base técnica** del proyecto (entorno reproducible, base de
datos geográfica, esqueleto de API y web, CI) y el **modelo de datos definitivo**. Se
**integró y revisó el prototipo de diseño v3** con el cliente, aplicando una ronda de
correcciones; el panel administrativo ya muestra un **CRM funcional** de demostración.

## Hitos alcanzados
- Proyecto **operativo en local** end-to-end (`pnpm dev`).
- **Base de datos profesional** (PostgreSQL + PostGIS) con 14 tablas, precios duales
  MXN/USD, geolocalización y búsqueda en español. Migrada y con datos de muestra.
- **Prototipo v3** con el rojo de marca definitivo, navegable y **listo para publicar**
  al cliente para su firma.
- **Decisiones de producto** acordadas (roles, pipeline de leads, sin WhatsApp, acceso
  al panel, alta por dirección con geolocalización).

## Avance vs cronograma
- **% global aprox.:** ~25%.
- **Estado:** **adelantado**. Fase 0 y la parte técnica de la Fase 1 completas.

## Demostraciones disponibles
- Prototipo navegable (`pnpm prototipo`).
- Base de datos con datos de muestra (`pnpm db:web`).

## Decisiones acordadas con el cliente
- `broker` → `editor`; pipeline de leads de 5 etapas; sin WhatsApp; panel por
  subdominio oculto; alta de propiedad por dirección (geolocalización).

## Riesgos y dependencias
- **Firma del prototipo v3** (pendiente) → prerequisito de la Fase B.
- API keys de Google y SendGrid (para fases siguientes).

## Plan de la siguiente quincena
- Construir la **Fase A (Backend)**: autenticación, propiedades, media, leads y
  webhooks.
