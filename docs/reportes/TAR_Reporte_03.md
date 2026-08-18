# TAR Internacional — Reporte 03

**Etapa:** Sitio público, herramientas de captación, mapa interactivo y preparación para
producción · **Corte:** 17 de Agosto 2026 · **Entrega 03**

## Resumen

En esta tercera entrega el **sitio público** —lo que verán los clientes finales— se
presenta ya navegable de principio a fin: página de inicio, **buscador**, listado de
propiedades con filtros, **ficha de cada propiedad** y formularios de contacto que caen
directo en la gestión de prospectos del panel.

Sobre esa base se incorporaron las mejoras solicitadas en la última revisión: un **folleto
PDF descargable** por propiedad con la imagen de marca de TAR, un **buscador más claro** con
filtros avanzados, la priorización real de las propiedades marcadas como **premium** y **en
remate**, la **captura de campañas de marketing (UTM)** lista para enviarse a sistemas
externos, la **exportación completa de prospectos e inventario a Excel/CSV**, un **panel de
administración cómodo desde el celular** y varios ajustes de presentación (logotipo más
presente, separadores de miles en el panel).

Después de esa revisión se sumaron dos bloques importantes. Primero, el **mapa
interactivo**: el cliente pidió reactivarlo y hoy funciona en tres pantallas (buscador,
ficha y panel); al decidir TAR **no abrir cuenta de facturación en Google**, se cambió el
proveedor a **OpenStreetMap**, con las mismas funciones y **sin llave, sin tarjeta y sin
cuotas**. Segundo, quedó **lista y probada toda la maquinaria para instalar la plataforma en
un servidor real**: instalación en un solo comando, certificado de seguridad automático,
respaldos diarios y restauración verificada. Todo se ve y funciona bien en **celular,
tableta y computadora**.

**Con esto, lo único que falta para salir a producción es el servidor y el dominio del
cliente, los datos oficiales de TAR y publicar el inventario real.**

## El sitio público

Por primera vez se recorre el **sitio que usarán los clientes finales**:

- **Inicio (home).** Un buscador principal donde el visitante elige **comprar o rentar**,
  el tipo de propiedad, su presupuesto, la zona (con autocompletado) y las recámaras; abajo,
  las **propiedades destacadas** y una sección para explorar por categoría.
- **Listado de propiedades.** Resultados con **filtros** a un lado, orden (relevancia,
  recientes, precio) y vista en cuadrícula, lista o **mapa**. Los filtros se reflejan en la
  dirección (URL), de modo que una búsqueda se puede **compartir** tal cual.
