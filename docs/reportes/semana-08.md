# Reporte semanal — Semana 08

**Etapa:** Panel de administración (cierre) · **Corte:** 31 de julio de 2026

## Resumen
Durante la semana se completó y cerró el panel de administración: una persona sin
conocimientos técnicos puede ahora operar todo el portal desde un solo lugar —usuarios,
conexiones con otros sistemas y códigos de marketing— y se entregó un manual que lo
explica pantalla por pantalla. El proyecto entra en su recta final, con el grueso del
trabajo pendiente concentrado en el sitio público y la puesta en marcha.

## Avances de la semana
- **Gestión de usuarios del panel.** Reservada al Administrador: dar de alta, editar,
  restablecer contraseña, cambiar el rol y dar de baja a un usuario. La baja lo desactiva
  pero no borra nada, y el sistema protege de dos errores graves: nadie puede quitarse el
  acceso a sí mismo, ni dejar al portal sin al menos un administrador activo.
- **Conexiones con otros sistemas.** Dos formas de conectar el portal con herramientas
  externas:
  - **Avisos automáticos (webhooks):** cuando ocurre algo relevante (por ejemplo, llega un
    contacto interesado), el portal puede avisar por sí mismo a sistemas como un CRM,
    Zapier o HubSpot. Se elige qué eventos disparan el aviso, se activan o desactivan, y
    hay una bitácora con el estado de cada envío y un botón para reintentar manualmente.
    Cada aviso va firmado —para que el otro sistema confíe en que proviene de TAR— y se
    reintenta hasta 5 veces si el destino falla.
  - **Llaves de acceso para terceros (API):** credenciales seguras con permisos limitados
    que permiten a un sistema externo actualizar datos en TAR. La llave se muestra una sola
    vez por seguridad y se puede revocar (cancelar) cuando se requiera.
- **Códigos de medición y marketing.** Un gestor para insertar códigos de terceros (Google
  Analytics, Tag Manager, píxeles de redes, chats) eligiendo en qué parte de la página van,
  activarlos o desactivarlos al instante y editarlos. Sirve para medir visitas y campañas
  sin tocar el código del portal.
- **Manual de administración.** Una guía del panel pantalla por pantalla, escrita para
  personas no técnicas del equipo de TAR.

## Material disponible para revisión
- Se probó en vivo todo el flujo: dar de alta y de baja usuarios (la baja cierra la sesión
  y bloquea el acceso de inmediato; se rechaza crear un usuario duplicado; se protege al
  último administrador); los avisos automáticos (enviar → ver bitácora → reintentar) y las
  llaves de acceso (un uso válido funciona, uno sin permiso o inválido se rechaza, y la
  llave nunca se vuelve a mostrar); y los códigos de marketing (alta por ubicación, orden,
  activar/desactivar).
- Las 62 comprobaciones automáticas del portal pasan todas (6 más que la semana anterior).
- El catálogo de funciones del portal queda documentado y navegable (ver detalle al final).

## Decisiones
- **Los códigos de marketing se capturan y organizan ahora; su inserción real en las
  páginas que ve el público llegará con el sitio público.** En esta etapa queda listo el
  gestor (captura, organización y activación); mostrarlos en el sitio corresponde a la fase
  del frontend público.

## Pendientes y riesgos
- **Aprobación del diseño (prototipo v3).** Es el único bloqueo para arrancar el sitio
  público. Las observaciones que restan son sobre todo de carácter estético —ajustes de
  imagen y presentación—; la estructura y las funciones del portal ya están definidas y
  construidas, de modo que lo que falta del diseño es acabado visual, no rehacer trabajo.
- **Accesos de terceros para fases posteriores.** Llave de Google Maps, cuenta de envío de
  correos (SendGrid), y dominio/servidor/respaldos.

## Estado de avance
El panel de administración quedó al 100%: el equipo de TAR ya puede operar todo el portal
desde un solo lugar y sin ayuda técnica —propiedades, contactos, usuarios, conexiones con
otros sistemas y códigos de marketing—, cerrado y comprobado. El avance global del
proyecto se sitúa aproximadamente en el 82%, en la recta final; lo que resta es, sobre
todo, el sitio público —que espera la aprobación del diseño— y la puesta en marcha en el
servidor definitivo.

## Próximos pasos
- Publicar el diseño y abrir la ronda de aprobación (esa firma desbloquea la construcción
  del sitio público).
- Tras la aprobación, construir el sitio público. En paralelo, cuando lleguen los accesos,
  empezar a preparar el servidor definitivo donde vivirá el portal.

---

### Detalle técnico (referencia)
- **Gestión de usuarios** (solo Administrador): alta, edición, restablecer contraseña,
  cambiar rol y baja (desactivar, sin borrado). Protecciones: no puede dejarse a sí mismo
  sin acceso ni dejar el sistema sin un administrador activo.
- **Integraciones · Webhooks** (en Ajustes):
  - Salientes: alta/edición de avisos a sistemas externos (CRM, Zapier, HubSpot), selección
    de eventos disparadores, activar/desactivar y bitácora de entregas con estado, intentos
    y reintento manual. Cada aviso va firmado y se reintenta hasta 5 veces si el destino
    falla.
  - Entrantes (API keys): alta de llaves con permisos, mostrando la llave una sola vez, y
    opción de revocar. Permiten que un tercero actualice datos en TAR de forma segura.
- **Scripts de marketing:** gestor para insertar código de terceros (Analytics, Tag
  Manager, píxeles, chats) por ubicación (head / body / footer), con activar/desactivar al
  instante y editor de código.
- **Manual de administración** (`docs/MANUAL-ADMIN.md`): guía del panel pantalla por
  pantalla, para personas no técnicas del cliente.
- **Decisión técnica:** la inserción real de los scripts en el sitio público es parte de la
  Fase B (frontend); aquí queda listo el gestor (captura, organización, activación).
- Evidencia: **62 pruebas automáticas del backend en verde** (+6 de scripts; usuarios e
  integraciones también cubiertos); verificación en vivo de usuarios, webhooks, llaves y
  scripts; documentación de la API al día con **31 endpoints** en `/docs` (Swagger).
- Métricas: **Fase C 100% (cerrada)**; avance global aprox. **~82%**.
