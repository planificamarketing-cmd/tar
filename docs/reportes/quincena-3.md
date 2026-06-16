# Reporte quincenal — Quincena 3 (Semanas 5–6)

**Fases cubiertas:** Fase A — Backend (A.5–A.6) + cierre · inicio Fase C · **Corte:** 17 de julio de 2026

## Resumen ejecutivo
En esta quincena quedó terminado por completo el motor que mueve la plataforma y se
preparó la carga del inventario real de propiedades del cliente. La herramienta que
incorpora ese inventario quedó probada con el archivo de 105 propiedades, incluida la
descarga de sus fotografías. Con la etapa del motor cerrada, se abrió el armado del panel
de administración desde el cual el equipo de TAR gestionará el portal. El proyecto
mantiene una holgura considerable respecto al calendario.

## Hitos alcanzados
- **Carga del inventario real.** Se construyó una herramienta que toma el inventario de
  propiedades tal como el cliente lo mantiene en su catálogo y lo incorpora a la
  plataforma: ordena cada dato en su lugar, convierte las direcciones en puntos del mapa,
  descarga y optimiza las fotografías, y arma las amenidades de cada propiedad. Es
  re-ejecutable sin duplicar, de modo que puede correrse varias veces sin crear
  propiedades repetidas. Quedó probada con las 105 propiedades del cliente, 35 en venta y
  70 en renta.
- **Documentación interactiva del motor de la plataforma.** Cada función del motor quedó
  descrita en una página donde puede probarse en vivo qué hace y qué responde, sin
  necesidad de programar. Resulta útil tanto para el equipo de desarrollo como para
  cualquier sistema que en el futuro se conecte al portal.
- **Etapa del motor cerrada al 100%.** Se cumplieron todos los criterios para dar la
  etapa por terminada: el motor está completo, verifica que todo dato entre correcto, es
  seguro, está documentado y superó la totalidad de sus pruebas. Incluye los avisos
  automáticos a otros sistemas (webhooks), que entregan la información y la reintentan si
  algo falla.
- **Herramientas de comprobación.** Quedaron disponibles comandos sencillos para verificar
  que cada parte funciona, sin necesidad de confiar únicamente en la palabra del equipo.
- **Documentación de entrega y sistema de reportes** quedaron iniciados.

## Avance vs cronograma
El avance global del portal se sitúa en torno al 50%. Esta cifra mide cuánto del conjunto
—motor, panel de administración y sitio público— está terminado, y la mitad ya está
construida. El proyecto avanza con holgura: todo el motor de la plataforma quedó listo
cuando el calendario apenas lo ubicaba en esta semana 6.

## Demostraciones disponibles
Lo construido puede comprobarse en vivo:
- Una verificación automática que recorre las funciones clave y confirma que responden
  bien (21 de 21 en verde).
- La documentación interactiva donde se prueba cada función del motor.
- Un visor de la base de datos para revisar la información cargada.
- La herramienta de carga del inventario corriendo en modo de prueba, sin escribir nada
  todavía, para anticipar qué incorporaría a partir del inventario real.

## Decisiones acordadas con el cliente
- El inventario real del cliente se carga a partir de su catálogo en la hoja de cálculo de
  Google (Google Sheets), y las fotografías se descargan directamente desde las URLs de
  ese catálogo. De este modo la carga no queda supeditada a los tiempos de EasyBroker.
- Mientras se cierra el diseño, se prioriza el panel de administración para que el equipo
  de TAR pueda empezar a operar el portal cuanto antes.

## Riesgos y dependencias
- **Firma del diseño aprobado:** es el único pendiente que detiene el arranque del sitio
  público que verán los visitantes. Conviene precisar que las observaciones pendientes son
  sobre todo de carácter estético —ajustes de imagen y presentación—; la estructura y el
  funcionamiento del portal ya están definidos. El prototipo navegable está en línea para
  revisión: https://tar-mvp.netlify.app/
- Para el Lanzamiento harán falta algunos accesos de terceros (mapa de Google y servicio
  de envío de correos), aún no necesarios en esta etapa.

## Plan de la siguiente quincena
- Construir el panel de administración sobre el motor ya terminado, para que el equipo de
  TAR gestione propiedades, prospectos y usuarios desde una interfaz propia.

---

### Detalle técnico (referencia)
- **Importador idempotente** (re-ejecutable por `external_ref` sin duplicar): mapea las
  columnas del catálogo, geocodifica direcciones, descarga y optimiza imágenes desde las
  URLs del propio catálogo (Google Sheets) y crea amenidades. Validado contra el inventario
  real del cliente: **105 propiedades, 35 venta / 70 renta**.
- **Documentación interactiva** de la API en `/docs` (Swagger) + export `openapi.json`.
- **Fase A 100% cerrada** (Definición de Hecho / DoD cumplida): API completa, validada
  (Zod), segura, documentada y probada (**44 pruebas**); webhooks entregan y reintentan.
- **Herramientas de verificación:** `pnpm smoke` (21/21), `pnpm test`, `pnpm db:web`,
  Swagger en `/docs`, `pnpm import:inventario … --dry-run`.
- **Documentación de entrega** y el sistema de reportes (semanal + quincenal) iniciados.
- **Avance global ~50%**; backend (Fases 0, 1, A) listo, adelantado frente al cronograma
  que lo ubicaba hasta la semana 6.
- Pendientes para Lanzamiento: API keys de Google Maps / SendGrid / Cloudflare R2.
