# Reporte quincenal — Quincena 2 (Semanas 3–4)

**Fases cubiertas:** Fase A — Backend (A.1–A.4) · **Corte:** 3 de julio de 2026

## Resumen ejecutivo
En esta quincena se construyó el corazón funcional de la plataforma: el inicio de sesión
seguro, el catálogo completo de propiedades —alta, publicación, búsqueda y mapa—, la gestión
de fotos optimizadas, la captación de prospectos con su seguimiento por etapas y la conexión
automática con otros sistemas. Todo quedó verificado mediante controles de calidad
automáticos.

## Hitos alcanzados
- **Inicio de sesión seguro para el personal.** Los operadores entran con contraseñas
  cifradas y sesión protegida, cada quien con el nivel de permisos que corresponde a su rol.
- **Catálogo de propiedades completo.** El motor que conecta los datos con las pantallas ya
  permite buscar con filtros, ver las propiedades en el mapa por zona, publicarlas con una
  dirección web amigable y cambiar su estatus.
- **Gestión de fotos lista para cargar rápido.** Al subir una imagen, el sistema la comprime
  automáticamente para que el portal cargue veloz y genera además una versión en miniatura.
- **Captación de prospectos con seguimiento por etapas.** El formulario público para
  interesados incluye protección contra spam y la aceptación del aviso de privacidad; cada
  prospecto avanza por etapas y se mide cuántas veces se consultan las propiedades.
- **Conexión automática con otros sistemas.** La plataforma puede enviar avisos firmados a
  sistemas externos —con reintentos cuando algo falla— y también recibir actualizaciones desde
  un sistema externo de seguimiento de clientes. Para garantizar que ningún aviso se pierda,
  se apoya en una fila interna que asegura su entrega.

## Avance vs cronograma
El porcentaje refleja qué proporción del total del proyecto está terminada. Esta etapa se
divide en seis bloques de trabajo, de los cuales ya quedaron concluidos cuatro.

- **% global aprox.:** ~40%.
- **Estado:** adelantado. Cuatro de los seis bloques de esta etapa quedaron listos antes de lo
  previsto.

## Demostraciones disponibles
- **Recorrido del motor del sistema**, que incluye el envío real de un aviso automático a un
  sistema externo, para comprobar que la conexión funciona de extremo a extremo.
- **34 pruebas automáticas** que verifican que todo lo construido funciona como debe.

## Decisiones acordadas con el cliente
- La función de guardar favoritos se pospone a una fase futura, cuando el público pueda crear
  su propia cuenta de usuario.

## Riesgos y dependencias
- Falta el acceso al servicio de envío de correos (SendGrid) para mandar correos reales.
  Mientras tanto, el sistema opera sin inconveniente; ese acceso solo se necesita para el
  envío real.

## Plan de la siguiente quincena
- Cargar el inventario real de propiedades —importación desde EasyBroker—, preparar la
  documentación interactiva del motor del sistema y cerrar esta etapa; en seguida, iniciar el
  panel interno de administración (Backoffice).

---

### Detalle técnico (referencia)
Para quien desee el detalle de ingeniería de esta quincena:
- **Autenticación (A.1):** login de operadores con argon2 + sesión con refresco rotativo
  (refresh token), y control de roles.
- **Propiedades (A.2):** API completa con buscador con filtros, mapa por zona (PostGIS),
  publicación con URL amigable (slug) y cambio de estatus.
- **Media (A.3):** subida de imágenes con re-optimización automática a WebP + generación de
  miniatura.
- **Leads + CRM (A.3/A.4):** formulario público con anti-spam (honeypot) y consentimiento
  de privacidad; pipeline de etapas; analítica de vistas.
- **Webhooks (A.4):** avisos firmados a sistemas externos con reintentos, y recepción de
  actualizaciones desde un CRM externo, soportados por una cola de trabajos confiable
  (pg-boss).
- Demostraciones: `pnpm smoke` (recorre el backend e incluye la entrega real de un
  webhook); **34 pruebas automáticas** vía `pnpm test`.
- Avance: 4 de 6 bloques de la Fase A completos (~40% global).
- Dependencia pendiente: API key de SendGrid (emails reales); el sistema opera sin ella
  mientras tanto.
