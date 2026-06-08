# Glosario — Plataforma TAR Internacional

Significado de los términos, roles, estatus y conceptos que aparecen en el sistema.

## Conceptos generales
- **Propiedad (property):** inmueble del catálogo. Puede ofrecerse en **venta**,
  **renta** o **ambas** (precios duales).
- **Lead (prospecto):** persona interesada que llena el formulario de contacto o de
  cita. Alimenta el CRM.
- **Slug:** la parte legible de la URL de una propiedad (ej. `casa-3-recamaras-polanco`).
  Se genera al publicar y es **permanente** (no cambia, para no romper el SEO).
- **Amenidad:** característica/servicio del inmueble (alberca, elevador, seguridad…).
- **PostGIS / geo:** extensión geográfica de la base de datos; guarda la ubicación
  (`geo`) para mostrar el inmueble en el mapa y buscar por zona.
- **bbox:** “caja” geográfica (las 4 esquinas del mapa visible) usada para buscar las
  propiedades que caen dentro del área que el usuario está viendo.
- **Soft delete (borrado suave):** nada se borra de verdad; se marca como eliminado
  para no perder el histórico (leads asociados, etc.).

## Roles de usuario (del panel)
- **admin (Administrador):** acceso total, incluye gestión de usuarios y borrado.
- **editor (Editor):** opera el día a día (propiedades, leads, imágenes) sin
  funciones de administración.
> *(Antes existía “broker”; por decisión del cliente ahora son “usuarios”
> administrativos con rol admin/editor.)*

## Estatus de una **propiedad** (estatus comercial)
- **borrador:** en captura, no visible al público (también donde caen las importadas
  que necesitan revisión).
- **disponible:** publicada y visible.
- **apartado:** reservada (visible con distintivo).
- **rentado / vendido:** operación cerrada (no se lista al público).
- **pausado:** retirada temporalmente.
> Solo **disponible** y **apartado** se muestran en el sitio público.

## Etapas de un **lead** (pipeline del CRM)
`nuevo` → `cita_agendada` → `cita_concretada` → `apartado` → `firma_contrato`
(+ `descartado` para los perdidos). Cada cambio queda en la **bitácora** y dispara un
**webhook** para sincronizar con el CRM externo.

## Posicionamiento (featured)
- **normal · destacada · premium:** nivel de prioridad de la propiedad. En el listado
  y el mapa, **premium > destacada > normal** (aparecen primero).

## Webhooks e integraciones
- **Webhook:** aviso automático (HTTP POST) entre sistemas cuando pasa algo.
- **Salientes:** TAR → un sistema externo (CRM, Zapier). Se **firman** con HMAC-SHA256
  (cabecera `X-TAR-Signature`) y se **reintentan** si fallan.
- **Entrantes:** un sistema externo → TAR, para actualizar un lead o propiedad. Usa una
  **llave de API** (`X-API-Key`) con **scopes** (permisos: `leads:write`,
  `properties:write`).
- **Eventos disponibles:** `lead.created`, `lead.status_changed`, `property.published`,
  `property.status_changed`.
- **Scope:** permiso que define qué puede hacer una llave de API.
- **HMAC-SHA256:** firma criptográfica que prueba que el aviso viene realmente de TAR.

## Precios y moneda
- **Precios duales:** una propiedad puede tener precio de **venta** y de **renta**, cada
  uno en **MXN o USD**.
- **Normalización a MXN:** internamente se calcula el precio en MXN (con `USD_MXN_RATE`)
  **solo para filtrar y ordenar**; al usuario **siempre** se le muestra el precio y la
  moneda originales.

## Marketing y analítica
- **Scripts de marketing:** fragmentos de código (Google Tag Manager, píxeles) que el
  cliente inserta sin tocar el código, en `head`/`body`/`footer`.
- **Vista (view):** registro de que alguien abrió la ficha de una propiedad; alimenta
  la analítica del panel.

## Cumplimiento
- **LFPDPPP:** Ley Federal de Protección de Datos Personales en Posesión de los
  Particulares (México). El formulario exige **consentimiento** y guarda su fecha
  (`consent_at`) con enlace al Aviso de Privacidad.
- **Honeypot:** campo oculto anti-spam; si un bot lo llena, se rechaza el envío.

## Importación
- **EasyBroker:** plataforma que TAR usa hoy; el **importador** migra su inventario
  (CSV) una sola vez al nuevo sistema.
- **external_ref:** el id público de EasyBroker; sirve para que re-importar **actualice**
  en vez de duplicar (idempotencia).
