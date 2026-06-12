# Reporte semanal — Semana 08

**Fase del cronograma:** Fase C — Backoffice (cierre) · **Corte:** 2026-06-11

## Objetivo de la semana
Completar los bloques restantes del panel y **cerrar la Fase C** cumpliendo su
Definición de Hecho: que una persona no técnica pueda operar todo desde el panel.

## Entregables / lo realizado
- **Gestión de usuarios** (solo Administrador): alta, edición, **restablecer
  contraseña**, cambiar rol y **dar de baja** (desactivar, sin borrar). Con
  protecciones automáticas: nadie puede dejarse a sí mismo sin acceso ni dejar el
  sistema **sin un administrador activo**.
- **Integraciones · Webhooks** (en Ajustes):
  - **Salientes:** alta/edición de avisos a sistemas externos (CRM, Zapier, HubSpot),
    selección de eventos que los disparan, activar/desactivar y **bitácora de entregas**
    con estado, intentos y **reintento manual**. Cada aviso va **firmado** y se
    reintenta hasta 5 veces si el destino falla.
  - **Entrantes (llaves de API):** alta de llaves con permisos, mostrando la llave
    **una sola vez**, y opción de **revocar**. Permiten que un tercero actualice datos
    en TAR de forma segura.
- **Scripts de marketing:** gestor para insertar código de terceros (Analytics, Tag
  Manager, píxeles, chats) por ubicación (**head / body / footer**), con
  **activar/desactivar** al instante y editor de código.
- **Manual de administración** (`docs/MANUAL-ADMIN.md`): guía del panel **pantalla por
  pantalla**, para personas no técnicas del cliente.

## Evidencia de que funciona
- Pruebas automáticas del backend: **62 en verde** (+6 de scripts; usuarios e
  integraciones también cubiertos).
- Verificación en vivo: usuarios (alta, duplicado rechazado, baja que cierra sesión y
  bloquea el acceso, protección del último administrador); webhooks (aviso → bitácora →
  reintento) y llaves (uso entrante válido, permiso insuficiente e inválido rechazados,
  la llave nunca se vuelve a mostrar); scripts (alta por ubicación, orden, activar/
  desactivar).
- Documentación de la API al día: **31 endpoints** en `/docs` (Swagger).

## Decisiones / desviaciones
- La **inserción real de los scripts** en el sitio público es parte de la **Fase B**
  (frontend); aquí queda listo el **gestor** (captura, organización, activación).

## Riesgos / bloqueos / pendientes del cliente
- **Firma del prototipo v3** — único bloqueo del sitio público (Fase B).
- Llave de Google Maps, cuenta de SendGrid, dominio/servidor/respaldos — para fases
  posteriores.

## Métricas
- **Fase C: 100% (cerrada).** Avance global aprox.: **~82%**.

## Lo que sigue
- Publicar el prototipo y abrir la **ronda de firma** del diseño (desbloquea Fase B).
- Tras la firma: **sitio público (Fase B)**. En paralelo, cuando haya accesos: empezar
  el **aprovisionamiento del servidor (Fase QA/Lanzamiento)**.
