# Reporte semanal — Semana 01

**Fase del cronograma:** Fase 0 (Cimientos) + inicio Fase 1 (Datos) · **Corte:** 2026-06-07

## Objetivo de la semana
Dejar el proyecto **operativo de punta a punta** en local: monorepo, base de datos
y un esqueleto de API/Web que compile y corra, con CI básico. Empezar el modelo de
datos.

## Entregables / lo realizado
- **Monorepo profesional** (pnpm + Turborepo): `apps/api`, `apps/web`, `packages/db`,
  `packages/shared`. TypeScript estricto, ESLint + Prettier, Node 20.
- **Base de datos en Docker** con la **misma imagen que producción**
  (`postgis/postgis:16-3.4`) → garantiza que lo que funciona en desarrollo funcione
  igual en el servidor (paridad).
- **API (Express 5)**: configuración por variables de entorno validadas, logger,
  manejo de errores central y endpoint de salud `/health`.
- **Web (Next.js 14 + Tailwind)**: página base con los colores de marca.
- **CI (GitHub Actions)**: en cada cambio corre calidad (lint → typecheck → build).
- **Modelo de datos completo** (14 tablas: propiedades, usuarios, leads, webhooks,
  etc.) con soporte geográfico **PostGIS**, precios duales (venta/renta, MXN/USD) y
  búsqueda de texto en español. Migración aplicada y **datos de muestra (seed)**.

## Evidencia de que funciona
- `pnpm dev` levanta API + Web; `GET /health` responde conectado a PostGIS.
- `pnpm db:migrate` + `pnpm db:seed` corren limpio (10 propiedades de muestra).
- Lint/typecheck/build en verde; CI configurado.

## Decisiones / desviaciones
- **pnpm 9.15.9** (en vez de la última) por compatibilidad con Node 20.
- BD **siempre en Docker** (no instalación nativa) para paridad con el VPS.

## Riesgos / bloqueos / pendientes del cliente
- API keys de Google Maps y SendGrid (para fases posteriores) — aún no necesarias.

## Métricas
- Fase 0: **100%**. Modelo de datos (Fase 1): **~60%**.

## Lo que sigue
- Cerrar contratos de datos (validaciones compartidas) e integrar el prototipo de
  diseño para revisión del cliente.
