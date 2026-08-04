# Reporte semanal — Semana 10

**Fase del cronograma:** Fase B — Frontend público · **Corte:** 2026-08-03

## Objetivo de la semana
Incorporar el **mapa interactivo** al sitio y al panel. En la Semana 09 se había
acordado dejarlo fuera; el cliente pidió reactivarlo, así que se construye completo
tal como lo describe la propuesta (§7.1 y §7.3 del PRD).

## Entregables / lo realizado
- **Vista de mapa en el buscador (`/propiedades`).** Junto a *cuadrícula* y *lista*
  ahora hay un tercer botón: **mapa**. Muestra las propiedades como **etiquetas de
  precio** sobre el mapa, no como alfileres genéricos: se lee el precio de un vistazo.
  - Las etiquetas usan el **azul marino de la marca**; las **destacadas/premium**
    salen en **dorado con estrella** y por encima de las demás; la seleccionada se
    marca en **rojo TAR**.
  - Cuando hay muchas propiedades juntas se **agrupan en burbujas con el número**
    de inmuebles; al hacer clic, el mapa se acerca y las separa.
  - **Al hacer clic en una etiqueta** aparece una **vista previa** con foto,
    ubicación, características y precio, que lleva a la ficha completa.
  - **Busca conforme mueves el mapa**: al desplazar o acercar, la lista de pines se
    actualiza con lo que hay en pantalla. Se puede **desactivar** con la casilla
    "Buscar al mover el mapa" y usar el botón "Buscar en esta zona".
  - Respeta **todos los filtros** activos (operación, tipo, precio, recámaras, etc.).
- **Mapa en la ficha de cada propiedad.** Nueva sección **Ubicación** con el punto
  exacto del inmueble, la dirección y un enlace **"Cómo llegar"** que abre Google Maps.
- **Mapa en el panel de administración.** Al capturar la ubicación de una propiedad ya
  no hay que escribir coordenadas: se **hace clic en el mapa** o se **arrastra el pin**.
  Se conservan como respaldo el pegado de un enlace de Google Maps y la captura manual.

## Evidencia de que funciona
- **Búsqueda por zona probada contra la API:** el mismo buscador devuelve 12
  propiedades en total, **9** al acotar el área a la Ciudad de México, **0** en un área
  de Yucatán, y **6** al combinar esa zona con el filtro *renta* (que por sí solo da 7).
  Es decir: el área del mapa y los filtros se aplican juntos, como debe ser.
- **Páginas verificadas en vivo:** `/propiedades`, `/propiedades?view=map` y la misma
  vista con filtros responden correctamente; el botón de mapa aparece en los controles.
- **Sin castigo de velocidad:** el mapa se carga **solo cuando se abre esa vista**
  (archivo aparte). El peso inicial del buscador se mantiene en ~110 kB, igual que antes
  de agregarlo — requisito de rendimiento §9.
- Compilación de producción del sitio y revisiones de calidad (tipos y estilo) en verde.

## Decisiones / desviaciones
- **Se revierte la decisión de la Semana 09** de omitir el mapa: el cliente lo pidió de
  vuelta. Se construye con **Google Maps Platform**, como está comprometido en el PRD.
- El buscador por **texto/autocompletado de ubicación se mantiene**: el mapa se suma
  como otra forma de buscar, no sustituye a la anterior.
- **Degradado seguro:** mientras no exista la llave de Google Maps, las tres pantallas
  muestran un aviso claro (y en la ficha, un enlace a Google Maps) en lugar de fallar.
  El resto del sitio funciona al 100%.

## Riesgos / bloqueos / pendientes del cliente
- 🔑 **Llave de Google Maps de TAR** (y el *Map ID* de la misma cuenta). Es lo único que
  falta para ver el mapa funcionando; el código ya está listo y esperándola. Al
  entregarla conviene **restringirla al dominio definitivo** para que nadie más la use.
- Sigue pendiente **publicar el inventario real con su ubicación**: hoy la mayoría de
  las propiedades están en borrador y sin punto en el mapa, así que el mapa se verá
  vacío hasta que se ubiquen.

## Métricas
- 3 pantallas nuevas con mapa (buscador, ficha, panel) · vista de mapa integrada a los
  filtros existentes · peso inicial del buscador sin cambio (~110 kB).

## Lo que sigue
- Recibir la llave de Google Maps y verificar el mapa con el inventario real.
- Fase QA: auditoría de rendimiento (Lighthouse) en el servidor, caché en la API y
  pruebas de extremo a extremo.
