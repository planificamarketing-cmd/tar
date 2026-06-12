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
| Rol | Puede |
|---|---|
| **Administrador** | Todo: propiedades, leads, **usuarios**, **ajustes/integraciones**, **scripts**. |
| **Editor** | El día a día: propiedades, imágenes y leads. **No** ve Usuarios, Ajustes ni Scripts. |

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
punto de una de estas formas:

- Escribiendo **latitud y longitud**, o
- **Pegando un enlace de Google Maps** (el sistema extrae las coordenadas) y pulsando
  **Fijar**.

Un distintivo indica si ya está **Ubicado** o **Sin ubicar**.

> 🔧 *Próxima mejora:* cuando esté disponible la llave de Google Maps del cliente, esta
> sección mostrará un **mapa con un pin arrastrable**. Mientras tanto, las coordenadas
> manuales o el enlace de Maps cumplen la misma función.

### 4.5 Imágenes
En la ficha de la propiedad, sección **Imágenes**:

- **Arrastra** las fotos a la zona indicada o haz clic para seleccionarlas (hasta 20 a
  la vez).
- El sistema las **optimiza automáticamente** (las convierte a formato web ligero y
  genera miniaturas). No necesitas preparar nada.
- Pasa el cursor sobre una foto para **marcarla como Portada** o **Eliminarla**. La
  portada es la que se ve en los listados.

### 4.6 Amenidades y destaque
- **Amenidades:** marca las que apliquen (alberca, elevador, seguridad…).
- **Destaque:** Normal, **Destacada** o **Premium**. Premium y Destacada **suben** en
  el orden del listado público.

### 4.7 Publicar
Pulsa **Publicar** (en la ficha o en la tabla). Para publicar, la propiedad debe tener:

- ✅ **Ubicación** fijada en el mapa.
- ✅ Al menos **un precio**.

Si falta algo, el sistema lo avisa y no publica. Al publicar se genera su **dirección
web (slug)**, que es **permanente** (no cambia, para no perder posicionamiento).

> **Guardar vs. Publicar:** *Guardar cambios* conserva tus ediciones; *Publicar* la
> hace visible al público. En una propiedad ya publicada, usa el selector de **estatus
> comercial** para cambiar entre Disponible/Apartado/Vendido/etc.

---

## 5. Leads (prospectos / CRM)

Los **leads** son las personas que llenan el formulario de contacto o de cita en el
sitio. (El formulario público llega con la **Fase B**; el CRM ya está listo para
recibirlos y los webhooks externos también pueden crearlos.)

### 5.1 Tablero
En **Leads** ves la lista con filtro por etapa y buscador. Cada fila muestra nombre,
contacto, tipo (contacto/cita) y etapa.

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

- **Alta:** botón **Nuevo usuario** → nombre, correo, rol (Administrador/Editor) y
  contraseña.
- **Editar:** cambia el nombre, el rol, **restablece la contraseña** (déjala en blanco
  para no cambiarla) o activa/desactiva la cuenta.
- **Desactivar (baja):** la cuenta deja de poder entrar y se le cierran las sesiones
  abiertas. No se borra; puede reactivarse después.

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
- **Sitio público** (búsqueda, fichas, formulario de leads, mapa, inyección de los
  scripts): **Fase B**, en pausa hasta la **firma del diseño**.
- **Mapa con pin arrastrable** en la ubicación de propiedades: al integrar la **llave
  de Google Maps** del cliente (mientras tanto, coordenadas o enlace de Maps).
- **Salida a producción** (dominio, respaldos, capacitación): Fase de Lanzamiento.

> Glosario de términos: **[GLOSARIO.md](GLOSARIO.md)**. Documentación técnica de la
> API: levanta el sistema y abre **`/docs`**.
