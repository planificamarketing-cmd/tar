# Reporte quincenal — Quincena 4 (Semanas 7–8)

**Fases cubiertas:** Fase C — Backoffice (panel de administración), completa · **Corte:** 31 de julio de 2026

## Resumen ejecutivo
En esta quincena quedó terminado por completo el panel de administración del portal. El
equipo de TAR ya puede publicar y gestionar propiedades —con fotografías y ubicación—,
dar seguimiento a sus prospectos, administrar a los usuarios del sistema, conectar el
portal con otras herramientas y colocar sus códigos de medición y marketing. Todo desde
una pantalla pensada para personas no técnicas y fiel al diseño revisado con el cliente.
El proyecto conserva una holgura considerable respecto al calendario.

## Hitos alcanzados
- **Gestión completa del catálogo de propiedades.** El alta de una propiedad se realiza con
  un asistente paso a paso (datos → ubicación → fotos → amenidades → publicar). Puede
  marcarse su estatus comercial, destacarla como Premium o Destacada y archivarla de forma
  segura, sin borrarla definitivamente. Las fotografías se optimizan solas al subirlas,
  para que el portal cargue rápido.
- **Seguimiento de prospectos por etapas (CRM).** Un tablero ordena a cada interesado según
  la etapa en que se encuentra (recién llegado, en contacto, cerrado, entre otras). Cada
  prospecto cuenta con su ficha y bitácora de lo conversado, y los avances se reflejan al
  instante, incluso hacia otros sistemas conectados.
- **Usuarios y permisos.** Es posible dar de alta, dar de baja o cambiar el rol de cada
  persona del equipo, con candados que evitan que por error alguien quede sin acceso al
  sistema.
- **Conexiones con otras herramientas, sin costos mensuales.** El portal puede enviar avisos
  automáticos a otros sistemas (webhooks) —por ejemplo a un CRM o a Zapier— de forma
  firmada, con bitácora y reintentos si algo falla. También entrega llaves de acceso para
  que sistemas externos se conecten de forma segura, que se muestran una sola vez y pueden
  cancelarse cuando se requiera.
- **Códigos de medición y marketing.** Desde el panel pueden colocarse las herramientas de
  medición y publicidad (Analytics, Tag Manager, píxeles de redes, chats), elegir en qué
  páginas aparecen y activarlas al momento.
- **Manual de administración entregado** para que el equipo opere el panel por su cuenta.

## Avance vs cronograma
El avance global del portal se sitúa en torno al 82%. Esta cifra mide cuánto del conjunto
—motor, panel de administración y sitio público— está terminado, y ya se superaron las
cuatro quintas partes. El proyecto avanza con holgura: el calendario ubicaba el panel de
administración hasta la semana 8 y ya está completo y probado, con el motor de la
plataforma cerrado desde antes.

## Demostraciones disponibles
Lo construido puede comprobarse en vivo:
- **Panel en funcionamiento:** con un usuario de prueba se recorre el tablero, el alta y
  publicación de propiedades, los prospectos, los usuarios, las conexiones con otras
  herramientas y los códigos de marketing.
- **Pruebas automáticas** que confirman que cada flujo funciona, todas en verde.
- La **documentación interactiva** del motor, donde se prueba cada función, y el **manual
  de administración** para el equipo.

## Decisiones acordadas con el cliente
- **Ubicación de las propiedades:** mientras llega la llave de acceso del mapa de Google, la
  ubicación se fija con coordenadas o con un enlace de Google Maps. En cuanto se integre esa
  llave, podrá ubicarse la propiedad arrastrando un punto directamente sobre el mapa.
- La colocación de los códigos de marketing dentro del sitio y el formulario de contacto que
  verá el público llegarán junto con el sitio público, en la siguiente fase.

## Riesgos y dependencias
- **Firma del diseño aprobado:** es el único pendiente que detiene el arranque del sitio
  público. Conviene precisar que las observaciones pendientes son sobre todo de carácter
  estético —ajustes de imagen y presentación—; la estructura y el funcionamiento del portal
  ya están definidos. El prototipo navegable está en línea para revisión:
  https://tar-mvp.netlify.app/
- Insumos necesarios para las siguientes fases: llave de acceso de Google Maps, cuenta del
  servicio de correo, nombre de dominio, servidor y respaldos.

## Plan de la siguiente quincena
- Abrir la ronda de firma del diseño con el cliente sobre el prototipo navegable
  (https://tar-mvp.netlify.app/).
- Una vez firmado, arrancar la construcción del sitio público que verán los visitantes.
- En paralelo, al recibir los accesos, preparar el servidor para la salida a producción.

---

### Detalle técnico (referencia)
- **Catálogo:** alta con asistente (datos → ubicación → imágenes → amenidades → publicar),
  estatus comercial, destaque Premium/Destacada y archivado (soft delete). Imágenes
  re-encodeadas/optimizadas (sharp → WebP) al subir.
- **CRM:** tablero de leads por etapa (pipeline), ficha con bitácora y avance en vivo, con
  sincronización hacia sistemas externos.
- **Usuarios y roles:** alta/baja/rol con protecciones para no quedarse sin acceso.
- **Integraciones sin costos recurrentes:** webhooks salientes (firmados, con bitácora y
  reintentos) y API keys entrantes (mostradas una sola vez, revocables).
- **Scripts de marketing:** Analytics, Tag Manager, píxeles y chats, gestionables por
  ubicación y activables al instante.
- **Manual de administración:** `docs/MANUAL-ADMIN.md`.
- **Pruebas:** **62 pruebas automáticas** en verde y verificaciones en vivo de cada flujo.
  **Documentación interactiva** de la API en `/docs` (**31 endpoints**).
- **Avance global ~82%**; Fase C completa y probada (cronograma la ubicaba hasta la semana
  8), con backend (Fases 0/1/A) cerrado desde antes.
- **Decisiones técnicas:** ubicación por coordenadas/enlace de Maps mientras llega la API
  key de Google (pin arrastrable al integrarla); inyección de scripts en el sitio y
  formulario público de leads en Fase B.
- **Dependencias pendientes:** API key de Google Maps, cuenta SendGrid, dominio, servidor y
  respaldos.
