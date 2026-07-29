# TAR Internacional — Reporte 03

**Etapa:** Sitio público y herramientas de captación · **Corte:** 28 de Julio 2026 · **Entrega 03**

## Resumen

En esta tercera entrega el **sitio público** —lo que verán los clientes finales— se
presenta ya navegable de principio a fin: página de inicio, **buscador**, listado de
propiedades con filtros, **ficha de cada propiedad** y formularios de contacto que caen
directo en la gestión de prospectos del panel.

Sobre esa base se incorporaron las mejoras solicitadas en la última revisión: un **folleto
PDF descargable** por propiedad con la imagen de marca de TAR, un **buscador más claro** con
filtros avanzados, la priorización real de las propiedades marcadas como **premium** y **en
remate**, la **captura de campañas de marketing (UTM)** lista para enviarse a sistemas
externos, y varios ajustes de presentación (logotipo más presente, separadores de miles en
el panel y corrección de los enlaces de Google Maps). Todo se ve y funciona bien en
**celular, tableta y computadora**.

## El sitio público

Por primera vez se recorre el **sitio que usarán los clientes finales**:

- **Inicio (home).** Un buscador principal donde el visitante elige **comprar o rentar**,
  el tipo de propiedad, su presupuesto, la zona (con autocompletado) y las recámaras; abajo,
  las **propiedades destacadas** y una sección para explorar por categoría.
- **Listado de propiedades.** Resultados con **filtros** a un lado, orden (relevancia,
  recientes, precio) y vista en cuadrícula o lista. Los filtros se reflejan en la dirección
  (URL), de modo que una búsqueda se puede **compartir** tal cual.
- **Ficha de la propiedad.** Galería de fotos y videos, precio, características, descripción,
  datos de superficie, ubicación, propiedades similares y el **formulario de contacto**.
- **Contenido y confianza.** Páginas de *Nosotros*, *Contacto* y *Aviso de Privacidad*, más
  el trabajo de posicionamiento (SEO) para que Google encuentre e indexe el portal.

## Avances de la tercera entrega

- **Folleto PDF por propiedad.** Cada propiedad genera un **folleto en PDF** con la
  identidad de TAR (logotipo y colores de marca) que reúne **toda la información de la
  ficha**: portada, precio, características, descripción, superficies, galería de imágenes,
  ubicación y el enlace al anuncio. Está disponible en **dos lugares**: en el **panel**
  (para que el equipo lo descargue y comparta con un prospecto) y en la **página pública de
  cada propiedad** (botón "Descargar folleto (PDF)", para que el propio interesado lo
  descargue). Se genera al momento, siempre con la información más reciente.

- **Destaque real de premium y remate.** Las propiedades marcadas como **premium** o **en
  remate** ahora **suben** en la portada y en el listado: primero las premium, luego las
  destacadas, y dentro de cada grupo las que están en remate. Además, al marcar una
  propiedad como premium o en remate, la **portada del sitio se actualiza de inmediato**, sin
  esperas.

- **Buscador más claro y filtros avanzados.** El buscador se rediseñó para que se entienda a
  la primera: la elección de **comprar/rentar** es ahora un interruptor visible, los campos
  llevan ícono y guía, y se ofrecen los mismos tipos de propiedad en todo el sitio. Se
  agregó una sección de **filtros avanzados** (precio mínimo, **baños**, **estacionamientos**
  y **rango de superficie en m²**) que se suman a los básicos, todos verificados de extremo a
  extremo.

- **Captura de campañas de marketing (UTM) hacia sistemas externos.** Cuando un visitante
  llega desde una campaña (Facebook, Google, etc.), el formulario **captura los parámetros
  de campaña (UTM)** y los **envía junto con el prospecto** a los sistemas externos
  conectados (CRM, automatizaciones) mediante webhooks. Desde el panel existe un **botón de
  prueba** que envía un aviso de ejemplo **ya con los datos de campaña**, para validar la
  conexión antes de salir a producción.

- **Presentación y detalles de captura.** El **logotipo** de TAR se muestra **más grande** en
  la cabecera; en el panel, los campos de **precio y metros cuadrados** muestran los
  **separadores de miles** al estilo de México (por ejemplo, `8,500,000`), más fáciles de
  leer y capturar.

- **Corrección de los enlaces de mapa.** Al capturar la ubicación de una propiedad, ahora se
  admiten mejor los **enlaces cortos de Google Maps** (los que empiezan por
  `maps.app.goo.gl`): el sistema los sigue y extrae la ubicación con más tolerancia. Para el
  uso definitivo del mapa en producción se recomienda confirmar el acceso de Google Maps del
  cliente.

## Nuestro trabajo como consultora

En esta etapa GBS Digital tradujo la operación comercial en herramientas concretas de
**captación**: un folleto listo para compartir con la marca de TAR, un buscador pensado para
que el cliente no se pierda, la priorización de los inmuebles que el equipo quiere empujar
(premium/remate) y la trazabilidad de **de dónde llega cada prospecto** (campaña de origen).
El objetivo es que el portal no solo se vea bien, sino que **genere y ordene prospectos**.

