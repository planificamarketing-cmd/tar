# Reporte semanal — Semana 04

**Etapa:** Construcción del motor del portal — Fase A · Fotos de propiedades y captación de contactos interesados · **Corte:** 3 de julio de 2026

## Resumen
Durante esta semana el portal incorporó la capacidad de subir fotos optimizadas a cada
propiedad y, sobre todo, de captar a las personas interesadas y organizarlas por etapas de
venta. El sistema queda además en condiciones de notificar de forma automática a los demás
sistemas de TAR cada vez que ocurre un hecho relevante.

## Avances de la semana
- **Fotografías de propiedades.** Cada propiedad puede ya tener fotos que se ven bien y
  cargan rápido. Al subir una imagen, el sistema la comprime por su cuenta y la guarda en un
  formato moderno y ligero, de modo que el sitio cargue con agilidad sin perder calidad, y
  genera además una versión en miniatura. Las fotos se pueden reordenar, se puede elegir la
  portada, escribir una descripción para cada una —lo que también ayuda a que el buscador de
  Google entienda la imagen— y eliminarlas cuando dejan de ser útiles.
- **Captación de prospectos.** El portal cuenta con un formulario de contacto público para
  que un interesado pida informes de una propiedad. Incluye protección contra spam y robots,
  de modo que solo lleguen contactos reales; registra el consentimiento de privacidad del
  interesado, conforme a la ley mexicana de protección de datos, con su fecha; y avisa por
  correo al equipo cuando entra un nuevo contacto.
- **Seguimiento de prospectos por etapas.** Cada contacto interesado se puede consultar en una
  lista, abrir su detalle con el historial de anotaciones e irlo moviendo por las etapas del
  proceso comercial: Nuevo, Cita agendada, Cita concretada, Apartado y Firma de contrato. Así
  el equipo conoce en todo momento en qué punto está cada oportunidad. Funciona como un CRM
  sencillo integrado en el propio portal.
- **Conteo de visitas a cada propiedad,** que alimenta las estadísticas del panel de
  administración y permite saber qué propiedades se consultan más.
- **Avisos automáticos a otros sistemas.** Cuando ocurre un hecho importante —entra un nuevo
  contacto interesado, cambia el estatus de una propiedad o se publica una— el portal avisa por
  su cuenta a los demás sistemas de TAR. Cada aviso va firmado, de manera que el sistema que lo
  recibe pueda confirmar que proviene realmente de TAR y no de un tercero. Si el otro sistema
  estuviera caído en ese momento, el portal reintenta la entrega por su cuenta, hasta cinco
  veces y esperando un poco más en cada intento, y guarda registro de todo.
- **Conexión de entrada para sistemas externos.** Un sistema externo, por ejemplo un CRM o un
  automatizador como Zapier, puede a su vez actualizar contactos o propiedades del portal
  mediante una llave de acceso propia, con permisos acotados a aquello que se le autorice.

## Material disponible para revisión
- En una propiedad se pueden cargar varias fotos y verlas ya optimizadas, reordenarlas y
  elegir la portada.
- El formulario de contacto público recibe solicitudes de informes; al llegar una, el contacto
  aparece en el listado de prospectos y se le puede mover de etapa.
- Quedó demostrado que un aviso automático se entrega de verdad a otro sistema: se envió uno a
  un receptor de prueba, que confirmó tanto la firma como el registro de entregado.

## Decisiones
- La función de Guardar o Favoritos para el público se pospone, porque requiere que los
  visitantes puedan crear una cuenta de usuario, algo previsto para una etapa posterior.

## Pendientes y riesgos
- Falta que el cliente proporcione la llave de acceso de SendGrid, el servicio que envía los
  correos. Mientras no esté disponible, el portal funciona igual; simplemente no manda los
  correos reales en el entorno de desarrollo.

## Estado de avance
El motor del portal —la parte que no se ve pero que hace funcionar todo: guarda la información,
recibe los contactos, envía los avisos y conecta con los demás sistemas— se encuentra alrededor
del 70 por ciento. Ya están listas las piezas de fotos, captación de prospectos y avisos
automáticos; restan las dos últimas, cargar el inventario real y documentar el motor, previstas
para la próxima semana.

## Próximos pasos
- Construir el importador del inventario real desde EasyBroker, para traer las propiedades
  verdaderas de TAR al portal.
- Dejar el motor documentado de forma interactiva, de manera que cada función pueda probarse y
  comprenderse con claridad.

---

### Detalle técnico (referencia)
- **Media (A.3):** subida de imágenes que **siempre se re-optimizan a WebP** (versión grande +
  miniatura), se guardan en disco con nombre por contenido y se registran en la BD. Reordenar,
  marcar portada, texto alternativo y borrar (también del disco).
- **Leads (A.4):**
  - Formulario público con **anti-spam (honeypot)**, **rate-limit** y **consentimiento de
    privacidad (LFPDPPP)** sellado con fecha. Notificación por email (SendGrid).
  - **CRM**: listado, detalle con bitácora y cambio de etapa del **pipeline**
    (Nuevo → Cita agendada → Cita concretada → Apartado → Firma de contrato).
  - Registro de **vistas** de propiedad para la analítica del panel.
- **Webhooks (A.4):**
  - **Salientes**: cuando ocurre un evento (nuevo lead, cambio de estatus, publicación) se
    **envía un aviso firmado (HMAC-SHA256)** al sistema del cliente, con **reintentos
    automáticos** (hasta 5, con espera creciente) y bitácora.
  - **Entrantes**: un sistema externo (CRM/Zapier) puede actualizar leads o propiedades con una
    **llave de API** y permisos (scopes).
  - Se usa una **cola de trabajos (pg-boss)** para que la entrega sea confiable.
- **Evidencia:** **34 pruebas** en verde (suman media, leads y webhooks; incluye la **firma
  HMAC**). El verificador `pnpm smoke` **entrega un webhook real** a un receptor local y
  confirma la firma y la bitácora `entregado`.
- **Métricas:** Fase A **~70%** (A.1–A.4 de 6).
