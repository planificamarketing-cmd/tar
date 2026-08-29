# Reporte semanal — Semana 11

**Fase del cronograma:** Fase B — pulido y ajustes solicitados por el cliente ·
**Corte:** 2026-08-29

## Objetivo de la semana
Atender el paquete de ajustes que pidió TAR tras revisar el sitio, todos alrededor de
un mismo criterio de negocio: **no divulgar la ubicación exacta de una propiedad hasta
que la operación avanza**, más presencia de marca y visibilidad para las propiedades
que TAR tiene en exclusiva.

## Entregables / lo realizado

1. **La dirección del folleto se puede mostrar u ocultar, y por defecto va oculta.**
   El folleto PDF tiene ahora dos versiones:
   - **Pública / para enviar** — muestra solo la zona (colonia, municipio, estado).
     Es la que descarga el visitante desde el portal y la que se manda al prospecto.
   - **Interna** — con calle y número. Se descarga desde la ficha del panel con el
     botón **Folleto PDF**; junto a él aparece **PDF sin dirección** para compartir.

   El archivo sin dirección se descarga con el sufijo `-sin-direccion` para que no se
   confundan. De paso se corrigió la repetición de la colonia ("Roma Norte, Cuauhtémoc,
   Roma Norte, Cuauhtémoc") que traía el inventario importado.

2. **La ficha del portal ya no publica la calle.** Muestra colonia, municipio y estado.
   La dirección exacta queda para el asesor.

3. **Zona aproximada en el mapa de la ficha.** Se conserva el pin y se dibuja alrededor
   un **círculo** que comunica el área, con la nota *"El círculo marca la zona
   aproximada… la dirección exacta se comparte con tu asesor durante el proceso"*. El
   radio es configurable por entorno (400 m por defecto) para abrirlo o cerrarlo sin
   tocar el código.

4. **Logotipo más grande** en la cabecera del portal: de 52/66 px a **64/84 px**
   (celular/computadora). Se compensó con menos margen vertical para que la barra fija
   no se coma pantalla, y se reajustó el arranque de cada página pública.

5. **Propiedades en exclusiva.** Campo nuevo en la ficha del panel (**En exclusiva**)
   que hace dos cosas:
   - muestra la insignia **Exclusiva** en el listado, la ficha, el panel y los dos
     folletos;
   - la propiedad **cuenta como destacada** en el orden por relevancia, así que **entra
     sola a la sección "Propiedades destacadas" de la portada** sin tener que cambiarle
     el destaque.

   Se agregó también el filtro por exclusiva en el panel y la columna *En exclusiva* en
   la exportación a Excel/CSV.

6. **La ficha PDF viaja hacia el prospecto en automático.** Cuando alguien deja sus
   datos en el formulario de una propiedad, el aviso `lead.created` incluye ahora el
   folleto listo para adjuntar:

   ```json
   "flyer": {
     "url": "https://tu-sitio.com/api/v1/properties/casa-en-polanco/flyer.pdf",
     "filename": "ficha-casa-en-polanco.pdf",
     "contentType": "application/pdf",
     "includesAddress": false
   }
   ```

   En n8n basta un nodo **HTTP Request** que descargue esa URL y un nodo de correo que
   la adjunte al `email` del prospecto. **Siempre es la versión sin dirección.**

## Evidencia de que funciona
- **Calidad:** revisión de estilo y de tipos sin errores en todo el monorepo;
  **121 pruebas automáticas en verde** (9 nuevas: 5 sobre la línea de ubicación del
  folleto, 4 sobre el campo exclusiva) y compilación de producción del sitio en verde.
- **Folleto, comprobado sobre una propiedad de prueba** (extrayendo el texto real del
  PDF generado):

  | Versión | Calle | Zona | Insignia Exclusiva |
  |---|---|---|---|
  | Pública (visitante y webhook) | no | sí | sí |
  | Panel, copia interna | **sí** | sí | sí |
  | Panel, `?direccion=0` | no | sí | sí |

- **Destacados:** consultando el orden por relevancia que alimenta la portada, la
  propiedad marcada **solo** como exclusiva (destaque *normal*) aparece entre las seis
  primeras, por delante de propiedades destacadas más antiguas.
- **Webhook:** el enlace del folleto que viaja en `lead.created` se descarga sin login y
  responde un PDF válido (comprobado dentro de la prueba automática).
- **Peso del sitio:** el buscador (`/propiedades`) queda en **109 kB** y la ficha en
  **127 kB** de carga inicial — sin regresión pese al círculo y las insignias nuevas.

## Decisiones / desviaciones
- **La versión por defecto del folleto es la que NO lleva dirección.** La copia con
  calle y número solo se obtiene desde el panel: así ningún envío automático puede
  filtrar la ubicación exacta por descuido.
- **Se conserva el pin exacto** en el mapa de la ficha, por indicación de TAR, y el
  círculo se suma como señal de zona.
- **El PDF viaja como enlace, no como archivo incrustado** en el aviso. Es lo que
  esperan n8n/Make/Zapier, evita avisos de varios MB y permite que el folleto se genere
  siempre con los datos más recientes.
- Campo `is_exclusive` nuevo en la base (migración `0006`), con valor por defecto
  *falso*: ninguna propiedad existente cambia hasta que TAR la marque.

## Riesgos / bloqueos / pendientes del cliente
- **Confirmar** que la ficha del portal debe quedarse sin la calle (hoy así está) y si
  400 m es el radio adecuado del círculo de zona.
- **Marcar las propiedades en exclusiva** en el panel: el campo existe, pero el dato lo
  tiene TAR. Nada cambia en la portada hasta que se marquen.
- Sin cambios en los pendientes de siempre: servidor, dominio y datos oficiales.

## Métricas
- 5 commits (uno por ajuste, más la traída de los cambios del 18 de agosto).
- 121 pruebas automáticas en verde (antes 112).
- 1 migración de base de datos; 2 variables de entorno nuevas, ambas **opcionales**.

## Lo que sigue
- Marcar el inventario en exclusiva y revisar cómo queda la portada.
- Fase QA: medición de rendimiento (§9 del PRD) sobre el servidor real.