## Material disponible para revisión

- El **sitio público** navegable de extremo a extremo (inicio, listado, ficha, contacto).
- El **folleto PDF** de una propiedad, descargable tanto desde el panel como desde la web.
- El **buscador** con filtros básicos y avanzados, y la priorización de premium/remate.
- El **botón de prueba de integración** que envía un prospecto de ejemplo con datos de
  campaña (UTM).

## Decisiones

- El folleto se ofrece en **dos formatos complementarios**: el **PDF** (ficha completa para
  compartir con un prospecto) y la **imagen** existente (pensada para redes sociales).
- La **portada** del sitio se actualiza con frecuencia para reflejar pronto los cambios de
  destaque, publicación o remate.
- Los **filtros avanzados** se presentan plegados por defecto para no saturar la búsqueda;
  se despliegan cuando el visitante los necesita.

## Pendientes y riesgos

- **Datos oficiales del cliente.** Para cerrar el sitio se requieren los **datos de contacto
  reales** (teléfono, correo, dirección) y el **texto oficial del Aviso de Privacidad**; hoy
  se muestran textos de ejemplo.
- **Inventario real.** Las propiedades reales ya importadas deben **publicarse con su
  ubicación** para que aparezcan en el sitio; requiere fijar su punto en el mapa.
- **Accesos de producción.** Servidor definitivo, dominio, servicio de correo y acceso de
  Google Maps. Al recibirlos se aprovisiona el entorno y se conecta el envío de avisos.
- **Pruebas finales de rendimiento** (velocidad de carga) sobre el servidor definitivo.

## Estado de avance

- **Motor de la plataforma (backend):** completo y probado.
- **Panel de administración:** completo y operable.
- **Sitio público:** navegable de extremo a extremo; pendiente de **datos reales del cliente**
  y de **publicar el inventario** con su ubicación.
- **Folleto PDF y herramientas de captación (UTM):** entregados y verificados.
- **Inventario real:** importado; pendiente de publicación con ubicación.
- **Pruebas finales y salida a producción:** pendientes del servidor definitivo.

## Lo que se verá en la siguiente sesión

1. El **sitio público con el inventario real** publicado y con los **datos oficiales** de TAR.
2. La **conexión de integraciones** (CRM / automatizaciones) recibiendo prospectos reales con
   su campaña de origen.
3. **Pruebas de rendimiento** sobre el entorno definitivo.

## Próximos pasos

1. Recibir del cliente los **datos oficiales** (contacto y Aviso de Privacidad) y los
   **accesos de producción**.
2. **Publicar el inventario real** con su ubicación en el mapa.
3. Aprovisionar el **servidor**, conectar el envío de correos y las integraciones.
4. **Pruebas finales** de rendimiento y salida a producción.

## Detalle técnico (referencia)

- **Folleto PDF.** Generado en el servidor con una librería ligera de PDF (sin navegadores
  headless, apto para el servidor del cliente); las imágenes se re-procesan para incrustarse
  en el documento. Dos rutas: una **privada** para el panel (permite previsualizar borradores)
  y una **pública por propiedad** que solo entrega folletos de propiedades **publicadas**.
- **Priorización premium/remate.** El orden de relevancia considera el nivel de destaque
  (`premium` > `destacada` > normal) y, dentro de cada nivel, prioriza las marcadas **en
  remate**. Al editar el destaque de una propiedad ya publicada, se dispara la
  **actualización inmediata** de la portada y el listado (revalidación bajo demanda).
- **Filtros.** Se ampliaron los filtros del sitio público (precio mínimo, baños,
  estacionamientos y rango de superficie), verificados contra el motor de búsqueda: los
  conteos de resultados coinciden en el sitio y en la API.
- **UTM y webhooks.** El formulario captura los parámetros `utm_*` de la dirección y viajan
  en el evento `lead.created` (junto con el prospecto y un resumen de la propiedad). El envío
  se firma (HMAC). El **modo de prueba** del panel ahora incluye datos de campaña de ejemplo.
- **Formato de captura.** Los campos numéricos del panel muestran separadores de miles
  (formato `es-MX`) manteniendo el valor limpio para el guardado.
- **Enlaces de Google Maps.** El resolvedor de enlaces cortos sigue la redirección y, si la
  página intermedia no expone la ubicación en la dirección final, la **extrae del contenido**
  de la página (URL de destino embebida o coordenadas del punto).
- **Verificación.** Revisión de tipos sin errores; **112 pruebas automáticas** en verde;
  compilación del sitio en verde; y comprobación en vivo: folleto PDF válido (panel y web),
  la propiedad premium+remate encabeza portada y listado, y los filtros avanzados devuelven
  conteos congruentes.
