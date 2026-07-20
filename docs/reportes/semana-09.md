# Reporte semanal — Semana 09

**Fase del cronograma:** Fase B — Frontend público · **Corte:** 2026-07-19

## Objetivo de la semana
Con el **diseño aprobado por el cliente**, iniciar y entregar el núcleo del sitio público (§7.1): inicio, catálogo, ficha de propiedad con formulario de contacto, páginas de empresa y SEO, fiel al prototipo v3.

## Entregables / lo realizado
- **Inicio (`/`)**: portada con buscador (venta/renta, tipo, precio, ubicación con autocompletado, recámaras), franja de cifras, **propiedades destacadas**, exploración por categoría, **catálogo reciente** y preguntas frecuentes.
- **Catálogo (`/propiedades`)**: filtros por operación, tipo, precio, recámaras y búsqueda por ubicación; ordenamiento; vista de **cuadrícula o lista**; paginación. Los filtros viven en la dirección web (se pueden compartir y los buscadores los indexan).
- **Ficha de propiedad (`/propiedades/…`)**: galería de fotos y **videos**, precio y características, descripción, amenidades, datos (incluye m² de oficina y áreas exteriores), propiedades similares y **formulario de contacto** con **aceptación del Aviso de Privacidad (LFPDPPP)**.
- **Empresa**: **Nosotros**, **Contacto** y **Aviso de Privacidad**.
- **Posicionamiento (SEO)**: títulos y descripciones por página, tarjetas para redes (Open Graph), datos estructurados de inmueble, **mapa del sitio** y **robots** automáticos, y página de "no encontrado" propia.
- **Inyección de scripts de marketing**: el sitio ya carga automáticamente los códigos (analítica, píxeles) que se administran desde el panel, en su ubicación correspondiente.

## Evidencia de que funciona
- Probado en vivo contra la API: portada, catálogo (los filtros cambian el número de resultados: 11 → venta+departamento 1, "polanco" 1, renta 6), ficha (200) y "no encontrado" (404).
- **Formulario de contacto**: envío válido genera el prospecto (lead) correctamente; los envíos de bots (trampa anti-spam) se rechazan.
- Calidad: **111 pruebas automatizadas del backend en verde**, documentación de API en 48 rutas, y **compilación de producción del sitio correcta** (18 páginas).

## Decisiones / desviaciones
- **Sin mapa interactivo** (decisión del cliente): no se integra Google Maps. La ubicación se resuelve con **autocompletado de dirección**. Es un ajuste respecto al §7.1; el resto de la experiencia se mantiene.
- El formulario público entra como **contacto**; el asesor agenda la cita después (decisión previa del cliente).

## Riesgos / bloqueos / pendientes del cliente
- **Datos reales de contacto** (teléfono, correo, dirección) para el pie de página, la página de contacto y el aviso de privacidad; hoy figuran los del prototipo. Texto oficial del aviso de privacidad.
- **Publicar el inventario real**: las 105 propiedades importadas están en borrador; aparecerán en el sitio al completarse su ubicación.
- Dominio definitivo y cuenta de correo (SendGrid) para las notificaciones de prospectos.

## Métricas
- Fase B: núcleo entregado (~90% del avance global del proyecto).
- 111 pruebas backend en verde · OpenAPI 48 rutas · build del sitio 18 rutas.

## Lo que sigue
- Revisión del sitio con el cliente y captura de datos reales.
- FASE QA: medición de rendimiento (Lighthouse) en un ambiente de staging sobre el servidor del cliente, pruebas E2E y afinación.
