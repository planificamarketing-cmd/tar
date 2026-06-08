# Reporte semanal — Semana 03

**Fase del cronograma:** Fase A — Backend (A.1 Auth, A.2 Propiedades) · **Corte:** 2026-06-07

## Objetivo de la semana
Cimentar la seguridad de la plataforma (login de operadores) y construir el **núcleo
del catálogo**: crear, publicar, buscar y mostrar propiedades.

## Entregables / lo realizado
- **Autenticación (A.1):** login de operadores con contraseñas cifradas (argon2),
  **sesión segura** con token de acceso corto (15 min) y **token de refresco
  rotativo** (7 días, revocable). Control de **roles** (administrador / editor),
  protección contra fuerza bruta y endurecimiento de seguridad (helmet, CORS, etc.).
- **Propiedades (A.2):**
  - Alta, edición y **borrado suave** (nada se elimina de verdad).
  - **Publicación**: valida ubicación y datos, genera la **URL amigable (slug)
    permanente** y dispara el evento `property.published`.
  - **Buscador** público con filtros combinados (operación, tipo, precio,
    recámaras/baños/estacionamientos, m², amenidades, colonia, **texto**), orden
    (destacados primero / precio / recientes) y paginación.
  - **Mapa**: búsqueda geográfica por área visible (bbox) con datos ligeros.
  - **Ficha** de propiedad con imágenes y amenidades.
  - Cambio de **estatus comercial** (disponible/apartado/vendido/…).

## Evidencia de que funciona
- **17 pruebas automáticas** en verde (auth + propiedades), incluyendo rotación de
  sesión y todo el ciclo crear→publicar→buscar→mapa→borrar.
- Demo en vivo contra los datos de muestra: listado ordenado, mapa por zona, filtros.

## Decisiones / desviaciones
- El precio se **normaliza a MXN** internamente para filtrar/ordenar, pero **siempre
  se muestra en la moneda original** (MXN/USD).
- Solo se listan al público las propiedades `disponible` y `apartado`.

## Riesgos / bloqueos / pendientes del cliente
- Ninguno nuevo. (Diseño sigue pendiente de firma para Fase B.)

## Métricas
- Fase A: **~35%** (A.1 + A.2 de 6 bloques).

## Lo que sigue
- Gestión de imágenes (subida + optimización) y captación de leads + webhooks.
