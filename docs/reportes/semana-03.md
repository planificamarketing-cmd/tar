# Reporte semanal — Semana 03

**Etapa del proyecto:** Construcción del motor del portal — seguridad y catálogo
(Fase A: A.1 Acceso de operadores, A.2 Propiedades) · **Corte:** 26 de junio de 2026

## Resumen
Durante la semana se asentaron los cimientos de seguridad del portal, con el inicio de
sesión de los operadores, y se construyó el corazón del catálogo: crear, publicar, buscar
y mostrar propiedades. Con ello, la base sobre la que se apoyará todo el portal queda
operando.

## Avances de la semana
- **Inicio de sesión seguro para los operadores.** Las personas que administran el portal
  ya pueden entrar con usuario y contraseñas cifradas, ilegibles incluso para el equipo de
  desarrollo. La sesión es segura: caduca por sí sola tras un periodo de inactividad, se
  renueva de forma controlada y puede revocarse en cualquier momento. Existen además dos
  niveles de permiso —administrador y editor— y protección contra intentos de adivinar
  contraseñas.
- **El catálogo de propiedades ya funciona.** Se construyó el núcleo del portal:
  - Alta, edición y eliminación de propiedades, con la garantía de que nada se borra de
    verdad: la propiedad se marca como eliminada, pero puede recuperarse.
  - **Publicación** de una propiedad: el sistema verifica que la ubicación y los datos estén
    completos y le genera una dirección web legible y permanente —por ejemplo,
    `/casa-en-venta-colonia-centro`—, que no cambia con el tiempo.
  - **Buscador** para el público con filtros combinables: tipo de operación (venta o renta),
    tipo de propiedad, precio, recámaras, baños, estacionamientos, metros cuadrados,
    amenidades, colonia y búsqueda por texto; con ordenamiento (destacados primero, por
    precio o más recientes) y resultados por páginas.
  - **Mapa:** permite buscar propiedades en la zona visible, mostrando solo la información
    indispensable para que cargue rápido.
  - **Ficha de propiedad** con sus imágenes y amenidades.
  - Cambio del estado comercial de cada propiedad (disponible, apartado, vendido, etc.).

## Material disponible para revisión
- Puede verse una demostración en vivo sobre datos de muestra: el listado ordenado, la
  búsqueda de propiedades por zona en el mapa y los filtros funcionando.
- Todo lo anterior está respaldado por revisiones automáticas que confirman que cada pieza
  funciona (ver detalle al final).

## Decisiones
- Para buscar y ordenar por precio, el sistema convierte internamente todo a pesos
  mexicanos; en pantalla, sin embargo, siempre se muestra el precio en su moneda original
  —pesos o dólares—, tal como lo capturó el cliente.
- Al público solo se le muestran las propiedades disponibles y apartadas, no las vendidas
  ni las que están en preparación.

## Pendientes y riesgos
- Sin pendientes nuevos. El diseño del portal sigue a la espera de la firma del cliente para
  poder construir el sitio público definitivo. Las observaciones pendientes son sobre todo
  de carácter estético —ajustes de imagen y presentación—; la estructura del portal ya está
  definida.

## Estado de avance
El motor interno del portal se construye por bloques y avanza conforme a lo planeado. De los
seis bloques que componen esta etapa ya están terminados los dos primeros —el acceso seguro
de operadores y el catálogo de propiedades (crear, publicar, buscar y mostrar)—, lo que
sitúa la etapa en torno a una tercera parte de su alcance. En la práctica, esto significa
que la base sobre la que se apoyará todo el portal, seguridad y manejo de propiedades, ya
está operando.

## Próximos pasos
- **Gestión de imágenes:** subir fotos de las propiedades y optimizarlas para que carguen
  rápido.
- **Captación de prospectos:** recibir los contactos interesados y enviar avisos automáticos
  a otros sistemas (webhooks).

---

### Detalle técnico (referencia)
- **Autenticación (A.1):** login de operadores con contraseñas cifradas (argon2), **sesión
  segura** con token de acceso corto (15 min) y **token de refresco rotativo** (7 días,
  revocable). Control de **roles** (administrador / editor), protección contra fuerza bruta
  y endurecimiento de seguridad (helmet, CORS, etc.).
- **Propiedades (A.2):**
  - Alta, edición y **borrado suave** (nada se elimina de verdad).
  - **Publicación**: valida ubicación y datos, genera la **URL amigable (slug) permanente**
    y dispara el evento `property.published`.
  - **Buscador** público con filtros combinados (operación, tipo, precio,
    recámaras/baños/estacionamientos, m², amenidades, colonia, **texto**), orden
    (destacados primero / precio / recientes) y paginación.
  - **Mapa**: búsqueda geográfica por área visible (bbox) con datos ligeros.
  - **Ficha** de propiedad con imágenes y amenidades.
  - Cambio de **estatus comercial** (disponible/apartado/vendido/…).
- Evidencia: **17 pruebas automáticas** en verde (auth + propiedades), incluyendo rotación
  de sesión y todo el ciclo crear→publicar→buscar→mapa→borrar; demo en vivo contra los datos
  de muestra (listado ordenado, mapa por zona, filtros).
- Decisiones/desviaciones: el precio se **normaliza a MXN** internamente para
  filtrar/ordenar, pero **siempre se muestra en la moneda original** (MXN/USD); solo se
  listan al público las propiedades `disponible` y `apartado`.
- Estado: Fase A **~35%** (A.1 + A.2 de 6 bloques). Diseño sigue pendiente de firma para
  Fase B.
- Siguiente: gestión de imágenes (subida + optimización) y captación de leads + webhooks.
