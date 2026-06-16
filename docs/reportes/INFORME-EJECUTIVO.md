# Informe ejecutivo de avance — Plataforma TAR Internacional

**Preparado por:** GBS Digital · **Para:** TAR Internacional · **Corte:** 31 de julio de 2026

---

## Resumen

La plataforma cuenta ya con el motor interno (backend) y el panel de administración
terminados y probados. Con ello, el equipo de TAR está en condiciones de operar la
totalidad del catálogo y el CRM —el sistema que da seguimiento a los clientes
interesados desde el primer contacto hasta la firma—. Resta únicamente el sitio público,
cuya construcción queda a la espera de la aprobación del diseño. El proyecto avanza
holgadamente por delante del cronograma.

## Tablero de avance

```
Avance global  ████████████████░░░░  ~82%
```

Prácticamente todo lo que sostiene la operación interna está hecho y probado: el motor
de la plataforma, el panel donde el equipo gestiona propiedades y prospectos, y la base
de datos. Lo que falta es, sobre todo, el sitio público que verán los clientes finales
—en espera de la aprobación del diseño— y las pruebas finales previas a la salida a
producción.

| # | Fase | Qué incluye | Estado |
|---|---|---|:---:|
| 0 | Cimientos | Entorno, base de datos, CI | Completa |
| 1 | Datos + Prototipo | Modelo de datos · prototipo de diseño revisado | Completa (técnica) |
| A | Backend (motor) | Login, propiedades, imágenes, leads/CRM, webhooks, importador, documentación | Completa |
| C | Panel de administración | Donde el equipo publica y gestiona todo | Completa |
| B | Sitio público | El portal que ven los clientes finales | Espera aprobación del diseño |
| QA | Pruebas y rendimiento | Auditorías, optimización | Pendiente |
| — | Lanzamiento | Servidor, respaldos, capacitación | Pendiente |

Según el contrato, a estas alturas el proyecto debía ir por la semana 8; el trabajo
correspondiente a las semanas 1 a 8 —fases 0, 1, A y C— está completo y probado. Se
trata de un adelanto sin costo para el cliente, conforme a la cláusula §13.

## Hitos logrados

- **Base sólida y segura.** Base de datos geográfica profesional, acceso cifrado de
  operadores con roles diferenciados y las medidas de seguridad estándar del sector.
- **Catálogo completo.** Alta, edición y publicación de propiedades, buscador con
  filtros, mapa por zona, fichas detalladas e imágenes que se optimizan de forma
  automática.
- **Captación de clientes (leads) y CRM.** Formulario con protección anti-spam y aviso
  de privacidad, y un CRM que refleja el flujo del negocio: Nuevo, Cita, Apartado y
  Firma.
- **Integraciones (webhooks).** La plataforma notifica a sistemas externos —CRM o
  Zapier— y también puede recibir actualizaciones de ellos, de forma segura y confiable.
- **Inventario real cargado.** El inventario real del cliente, 105 propiedades, ya se
  encuentra cargado en la plataforma, con sus fotografías descargadas desde las URL del
  catálogo que el cliente mantiene en su hoja de cálculo de Google. No se trata
  únicamente de una herramienta probada: los datos reales ya están dentro del sistema.
- **Panel de administración completo (Fase C).** Desde una sola interfaz no técnica, el
  equipo de TAR puede publicar y gestionar propiedades —con asistente guiado, imágenes y
  ubicación—, atender prospectos en el CRM, administrar usuarios, conectar integraciones
  y colocar scripts de marketing. Incluye su manual de administración.
- **Diseño.** El prototipo fue revisado con el equipo de TAR y ajustado en panel, CRM,
  mapa y demás secciones, y se encuentra publicado para su aprobación. Las observaciones
  que restan son sobre todo de carácter estético —ajustes de imagen y presentación—; la
  estructura y las funciones del portal ya están construidas, de modo que lo pendiente es
  acabado visual y no rehacer trabajo. Hay una maqueta navegable del portal en línea, con
  los ajustes del equipo aplicados, que puede abrirse desde cualquier navegador sin
  instalar nada: **https://tar-mvp.netlify.app/**

## Lo que el cliente ya puede ver

- **Panel de administración en vivo.** Recorrido completo: tablero, alta y publicación de
  propiedades, CRM de leads, usuarios, integraciones y scripts.
- **Catálogo con inventario real.** El catálogo ya muestra las 105 propiedades reales del
  cliente, con sus fotografías.
- **Maqueta navegable del portal en línea**, para revisión y aprobación, con los ajustes
  del equipo ya aplicados; se abre desde cualquier navegador sin instalar nada:
  **https://tar-mvp.netlify.app/**
- **Documentación interactiva de la plataforma**, que permite probar cada función, junto
  con el manual de administración (`docs/MANUAL-ADMIN.md`).
- **Base de datos** y un recorrido automático que demuestra que todo funciona.

Las instrucciones técnicas para mostrar todo lo anterior se encuentran en
`docs/PUESTA-EN-MARCHA.md`.

## Pendientes y lo que se necesita del cliente

| Pendiente | ¿Para qué? | ¿Bloquea? |
|---|---|---|
| Aprobar el prototipo de diseño (las observaciones pendientes son sobre todo estéticas; la estructura y las funciones ya están construidas) | Construir el sitio público | Sí (Fase B) |
| Clave de acceso (API key) de Google Maps | Mapa real y ubicación de propiedades al importar | Parcial |
| Cuenta de SendGrid | Envío de correos de nuevos prospectos | No (entretanto, no se envían) |
| Dominio, servidor y respaldos (R2) | Salir a producción | En Lanzamiento |

## Próximos pasos

1. Recoger la aprobación del prototipo de diseño, lo que desbloquea el sitio público.
2. Tras la aprobación, construir el sitio público (Fase B).
3. En paralelo, al recibir los accesos, aprovisionar el servidor (Fase QA y Lanzamiento).

---

### Detalle por semana

Los reportes semanales y quincenales, con el detalle completo, se encuentran en esta
misma carpeta (`docs/reportes/`). El backlog íntegro y su estado están en
`PLAN_EJECUCION_FASES.md`.

### Cómo exportar este informe a PDF (para presentarlo)

- En **VS Code**: instalar la extensión *Markdown PDF* (yzane), hacer clic derecho sobre
  este archivo y elegir *Markdown PDF: Export (pdf)*.
- O bien abrir el archivo en GitHub o en un visor de Markdown y usar **Imprimir →
  Guardar como PDF**.
