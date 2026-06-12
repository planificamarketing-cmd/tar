# Documentación — Plataforma TAR Internacional

Portal inmobiliario de **TAR Internacional** (grupo inmobiliario, México y EUA).
Esta carpeta es la **documentación de entrega**: explica qué es la plataforma, cómo
ponerla en marcha, qué se puede y qué no, y el significado de cada cosa.

> Construida por **GBS Digital**. Stack PERN + Next.js 14. La especificación
> contractual completa está en `PRD_Plataforma_TAR.md` (raíz del repo).

## Índice

### Para entender el proyecto
- **[ARQUITECTURA.md](ARQUITECTURA.md)** — stack, estructura, cómo encajan las piezas,
  seguridad y decisiones técnicas.
- **[GLOSARIO.md](GLOSARIO.md)** — significado de cada término, rol, estatus y evento.
- **[ERD.md](ERD.md)** — diagrama del modelo de datos · **[schema.sql](schema.sql)** —
  esquema SQL aplicado.

### Para operar y verificar
- **[PUESTA-EN-MARCHA.md](PUESTA-EN-MARCHA.md)** — **qué se puede poner en marcha hoy,
  cómo hacerlo, comandos, links, qué funciona y qué falta**.
- **[VERIFICACION.md](VERIFICACION.md)** — cómo comprobar que todo funciona
  (`pnpm smoke`, `pnpm test`, visor de BD, peticiones de ejemplo).

### API
- **Documentación interactiva (Swagger):** levanta la API (`pnpm dev`) y abre
  **`/docs`** (http://localhost:4000/docs). Spec: **[openapi.json](openapi.json)**.

### Avance y reportes
- **[reportes/](reportes/)** — reportes **semanales** y **quincenales** alineados al
  cronograma de 16 semanas, presentables al cliente.
- **Estado actual** (partida guardada): `ESTADO.md` (raíz) · **Plan/checklist:**
  `PLAN_EJECUCION_FASES.md` (raíz).

### Operar el panel de administración
- **[MANUAL-ADMIN.md](MANUAL-ADMIN.md)** — guía del backoffice pantalla por pantalla
  (acceso, propiedades, leads, usuarios, integraciones/webhooks, scripts), para
  personas no técnicas.

### Despliegue (se completa en Fase Lanzamiento)
- **SETUP_SERVIDOR_UBUNTU.md** (raíz) — aprovisionamiento del servidor.
- **README-DEPLOY.md** _(pendiente, Fase Lanzamiento)_.

## Estado del proyecto (corte 2026-06-11)
| Fase | Estado |
|---|---|
| 0 Cimientos · 1 Datos+Prototipo · A Backend | ✅ Completas |
| C Backoffice (panel admin) | ✅ Completa |
| B Frontend público | ⛔ Bloqueada hasta la **firma del diseño** |
| QA · Lanzamiento | ⏳ Pendientes |

Avance global aprox.: **~82%** (muy adelantado al cronograma).
