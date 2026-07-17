# TAR Internacional — Reporte 02

**Etapa:** Panel de administración y control de acceso · **Corte:** 7 de Julio 2026 · **Entrega 02**

## Resumen

En esta segunda entrega el **panel de administración funcional** se muestra por primera
vez: no se había presentado operable antes. Desde el panel el equipo de TAR ya gestiona el
**catálogo de propiedades** y da **seguimiento a los prospectos**.

Como estaba previsto en la propuesta, el panel incorpora el **control de acceso**: cada
persona del equipo puede tener un **rol distinto**, de modo que vea y haga únicamente lo
que le corresponde. Se implementaron los **cuatro roles** pensados para la operación real
de una inmobiliaria.

## El panel de administración

Por primera vez se muestra el **panel operable de principio a fin**, la herramienta con la
que el equipo administrará el portal día a día. Reúne en un solo lugar el **catálogo de
propiedades**, la **gestión de prospectos** y la **administración de usuarios con permisos
por rol**. El panel se adapta al rol de quien entra: oculta las secciones y los botones que
esa persona no puede usar, evitando errores y accesos indebidos. Se ve y funciona de forma
óptima en celular, tableta y computadora.

## Avances de la segunda entrega

- **Usuarios y permisos por rol.** El administrador asigna el rol al **crear o editar**
  cada usuario y el panel se adapta solo: muestra sólo lo que ese rol puede usar.

  | Rol | Para quién | Qué puede hacer |
  |---|---|---|
  | **Administrador** | Dirección / responsable del sistema | Todo: propiedades, gestión de prospectos, usuarios y permisos, integraciones y scripts. |
  | **Editor** | Equipo que carga y publica inmuebles | Gestiona el **catálogo** completo y atiende los **prospectos**. No administra usuarios ni integraciones. |
  | **Ventas** | Asesores comerciales | Atiende la **gestión de prospectos** (da seguimiento y mueve etapas). Consulta el catálogo, pero **no lo edita**. |
  | **Lector** | Consulta / auditoría | **Sólo lectura**: ve propiedades y prospectos, sin modificar nada. |

  En la práctica, un asesor de *Ventas* ve el tablero, el catálogo (para consultarlo) y la
  gestión de prospectos, donde sí puede trabajar; no ve "Nueva propiedad" ni la
  administración de usuarios. Un usuario *Lector* ve la misma información pero sin ningún
  botón de edición.

- **Seguimiento de clientes (gestión de prospectos) con datos de ejemplo.** La gestión de
  prospectos refleja el flujo del negocio inmobiliario por etapas: **Nuevo → Cita agendada
  → Cita concretada → Apartado → Firma de contrato** (más "Descartado"). Para la
  demostración se cargaron **prospectos de ejemplo** repartidos en distintas etapas y un
  caso de **solicitud de cita**, de modo que se aprecie el **listado** con su etapa y
  origen (portal web, redes, Google…), la **ficha de cada prospecto** con su mensaje, datos
  de contacto y propiedad de interés, y el **cambio de etapa** con su bitácora de
  seguimiento. Estos prospectos son de ejemplo y se pueden eliminar en cualquier momento
  sin afectar la configuración.

- **Catálogo de propiedades gestionable desde el panel.** El alta, la edición y las fotos
  de cada propiedad ya se operan por completo desde el panel. La **carga del inventario
  real** está lista para ejecutarse en cuanto se disponga del **servidor** donde vivirá la
  base de datos con la información.

- **Protección del lado del servidor.** Cada acción sensible está protegida también en el
  servidor, no sólo en la pantalla: aunque el botón no se muestre, la operación se rechaza
  si el rol no tiene permiso.

## Nuestro trabajo como consultora

Además de construir la plataforma, en esta etapa GBS Digital aportó su papel de
**consultora**: partimos de cómo opera realmente una inmobiliaria para traducirlo en
decisiones concretas del sistema. De ahí surgieron los **cuatro roles** (dirección, equipo
de inventario, asesores de ventas y consulta/auditoría), el **embudo de prospectos por
etapas** que refleja el proceso comercial —del primer contacto a la firma— y la protección
de cada acción según la responsabilidad de cada quien. El objetivo es que el panel se
ajuste a la forma de trabajar del equipo, y no al revés.

## Material disponible para revisión

- El **panel de administración** operable de extremo a extremo: catálogo, gestión de
  prospectos y administración de usuarios por rol.
