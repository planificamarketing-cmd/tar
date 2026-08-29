# Manual del panel de administración (Backoffice)

Guía práctica para operar el panel de **TAR Internacional**. Está pensada para
personas **no técnicas**: explica, pantalla por pantalla, qué se puede hacer y cómo.

> El panel es de uso **interno**. No se enlaza desde el sitio público; se entra por
> una dirección propia (en producción, un subdominio del tipo
> `panel.tarinternacional.com`).

---

## 1. Entrar al panel

1. Abre la dirección del panel y verás la pantalla de acceso (cuadro rojo **TAR**).
2. Escribe tu **correo** y **contraseña** y pulsa **Entrar**.
3. Si los datos son correctos entrarás al **Dashboard**.

- La sesión se mantiene sola mientras trabajas y se renueva en segundo plano. Si
  pasas mucho tiempo inactivo o cierras el navegador, vuelve a entrar.
- **Cerrar sesión:** botón abajo a la izquierda, bajo tu nombre.
- ¿Olvidaste la contraseña? Pídele a un **Administrador** que te la restablezca
  desde **Usuarios** (ver §6). No hay autoservicio de "olvidé mi contraseña".

### Roles (qué puede hacer cada quien)
El panel se **adapta al rol**: oculta las secciones y los botones que esa persona
no puede usar. Además, cada acción sensible está protegida también en el servidor:
aunque el botón no se muestre, la operación se rechaza si el rol no tiene permiso.

| Rol | Para quién | Puede |
|---|---|---|
| **Administrador** | Dirección / responsable del sistema | Todo: propiedades, leads, **usuarios**, **ajustes/integraciones**, **scripts**. |
| **Editor** | Equipo que carga y publica inmuebles | El día a día: propiedades, imágenes y leads. **No** ve Usuarios, Ajustes ni Scripts. |
| **Ventas** | Asesores comerciales | Atiende los **leads** (da seguimiento y cambia etapas). **Consulta** el catálogo, pero **no lo edita**. |
| **Lector** | Consulta / auditoría | **Solo lectura**: ve propiedades y leads, sin modificar nada. |

---

## 2. Cómo está organizado el panel

A la izquierda está el menú, agrupado en tres bloques:

- **General:** Dashboard · Propiedades · Nueva propiedad
- **CRM:** Leads · Usuarios · Scripts
- **Configuración:** Ajustes

El contenido aparece a la derecha. Tu nombre y rol se muestran abajo del menú.

---

## 3. Dashboard (pantalla de inicio)

Es el resumen del negocio de un vistazo:

- **Indicadores (arriba):** propiedades publicadas (y cuántas en borrador), leads del
  mes, leads en seguimiento y cierres.
- **Gráficas:** leads por mes, mezcla de inventario por tipo, estado de las
  propiedades (disponibles, apartadas, rentadas, vendidas, borradores…).
- **Leads recientes:** los últimos prospectos que entraron.

Todos los datos son **en vivo**: reflejan lo que hay en el sistema en ese momento.

---

## 4. Propiedades

### 4.1 Ver y buscar el inventario
En **Propiedades** ves **todas** las propiedades, en cualquier estado (incluidos los
**borradores**, que el público no ve).

- **Filtros por estatus** (Todas, Borrador, Disponible, Apartado, Rentado, Vendido,
  Pausado) y **buscador** por título.