- **Ficha de la propiedad.** Galería de fotos y videos, precio, características, descripción,
  datos de superficie, **ubicación en el mapa**, propiedades similares y el **formulario de
  contacto**.
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
  leer y capturar. En la ficha pública se corrigió además la **dirección repetida** que
  aparecía en algunas propiedades importadas (por ejemplo, "Roma Norte, Cuauhtémoc, Roma
  Norte, Cuauhtémoc"): ahora se muestra una sola vez.

- **Exportación de datos a Excel/CSV, ahora completa.** La descarga de información pasó de un
  simple resumen de indicadores a **dos exportaciones de datos reales**, listas para abrir en
  Excel o importar a un CRM, y que **respetan los filtros activos** en pantalla:
  - **Prospectos (leads):** una fila por prospecto con contacto, tipo, **etapa**, origen, la
    **propiedad de interés y su enlace**, la **campaña de marketing (UTM) de origen**, el
    asesor asignado, el consentimiento y el mensaje. Sirve para el seguimiento comercial y
    para **medir qué campaña trae cada prospecto**.
  - **Inventario:** una fila por propiedad con tipo, operación, precios y monedas, superficies,
    recámaras/baños/estacionamientos, ubicación, estatus, destaque, remate, enlace y fechas.

  Los archivos abren correctamente con acentos en Excel en español. Los botones están en
  **Prospectos**, **Propiedades** y en el **Inicio del panel** (Prospectos / Inventario /
  Resumen).

- **Panel de administración cómodo desde el celular.** Todo el backoffice se revisó para
  gestionarse bien desde un teléfono: los listados de **Propiedades, Prospectos y Usuarios**
  pasan de una tabla que obligaba a desplazarse de lado a una **vista de tarjetas** pensada
  para el pulgar (foto, datos clave y acciones grandes), y en computadora se conserva la tabla
  completa. También se ajustaron el detalle de propiedad, la carga de fotos (marcar portada /
  eliminar ahora funciona al tacto) y las ventanas emergentes. Se adjunta una **galería de
  capturas** del panel en móvil.

## Mapa interactivo (nuevo)

El mapa se había dejado fuera en la revisión anterior; **el cliente pidió reactivarlo** y se
construyó completo. Está en **tres pantallas**:

- **Vista de mapa en el buscador.** Junto a *cuadrícula* y *lista* hay ahora un tercer botón:
  **mapa**. Las propiedades se muestran como **etiquetas de precio** —no como alfileres
  genéricos—, de modo que el precio se lee de un vistazo:
  - Las etiquetas usan el **azul marino de la marca**; las **premium/destacadas** salen en
    **dorado con estrella** y por encima de las demás; la seleccionada se marca en **rojo TAR**.
  - Cuando hay muchas propiedades juntas se **agrupan en burbujas con el número** de
    inmuebles; al hacer clic, el mapa se acerca y las separa.
  - **Al hacer clic en una etiqueta** aparece una **vista previa** con foto, ubicación,
    características y precio, que lleva a la ficha completa.
  - **Busca conforme se mueve el mapa**: al desplazar o acercar, los resultados se actualizan
    con lo que hay en pantalla. Se puede **desactivar** con la casilla "Buscar al mover el
    mapa" y usar el botón "Buscar en esta zona".
  - Respeta **todos los filtros** activos (operación, tipo, precio, recámaras, etc.).
- **Mapa en la ficha de cada propiedad.** Sección **Ubicación** con el punto exacto del
  inmueble, la dirección y un enlace **"Cómo llegar"** que abre Google Maps en el teléfono
  del visitante.
- **Mapa en el panel de administración.** Al capturar la ubicación de una propiedad ya no hay
  que escribir coordenadas: se **hace clic en el mapa** o se **arrastra el pin**. Se conservan
  como respaldo el pegado de un enlace de Google Maps —incluidos los **enlaces cortos**
  `maps.app.goo.gl`, que el sistema sigue y resuelve— y la captura manual.

**El buscador por texto y el autocompletado de ubicación se mantienen**: el mapa se suma como
otra forma de buscar, no sustituye a la anterior.

### Cambio de proveedor de mapas: de Google Maps a OpenStreetMap

TAR decidió **no abrir cuenta de facturación en Google** (Google la exige aunque el consumo
no llegue a cobrarse). En lugar de dejar el mapa apagado, se cambió el proveedor a **Leaflet +
OpenStreetMap**, el mapa libre mantenido por una comunidad mundial:

- **Sin llave, sin tarjeta y sin cuotas** que vigilar, ni riesgo de que el mapa se apague por
  un tema de facturación.
- **Mismas funciones y mismo aspecto**: etiquetas de precio con los colores de la marca,
  agrupación por zonas, vista previa al pulsar y pin arrastrable en el panel.
- Es software y datos **libres**, lo que refuerza la independencia de proveedores que pide el
  proyecto.
- El botón **"Cómo llegar"** de cada ficha sigue abriendo Google Maps en el teléfono del
  visitante (eso no tiene costo: es la aplicación que casi todos usan para navegar).
- El proveedor de mosaicos es **configurable**, así que se puede cambiar en el futuro sin
  tocar el código.

Es una **desviación respecto a la propuesta original** (§7.0 contemplaba Google Maps
Platform) y **conviene dejarla asentada por escrito**. Si algún día TAR prefiere Google, el
cambio de vuelta es acotado. **No bloquea nada: el mapa ya está funcionando.**

## Preparación para la salida a producción (nuevo)

Quedó **lista y probada** toda la maquinaria para instalar la plataforma en el servidor.
Antes no existía: el sitio funcionaba en desarrollo, pero no había forma de llevarlo a un
servidor real.

- **Instalación en un solo comando.** Con el servidor listo, poner la plataforma en línea es:
  traer el código, llenar el archivo de configuración y ejecutar un comando. El proceso revisa
  la configuración (y avisa de los errores típicos, como dejar datos de desarrollo), instala,
  actualiza la base de datos, levanta todo, comprueba que responde y permite **volver a la
  versión anterior** con un solo comando si algo sale mal.
- **Certificado de seguridad (HTTPS) automático**, renovación incluida, y redirección de `www`
  a una sola dirección — importante para Google.
- **La base de datos y el motor quedan cerrados a internet**: solo el sitio es público.
  Verificado.
- **Respaldos diarios en tres capas**: en el servidor (30 días), copia fuera del servidor en
  Cloudflare R2 y las imágenes completas del proveedor. El respaldo **comprueba cada archivo
  que genera**, para que nunca se dé por bueno uno dañado.
- **Restauración probada de verdad**, no solo escrita: se hizo un respaldo, se modificó la
  base después, se restauró y se confirmó que el sistema volvió exactamente al momento del
  respaldo.
- **Ambiente de pruebas** (staging) listo para levantar en el mismo servidor, con base de
  datos aparte, contraseña y oculto a los buscadores.
- **Manual de despliegue** para quien opere el servidor: instalación, actualizaciones,
  respaldos, qué hacer ante la pérdida total del servidor (objetivo: menos de 2 horas), tabla
  de problemas frecuentes y lista de verificación para el arranque.

## Nuestro trabajo como consultora

En esta etapa GBS Digital tradujo la operación comercial en herramientas concretas de
**captación**: un folleto listo para compartir con la marca de TAR, un buscador pensado para
que el cliente no se pierda, la priorización de los inmuebles que el equipo quiere empujar
(premium/remate) y la trazabilidad de **de dónde llega cada prospecto** (campaña de origen).
El objetivo es que el portal no solo se vea bien, sino que **genere y ordene prospectos**.

A eso se sumó una decisión de negocio con impacto directo: ante la negativa a abrir cuenta de
facturación en Google, en lugar de entregar el mapa apagado **se buscó y se implementó una
alternativa libre**, sin costo recurrente ni dependencia de un proveedor. Y se dejó la
plataforma **lista para instalarse**, con respaldos y plan de recuperación probados, para que
la salida a producción sea un trámite de horas y no un proyecto aparte.

## Material disponible para revisión

- El **sitio público** navegable de extremo a extremo (inicio, listado, ficha, contacto).
- La **vista de mapa** del buscador, el mapa de la ficha y el **pin arrastrable** del panel.
- El **folleto PDF** de una propiedad, descargable tanto desde el panel como desde la web.
- El **buscador** con filtros básicos y avanzados, y la priorización de premium/remate.
- El **botón de prueba de integración** que envía un prospecto de ejemplo con datos de
  campaña (UTM).
- Las **exportaciones a CSV** de prospectos e inventario (con los filtros que se apliquen).
- Una **galería de capturas** del panel de administración funcionando en celular y del mapa
  funcionando en navegador real.
- El **manual de despliegue** y el procedimiento de respaldo/restauración.

## Decisiones

- El folleto se ofrece en **dos formatos complementarios**: el **PDF** (ficha completa para
  compartir con un prospecto) y la **imagen** existente (pensada para redes sociales).
- La **portada** del sitio se actualiza con frecuencia para reflejar pronto los cambios de
  destaque, publicación o remate.
- Los **filtros avanzados** se presentan plegados por defecto para no saturar la búsqueda;
  se despliegan cuando el visitante los necesita.
- **Se revierte la decisión previa de omitir el mapa**: el cliente lo pidió de vuelta y se
  construyó completo.
- **El mapa usa OpenStreetMap en lugar de Google Maps** (ver el apartado anterior).
  Desviación respecto a la propuesta original, pendiente de confirmarse por escrito.

## Pendientes y riesgos

- **Datos oficiales del cliente.** Para cerrar el sitio se requieren los **datos de contacto
  reales** (teléfono, correo, dirección) y el **texto oficial del Aviso de Privacidad**; hoy
  se muestran textos de ejemplo.
- **Inventario real.** Las propiedades reales ya importadas deben **publicarse con su
  ubicación** para que aparezcan en el sitio y en el mapa; requiere fijar su punto (ya se
  puede hacer con un clic o arrastrando el pin).
- ⚠️ **Antes de cancelar EasyBroker.** La corrida definitiva del importador debe hacerse
  **mientras la cuenta de EasyBroker siga activa**: al cancelarla, las direcciones de las
  fotos alojadas allí dejan de funcionar y **las imágenes serían irrecuperables**. Conviene
  avisarnos antes de dar de baja el servicio.
- **Accesos de producción.** Servidor definitivo, dominio y servicio de correo. Al recibirlos
  se ejecuta el despliegue —ya construido y probado— y se conecta el envío de avisos.
  **Ya no se requiere acceso ni cuenta de Google Maps.**
- **Confirmación por escrito del cambio de proveedor de mapas** (Google → OpenStreetMap), por
  tratarse de una desviación de la propuesta original.
- **Firma del diseño.** La propuesta visual sigue pendiente de aprobación formal; al firmarse
  se cierra la ventana de cambios de interfaz sin costo.
- **Pruebas finales de rendimiento** (velocidad de carga) sobre el servidor definitivo: son
  medibles solo en el entorno real.

## Estado de avance

- **Motor de la plataforma (backend):** completo y probado.
- **Panel de administración:** completo y operable, **usable desde el celular** y con captura
  de ubicación en mapa.
- **Sitio público:** navegable de extremo a extremo, con **vista de mapa**; pendiente de
  **datos reales del cliente** y de **publicar el inventario** con su ubicación.
- **Folleto PDF, herramientas de captación (UTM) y exportación a CSV:** entregados y verificados.
- **Mapa interactivo (buscador, ficha y panel):** entregado y verificado en navegador real,
  con OpenStreetMap.
- **Infraestructura de producción (instalación, HTTPS, respaldos, restauración, staging):**
  construida y **probada de extremo a extremo**; a la espera del servidor del cliente.
- **Inventario real:** importado; pendiente de publicación con ubicación.
- **Pruebas finales y salida a producción:** pendientes del servidor definitivo.

## Lo que se verá en la siguiente sesión

1. El **sitio público con el inventario real** publicado, con ubicación en el mapa y con los
   **datos oficiales** de TAR.
2. La plataforma **instalada en el servidor del cliente**, con su dominio y HTTPS.
3. La **conexión de integraciones** (CRM / automatizaciones) recibiendo prospectos reales con
   su campaña de origen.
4. **Pruebas de rendimiento** sobre el entorno definitivo.

## Próximos pasos

1. Recibir del cliente los **datos oficiales** (contacto y Aviso de Privacidad) y los
   **accesos de producción** (servidor, dominio, correo).
2. Ejecutar la **corrida definitiva del importador** *antes* de cancelar EasyBroker.
3. **Publicar el inventario real** con su ubicación en el mapa.
4. Aprovisionar el **servidor**, ejecutar el despliegue y conectar el envío de correos y las
   integraciones.
5. **Pruebas finales** de rendimiento y salida a producción.

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
  (formato `es-MX`) manteniendo el valor limpio para el guardado. La dirección de la ficha
  pública se normaliza para no repetir colonia/municipio cuando el dato importado ya los
  incluye.
- **Enlaces de Google Maps.** El resolvedor de enlaces cortos sigue la redirección y, si la
  página intermedia no expone la ubicación en la dirección final, la **extrae del contenido**
  de la página (URL de destino embebida o coordenadas del punto). Se conserva como método de
  respaldo junto a la captura manual, ahora que existe el pin arrastrable.
- **Exportación CSV.** Dos endpoints en el servidor (`/leads/export.csv` y
  `/properties/admin/export.csv`) que reutilizan los mismos filtros del listado; salida
  RFC 4180 con marca UTF-8 (BOM) para que Excel en español lea los acentos. Sustituyen al
  resumen de indicadores que se armaba en el navegador. La API pasó a **52 rutas** documentadas.
- **Panel responsive.** Los listados renderizan **tarjetas por debajo de 1024 px** y la tabla
  a partir de ese ancho; los controles de estatus y acciones se comparten entre ambas vistas.
  Se corrigieron las acciones de la galería de fotos (visibles al tacto, no solo con el mouse)
  y el desbordamiento de ventanas emergentes.
- **Mapa.** Front construido con **Leaflet** sobre mosaicos de **OpenStreetMap** (proveedor y
  atribución configurables por entorno; la atribución es obligatoria por licencia y no debe
  retirarse). La agrupación de pines se calcula en el navegador con *supercluster*. La
  búsqueda por área usa el motor geográfico ya existente en la base de datos (PostGIS), que
  filtra por el rectángulo visible y lo **combina con los filtros** del buscador. Se retiraron
  las librerías y la llave de Google Maps.
- **Rendimiento del mapa (§9).** Los tres mapas se cargan **solo cuando se abre esa vista**
  (archivos aparte): el peso inicial del buscador se mantiene en **~110 kB**, igual que antes
  de agregarlo.
- **Infraestructura.** Imágenes de contenedor propias para el sitio y el motor, orquestación
  con Docker Compose (base de datos, migraciones, motor, sitio y servidor web), un único
  origen público con TLS automático, compresión **zstd + gzip** (el servidor web no incluye
  brotli de fábrica; zstd comprime mejor en navegadores modernos y gzip cubre al resto),
  cabeceras de seguridad y caché inmutable para imágenes y recursos estáticos. Script de
  despliegue con validación de configuración, verificación de salud y **rollback**.
- **Respaldos.** Volcado diario de la base y sincronización fuera del servidor; verificación
  de integridad de cada archivo generado; rotación de 30 días. La restauración recrea la base
  antes de cargar el volcado y respalda las imágenes previas por seguridad; incluye modo de
  simulación y confirmación escrita.
- **Verificación.** Revisión de tipos sin errores; **112 pruebas automáticas** en verde;
  compilación del sitio en verde. En vivo: folleto PDF válido (panel y web), la propiedad
  premium+remate encabeza portada y listado, los filtros avanzados devuelven conteos
  congruentes, las exportaciones CSV entregan los datos completos, y el panel se recorrió en
  un teléfono de 390 px (capturas adjuntas). **Mapa:** comprobado en navegador real (los
  mosaicos cargan sin fallos, aparecen etiquetas y burbujas, la vista previa abre al pulsar,
  el pin del panel actualiza las coordenadas al arrastrarlo) y contra la API: 12 propiedades
  en total, **9** al acotar el área a la Ciudad de México, **0** en un área de Yucatán y **6**
  al combinar esa zona con el filtro *renta* (que por sí solo da 7) — el área y los filtros se
  aplican juntos. **Producción:** stack levantado completo en local con HTTPS; sitio, panel,
  API y documentación respondiendo; base de datos y motor **cerrados** desde el exterior;
  ciclo de respaldo → cambio → restauración verificado con corte temporal correcto.
