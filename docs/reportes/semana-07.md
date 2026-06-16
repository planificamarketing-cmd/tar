# Reporte semanal — Semana 07

**Etapa:** Panel de administración, donde el equipo de TAR gestiona todo · **Corte:** 24 de julio de 2026

## Resumen
Durante la semana se construyeron los cimientos del panel de administración —el espacio
privado desde donde el equipo de TAR gestionará el portal—: acceso seguro, un tablero con
indicadores en vivo, el seguimiento de prospectos y el catálogo de propiedades con su
asistente para darlas de alta. El avance global del proyecto se acerca a las tres cuartas
partes del camino hacia el portal terminado y publicado.

## Avances de la semana
- **Entrada segura al panel.** Una pantalla de acceso con contraseña cuya sesión se
  renueva sola mientras se trabaja y que impide entrar a quien no haya iniciado sesión. El
  menú y los colores siguen fielmente el diseño aprobado para el panel.
- **Tablero con indicadores en vivo.** Una pantalla de inicio con cifras reales del
  negocio: propiedades publicadas y en preparación (borradores), contactos interesados del
  mes, cuántos están en seguimiento y cuántos cerraron; más gráficas de contactos por mes,
  mezcla del inventario y estado de las propiedades.
- **Seguimiento de prospectos por etapas.** Un tablero para gestionar a los interesados
  (prospectos o *leads*): se filtran por etapa y se buscan; cada uno tiene su ficha con el
  mensaje que dejó y una bitácora (historial). Se puede mover de etapa en vivo (Nuevo →
  Cita → Apartado → Firma); cada cambio queda registrado y, si corresponde, avisa
  automáticamente a otros sistemas conectados.
- **Catálogo de propiedades para el equipo.** Un listado interno que muestra todas las
  propiedades, incluidas las que aún no se publican y el público no ve. Permite filtrar
  por estatus, buscar y hacer acciones rápidas: publicar, cambiar estatus o archivar
  (guardar sin borrar).
- **Asistente para dar de alta una propiedad.** Un proceso paso a paso —datos → ubicación
  en el mapa → fotos → amenidades → publicar—. Las fotos se suben en lote arrastrando y
  soltando, y el sistema las optimiza por sí mismo para que carguen rápido. Incluye marcar
  el estatus comercial y destacar una propiedad como Premium o Destacada.
- **Cifras exactas en el tablero.** Los conteos del tablero (borradores, rentadas,
  vendidas) reflejan ahora números exactos del inventario, no una estimación.

## Material disponible para revisión
- Se puede recorrer el flujo completo de una propiedad: crear un borrador, intentar
  publicarlo sin ubicación (el sistema lo impide a propósito), fijar la ubicación y
  publicarlo, y finalmente archivarlo.
- Las 56 comprobaciones automáticas del portal pasan todas (12 más que la semana
  anterior), y las revisiones automáticas de calidad del panel quedan en verde.

## Decisiones
- **Ubicación en el mapa, de forma provisional.** Mientras el cliente entrega la llave de
  acceso de Google Maps (la credencial que conecta el portal con el mapa de Google de
  forma segura), el asistente permite fijar la ubicación con coordenadas o pegando un
  enlace de Google Maps. Cuando llegue la llave, esto se cambiará por un mapa donde se
  ubica la propiedad arrastrando un marcador, sin alterar el proceso.

## Pendientes y riesgos
- **Aprobación del diseño (prototipo v3).** Sigue pendiente y es necesaria para el sitio
  público. Las observaciones que restan son sobre todo de carácter estético —ajustes de
  imagen y presentación—; la estructura y las funciones del portal ya están definidas y
  construidas, por lo que lo que falta del diseño es acabado visual, no rehacer trabajo.
- **Llave de acceso de Google Maps.** Necesaria para el mapa real de ubicación; mientras
  tanto hay una alternativa que ya funciona.

## Estado de avance
El panel de administración avanza alrededor del 60%: ya están construidos los cimientos y
los bloques más usados —acceso, tablero, prospectos y catálogo de propiedades—, y resta
completar la gestión de usuarios, las conexiones con otros sistemas y los códigos de
marketing. El avance global del proyecto se sitúa cerca del 72%, próximo a las tres
cuartas partes del camino total hacia el portal terminado y publicado.

## Próximos pasos
- Cerrar el panel de administración: gestión de usuarios, conexiones con otros sistemas
  (avisos automáticos y llaves de acceso para conectar terceros) y los códigos de medición
  y marketing.

---

### Detalle técnico (referencia)
- **Fundación del panel:** login con sesión que se renueva sola, layout protegido con menú
  lateral fiel al prototipo admin (tipografías y colores de marca) y guard que impide
  entrar sin sesión.
- **Dashboard con datos en vivo:** indicadores (propiedades publicadas y en borrador,
  leads del mes, en seguimiento, cierres) y gráficas (leads por mes, mezcla de inventario,
  estado de propiedades, leads recientes).
- **Gestión de leads (CRM):** tablero con filtro por etapa + buscador, ficha del lead con
  su mensaje y bitácora, y cambio de etapa en vivo (Nuevo → Cita → Apartado → Firma), que
  queda registrado y dispara los webhooks.
- **Catálogo de propiedades:** listado del backoffice que muestra todos los estados
  (incluidos los borradores que el público no ve), con filtros por estatus, búsqueda y
  acciones rápidas (publicar, cambiar estatus, archivar).
- **Asistente de alta/edición de propiedad:** datos → ubicación → imágenes → amenidades →
  publicar. Imágenes subidas en lote (arrastrar y soltar) y optimizadas en el servidor;
  selector de estatus comercial y de destaque (Premium/Destacada).
- **Conteo real por estatus:** el dashboard cuenta borradores/rentados/vendidos con cifras
  exactas, no una muestra.
- **Decisión técnica:** ubicación sin Google Maps todavía; mientras llega la API key del
  cliente, el asistente fija el punto con coordenadas o pegando un enlace de Google Maps.
  Al integrar la llave se cambiará por un mapa con pin arrastrable sin alterar el flujo.
- Evidencia: **56 pruebas automáticas del backend en verde** (+12 entre propiedades y
  usuarios); verificación en vivo del flujo de propiedades (crear borrador → intentar
  publicar sin ubicación, lo impide → fijar ubicación y publicar → archivar);
  `pnpm typecheck`, `pnpm lint` y `pnpm build` del panel en verde.
- Métricas: **Fase C ~60%**; avance global aprox. **~72%**.