- Cada fila muestra: miniatura, título, ubicación, tipo, precio, estatus y fecha.
- La etiqueta dorada **Premium**/**Destacada** indica las propiedades resaltadas.
- La etiqueta roja **En remate** marca las propiedades en remate. El botón
  **En remate** (junto a *Archivadas*) filtra para ver solo esas.

### 4.2 Acciones rápidas (desde la tabla)
- **Publicar** (solo en borradores): pasa la propiedad a *disponible* (ver requisitos
  abajo).
- **Cambiar estatus** (en publicadas): menú para marcar Apartado, Rentado, Vendido,
  Pausado, Disponible.
- **Editar:** abre la ficha completa.
- **Archivar:** la quita del inventario activo. **No se borra de verdad** (se puede
  recuperar); los datos y el histórico se conservan.

### 4.3 Dar de alta una propiedad (asistente)
1. Pulsa **Nueva propiedad**.
2. Llena los **datos generales** (título, tipo, descripción), **precios**,
   **características** (recámaras, baños, m²…), **ubicación** y **amenidades**.
3. Pulsa **Guardar borrador**. La propiedad se crea en estado **borrador** y te lleva
   a su ficha para terminar (imágenes y publicación).

> Se requiere **al menos un precio** (venta o renta) y cada precio lleva su **moneda**
> (MXN o USD). El sistema siempre muestra el precio en su moneda original.

### 4.4 La ubicación en el mapa
La propiedad necesita un **punto en el mapa** para poder publicarse. En la sección
**Ubicación** capturas estado, municipio/alcaldía, colonia y dirección, y fijas el
punto de una de estas formas (de la más cómoda a la de respaldo):

- **En el mapa:** haz clic donde está el inmueble o **arrastra el pin** para ajustarlo.
  Las coordenadas de abajo se actualizan solas.
- **Pegando un enlace de Google Maps** (el sistema extrae las coordenadas y, si el
  enlace lo trae, también estado, municipio, colonia, dirección y CP) y pulsando
  **Autocompletar**.
- Escribiendo **latitud y longitud** a mano.

Un distintivo indica si ya está **Ubicado** o **Sin ubicar**.

> ℹ️ El mapa funciona **sin ninguna cuenta ni contratación**: usa OpenStreetMap, el
> mapa libre que mantiene una comunidad mundial. No hay cuotas ni facturas que
> vigilar.

### 4.5 Imágenes
En la ficha de la propiedad, sección **Imágenes**:

- **Arrastra** las fotos a la zona indicada o haz clic para seleccionarlas (hasta 20 a
  la vez).
- El sistema las **optimiza automáticamente** (las convierte a formato web ligero y
  genera miniaturas). No necesitas preparar nada.
- Pasa el cursor sobre una foto para **marcarla como Portada** o **Eliminarla**. La
  portada es la que se ve en los listados.

En la sección **Videos** (debajo de Imágenes) puedes subir videos en **horizontal o
vertical** (MP4, WebM o MOV, hasta 50 MB). Al elegir el archivo, el sistema **detecta
la orientación** automáticamente y puedes corregirla antes de subir. Cada video se
puede previsualizar y eliminar.

### 4.6 Características y metraje
- **Características:** recámaras, baños, medios baños, estacionamientos, construcción
  y terreno (m²).
- **Metraje de oficina:** cuando el **tipo** es *Oficina*, aparecen además
  **Superficie útil (m²)** y **Superficie rentable (m²)**.
- **Áreas exteriores (con metraje):** según el tipo de inmueble se muestran
  **Patio**, **Terraza** y **Balcón** (departamento, casa y oficina) y **Jardín**
  (casa y departamento). Cada una es opcional y lleva sus m².

### 4.7 Amenidades, destaque y remate
- **Amenidades:** marca las que apliquen (alberca, elevador, seguridad…). Si te falta
  una, escríbela en **"Agregar amenidad"** y pulsa **Agregar**: se añade al catálogo y
  queda seleccionada. La próxima vez ya aparece para todas las propiedades.
- **Destaque:** Normal, **Destacada** o **Premium**. Premium y Destacada **suben** en
  el orden del listado público.
- **En remate:** casilla independiente del destaque. Aplica a **venta y renta** y
  convive con cualquier estatus; muestra la etiqueta **En remate** en el listado.

### 4.8 Publicar
Pulsa **Publicar** (en la ficha o en la tabla). Para publicar, la propiedad debe tener:

- ✅ **Ubicación** fijada en el mapa.
- ✅ Al menos **un precio**.

Si falta algo, el sistema lo avisa y no publica. Al publicar se genera su **dirección
web (slug)**, que es **permanente** (no cambia, para no perder posicionamiento).

> **Guardar vs. Publicar:** *Guardar cambios* conserva tus ediciones; *Publicar* la
> hace visible al público. En una propiedad ya publicada, usa el selector de **estatus
> comercial** para cambiar entre Disponible/Apartado/Vendido/etc.

### 4.9 Acciones en la tabla de propiedades
En cada fila (columna **Acciones**):

- **Publicar** (si es borrador) / **A borrador** (si está publicada, la despublica y la
  regresa a borrador).
- **Flyer** — descarga una **imagen lista para compartir** (formato vertical, tipo
  historia/post) con la foto de portada, el precio, la ubicación, los datos clave y las
  etiquetas (En remate / Premium). Disponible para todos los roles. También está en la
  ficha, como **Descargar flyer**.
- **Folleto PDF** (en la ficha) — descarga la **ficha completa imprimible** (carta) con
  portada, precio, especificaciones, descripción, características, superficies y
  galería. Hay dos versiones:
  - **Folleto PDF** — la copia **interna**: incluye la **dirección exacta** (calle y
    número).
  - **PDF sin dirección** — la copia para **enviar a un prospecto**: muestra solo la
    zona (colonia, municipio, estado). El archivo se descarga con el sufijo
    `-sin-direccion` para que no se confundan.

  > La ficha PDF que el visitante descarga desde el portal, y la que viaja hacia tus
  > automatizaciones cuando alguien deja sus datos, es **siempre la versión sin
  > dirección**. La dirección exacta solo sale si tú descargas la copia interna.
- **Editar** — abre la ficha.
- **Duplicar** — crea una **copia como borrador** (con "(copia)" en el título) para
  publicar variantes rápido. Copia datos y amenidades; no copia las fotos.
- **Archivar** — la quita del inventario. **No se borra de verdad**: puedes recuperarla.

**Pestaña "Archivadas":** muestra las archivadas; cada una tiene botón **Restaurar**
para devolverla al inventario.

**Acciones masivas:** marca la casilla de varias filas (o la del encabezado para toda
la página) y aparece una barra para aplicar a todas a la vez: **Publicar**, **Regresar
a borrador**, **Cambiar estatus a…** o **Archivar** (en Archivadas: **Restaurar**).

**Probar webhooks:** el botón arriba a la derecha envía un evento
`property.published` de **prueba** a los webhooks suscritos y te muestra si cada uno
respondió (útil para validar tu integración sin publicar nada real).

---

## 5. Leads (prospectos / CRM)

Los **leads** son las personas que llenan el formulario de contacto o de cita en el
sitio. (El formulario público llega con la **Fase B**; el CRM ya está listo para
recibirlos y los webhooks externos también pueden crearlos.)

### 5.1 Tablero
En **Leads** ves la lista con filtro por etapa y buscador. Cada fila muestra nombre,
contacto, tipo (contacto/cita) y etapa. Puedes **seleccionar varios** (casillas) y
**cambiar su etapa en bloque** con la barra de acciones masivas.

### 5.2 Ficha del lead
Al abrir un lead ves sus datos, su mensaje y la **bitácora** (historial de todo lo que
le ha pasado). Desde ahí **cambias su etapa** en el pipeline:

`Nuevo → Cita agendada → Cita concretada → Apartado → Firma de contrato`
(+ **Descartado** para los que no avanzan).

Cada cambio queda registrado en la bitácora y **avisa automáticamente** a los sistemas
externos conectados (ver Integraciones).

> Los leads **no se borran** (borrado suave), para conservar el histórico comercial.

---

## 6. Usuarios *(solo Administrador)*

En **Usuarios** gestionas quién entra al panel.

- **Alta:** botón **Nuevo usuario** → nombre, correo, rol (Administrador / Editor /
  Ventas / Lector) y contraseña.
- **Editar:** cambia el nombre, el rol, **restablece la contraseña** (déjala en blanco
  para no cambiarla) o activa/desactiva la cuenta.
- **Desactivar (baja):** la cuenta deja de poder entrar y se le cierran las sesiones
  abiertas. **No se borra** (se conserva su historial); aparece como **Inactivo**.
- **Reactivar:** los usuarios inactivos muestran el botón **Reactivar** para volver a
  darles acceso.
- **Filtro por estado:** usa **Activos / Inactivos / Todos** para ocultar o revisar las
  cuentas dadas de baja.

> Los usuarios no se eliminan por completo a propósito: así no se rompe el historial de
> quién hizo cada cambio ni los leads que tuvieran asignados.

### Protecciones automáticas (para no quedarte sin acceso)
- No puedes **cambiarte el rol** ni **desactivarte a ti mismo**.
- Siempre debe quedar **al menos un Administrador activo**: el sistema impide
  desactivar o degradar al último.

> El **correo no se puede cambiar** una vez creado el usuario (es su identificador).
> Si cambia, crea un usuario nuevo y desactiva el anterior.

---

## 7. Ajustes · Integraciones *(solo Administrador)*

En **Ajustes** conectas TAR con tus herramientas (CRM, Zapier, HubSpot…) **sin
intermediarios de pago**. Hay dos direcciones:

### 7.1 Salientes — TAR avisa a tus sistemas (Webhooks)
Cuando ocurre algo en TAR (entra un lead, se publica una propiedad…), la plataforma
envía un aviso automático a la dirección (URL) que configures.

- **Nuevo webhook:** nombre, **URL de destino**, un **secreto de firma**, y los
  **eventos** que lo disparan. Puedes activarlo/desactivarlo.
- **Eventos disponibles:** `lead.created`, `lead.status_changed`,
  `property.published`, `property.status_changed` (con su descripción en pantalla).
- **Seguridad y reintentos:** cada aviso va **firmado** (cabecera `X-TAR-Signature`)
  para que el receptor confirme que viene de TAR. Si el destino no responde, se
  **reintenta hasta 5 veces** con esperas crecientes.
- **Bitácora de entregas:** tabla con cada envío, su estado (Pendiente/Entregado/
  Fallido), el código de respuesta y los intentos. En las **fallidas** puedes pulsar
  **Reintentar**.
- **Enviar prueba:** cada webhook tiene un botón **Probar** (y también lo hay al
  crearlo/editarlo): envía un payload de ejemplo a su URL y te dice al instante si el
  destino respondió bien. Ideal para validar tu integración (n8n, etc.) **sin** tener
  que publicar una propiedad real. También hay un botón **"Probar webhooks"** en la
  sección de Propiedades que dispara un evento de prueba a todos los suscritos.

#### Cómo es el aviso que envía TAR (para configurar n8n, Make, Zapier…)
Cada aviso es una **petición `POST`** (no `GET`) con el cuerpo en JSON. Así se ve
exactamente lo que llega al publicar una propiedad:

- **Método:** `POST`
- **Cabeceras:**
  - `Content-Type: application/json`
  - `X-TAR-Event: property.published` (el nombre del evento)
  - `X-TAR-Signature: <hmac>` (firma HMAC-SHA256 del cuerpo con tu secreto)
- **Cuerpo (body)** — al **publicar una propiedad** llega con todos los datos:
  ```json
  {
    "event": "property.published",
    "data": {
      "id": "b9373cc9-…",
      "slug": "casa-en-polanco",
      "url": "https://tu-sitio.com/propiedades/casa-en-polanco",
      "title": "Casa en Polanco",
      "description": "Amplia casa con jardín…",
      "price": { "sale": 8500000, "saleCurrency": "MXN", "rent": null, "rentCurrency": null },
      "bedrooms": 3, "bathrooms": 2, "parking": 2, "areaM2": 220,
      "location": { "estado": "Ciudad de México", "municipio": "Miguel Hidalgo", "colonia": "Polanco" },
      "cover": "https://tu-sitio.com/media/…/portada.webp",
      "images": ["https://tu-sitio.com/media/…/1.webp", "https://tu-sitio.com/media/…/2.webp"],
      "amenities": ["Alberca", "Seguridad 24h"]
    },
    "timestamp": "2026-07-07T04:54:08.361Z"
  }
  ```
  > **`property.published` incluye fotos, descripción, precio, amenidades y ubicación**
  > — todo listo para usar en tu flujo. Los demás eventos (`property.status_changed`,
  > `lead.*`) son más ligeros; si necesitas todos los datos de una propiedad puedes
  > pedirlos (sin login) a `GET /api/v1/properties/{slug}`.
  >
  > 📋 **La referencia completa de cada payload está en el propio panel:** *Ajustes →
  > Integraciones → "Qué datos manda cada aviso"* (con botón de copiar).

**Pasos en n8n:**
1. Agrega un nodo **Webhook**. En **HTTP Method** elige **POST** (viene en `GET` por
   defecto — esa suele ser la razón por la que "no deja" recibir el aviso).
2. Copia la **URL** del nodo y pégala en TAR → *Ajustes → Integraciones → Nuevo
   webhook*, elige el evento (`property.published`) y un **secreto**; guárdalo activo.
3. En n8n, la **Test URL** solo escucha mientras pulsas **"Listen for test event"**
   (un disparo). Para que funcione siempre, **activa** el workflow y usa la
   **Production URL**.
4. **Que n8n sea alcanzable desde el servidor de TAR:** si usas **n8n Cloud** funciona
   directo. Si corres n8n **en tu PC** y TAR está en otra máquina/WSL, `localhost` no
   sirve: usa la IP o el dominio público de n8n (un túnel tipo ngrok/cloudflared o el
   host correcto). Si la entrega sale **Fallida** en la bitácora, casi siempre es esto.
5. (Opcional) Para verificar la firma en n8n: calcula HMAC-SHA256 del cuerpo con tu
   secreto y compáralo con `X-TAR-Signature`.

> Recuerda: `property.published` se dispara **solo al publicar**. Cambiar el estatus
> luego dispara `property.status_changed`; un nuevo contacto dispara `lead.created`.
> Suscribe el webhook a los eventos que te interesen.

### 7.2 Entrantes — tus sistemas actualizan TAR (Llaves de API)
Con una **llave de API**, un sistema externo puede actualizar datos en TAR (por
ejemplo, mover un lead de etapa) de forma segura.

- **Nueva llave:** nombre y **permisos** (qué puede hacer: actualizar leads y/o
  propiedades).
- ⚠️ **La llave completa se muestra una sola vez**, al crearla. Cópiala y guárdala en
  un lugar seguro; después solo se ve cifrada. Si se pierde, crea otra y **revoca** la
  anterior.
- **Revocar:** desactiva la llave de inmediato.
- El sistema externo llama a `POST /webhooks/inbound` enviando su llave en la cabecera
  `X-API-Key`. (Detalle técnico para quien haga la integración.)

### 7.3 Segmentos · Meta

Un **segmento** es un conjunto de propiedades definido por **filtros estrictos**
(operación, tipo, rango de precio, recámaras, ubicación, destaque, en remate). Cada
segmento genera un **feed** (catálogo) que puedes conectar a **Meta** (Facebook /
Instagram) para anunciar solo ese subconjunto.

- **Nuevo segmento:** ponle nombre, elige el **formato del feed** y los filtros. Verás
  cuántas propiedades cumplen (**conteo de coincidencias**).
- **Formato del feed:** **Inmobiliario (Home Listings)** —recomendado si tu catálogo en
  Meta es de bienes raíces; incluye ubicación en el mapa, tipo, recámaras, baños y
  superficie— o **Catálogo comercial** (genérico).
- **Copiar feed:** botón que copia la **URL del feed** (termina en `.csv`). Esa URL es
  la que se pega en Meta (catálogo → origen de datos → feed programado). La URL lleva
  un **código único** que hace de llave; compártela solo con quien deba.
- El feed incluye **solo propiedades disponibles** que cumplen **todos** los filtros;
  se actualiza solo cuando cambia el inventario.
- **Activar/Desactivar:** un segmento inactivo deja de servir su feed. **Editar** y
  **Eliminar** disponibles en cada uno.

---

## 8. Scripts de marketing *(solo Administrador)*

En **Scripts** insertas código de terceros (Google Analytics, Tag Manager, píxeles de
Facebook, chats…) sin tocar el código del sitio.

- **Lista (izquierda):** cada script con su estado y dónde se inyecta. Un **interruptor**
  permite **activar/desactivar** al instante.
- **Editor (derecha):** nombre, **ubicación** y el **código**.
- **Ubicaciones:**
  - **Head** (`<head>`): analytics, verificaciones de propiedad del sitio.
  - **Body** (`<body>`): por ejemplo el complemento de Google Tag Manager.
  - **Footer** (`</body>`): chats y píxeles que conviene cargar al final.
- **Nuevo script:** botón arriba a la derecha; **Eliminar** desde el editor.

> Pega solo código de **fuentes de confianza**: se inserta tal cual en el sitio.
>
> 🔧 *Importante:* la **inserción real de estos scripts en el sitio público** forma
> parte de la **Fase B** (frontend público), que está en pausa hasta la firma del
> diseño. Hoy ya puedes **capturar y organizar** los scripts; empezarán a ejecutarse
> cuando el sitio público entre en línea.

---

## 9. Preguntas frecuentes

**¿Por qué no veo "Usuarios", "Ajustes" o "Scripts"?**
Porque tu rol es **Editor**. Esas secciones son solo para **Administradores**.

**Subí una propiedad pero no aparece en el sitio.**
Revisa que esté **publicada** (no en borrador) y con estatus **Disponible**. Además, el
**sitio público** se entrega en la Fase B; por ahora el inventario se gestiona y se ve
desde el panel.

**¿Puedo recuperar una propiedad o un lead "borrado"?**
Sí. Nada se borra de verdad: se **archiva/desactiva**. Pídelo al equipo técnico para
reactivarlo.

**¿Las fotos hay que optimizarlas antes?**
No. El sistema las convierte y comprime automáticamente al subirlas.

**¿Qué pasa si pego mal una llave de API o un webhook?**
Nada se rompe: puedes **editar** el webhook o **revocar** la llave y crear otra. Las
entregas fallidas quedan en la **bitácora** para reintentarlas.

---

## 10. Qué falta (para tener todo el panorama)
- **Firma del diseño** por parte de TAR: cierra la ventana de cambios de interfaz.
- **Mapa: ✅ funcionando.** Vista de mapa en el buscador del sitio, mapa en cada
  ficha y pin arrastrable en este panel. No necesita contratar nada.
- **Salida a producción** (dominio, respaldos, capacitación): Fase de Lanzamiento.

> Glosario de términos: **[GLOSARIO.md](GLOSARIO.md)**. Documentación técnica de la
> API: levanta el sistema y abre **`/docs`**.