- **Prospectos de ejemplo** repartidos en las etapas del embudo, más un caso de solicitud
  de cita, para recorrer el seguimiento de clientes en la demostración.

## Decisiones

- Implementar los **cuatro roles** (`admin`, `editor`, `ventas`, `lector`) con un mapa de
  **permisos por módulo** como fuente única de verdad.
- Cargar **prospectos de ejemplo** para la demostración, eliminables sin afectar la
  configuración.
- Presentar las **integraciones (webhooks)** en su propio espacio en la próxima sesión,
  para dedicarles la atención que merecen.

## Pendientes y riesgos

- **Servidor de producción.** Es lo que habilita subir la base de datos con el **inventario
  real** y publicar el portal. Al recibir los accesos se aprovisiona el servidor.
- **Accesos de terceros.** Mapa de Google y servicio de envío de correos, aún no
  requeridos en esta etapa pero necesarios más adelante.
- **Pruebas finales y salida a producción.** Pendientes hasta contar con el servidor.

## Estado de avance

- **Panel de administración** (propiedades, prospectos, usuarios/roles): completo y
  operable —se presenta por primera vez en esta entrega—.
- **Motor de la plataforma (backend):** completo y probado.
- **Diseño del sitio público:** aprobado.
- **Inventario real:** pendiente de carga; requiere el servidor donde vivirá la base de datos.
- **Sitio público** (lo que verán los clientes finales): por construir sobre el diseño ya aprobado.
- **Pruebas finales y salida a producción:** pendientes.

## Lo que se verá en la siguiente sesión

1. **La página de inicio (home) del sitio público y los formularios de contacto** — para
   revisar de extremo a extremo cómo un visitante encuentra una propiedad y deja sus datos,
   que caen directo en la gestión de prospectos.
2. **Las integraciones (webhooks)** — la conexión de la plataforma con sistemas externos
   (CRM, automatizaciones), presentadas en su propio espacio para dedicarles la atención
   que merecen.

## Próximos pasos

1. Realizar la sesión de demostración enfocada (home + formularios de contacto, e
   integraciones).
2. Con el **diseño ya aprobado**, construir el sitio público.
3. Al recibir los accesos, aprovisionar el **servidor** y subir la base de datos con el
   inventario real.
4. Pruebas finales y salida a producción.

## Detalle técnico (referencia)

- **Control de acceso (RBAC) con capacidades por módulo.** Fuente única de verdad en el
  paquete compartido `@tar/shared`, consumida por el backend y el frontend. Se definieron
  **11 capacidades** de grano fino que separan lectura de escritura: `properties:read` /
  `properties:write` / `properties:delete`, `media:write`, `amenities:write`, `geo:write`,
  `leads:read` / `leads:write`, `users:manage`, `webhooks:manage` y `scripts:manage`.
- **Mapa rol → capacidades.** `admin`: todas; `editor`: catálogo + prospectos (8
  capacidades, sin usuarios/integraciones/scripts); `ventas`: `properties:read` +
  `leads:read` / `leads:write`; `lector`: `properties:read` + `leads:read`.
- **Aplicación en el servidor.** Middleware `requireAuth` (valida el access token
  `Authorization: Bearer`) seguido de `requirePermission(<capacidad>)`, que consulta
  `roleCan(rol, capacidad)`; cada ruta declara la capacidad que exige. Respuestas: **401**
  sin token o token inválido, **403** sin permiso.
- **Aplicación en el panel.** El mismo mapa de `@tar/shared` filtra la navegación y los
  botones (layout del panel, listados de propiedades y de prospectos), de modo que el
  servidor y la pantalla nunca se contradicen.
- **Autenticación.** Access token JWT de **15 minutos** en memoria + refresh en **cookie
  httpOnly** acotada a `/auth`; contraseñas con hash **argon2**; **rate-limit** estricto en
  `/auth/login` (10 intentos por 15 minutos) contra fuerza bruta.
- **Base de datos.** Migración `0001` aplicada: amplía el tipo `user_role` de PostgreSQL
  con los valores **`ventas`** y **`lector`** (antes sólo `admin` / `editor`).
- **Verificación.** Revisión de tipos sin errores; **90 pruebas automáticas** (14 archivos)
  en verde, incluidas pruebas específicas de los límites de cada rol; y comprobación en
  vivo contra la API (un *Lector* recibe **403** al intentar escribir; *Ventas* sí puede
  operar la gestión de prospectos).
