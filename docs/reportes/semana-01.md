# Reporte semanal — Semana 01

**Etapa:** Cimientos y arranque del proyecto · **Corte:** 12 de junio de 2026

## Resumen
Durante la primera semana se dejó instalada toda la base sobre la que se construye el
portal y se publicó una primera versión navegable del sitio para revisión del equipo.
El proyecto avanza conforme a lo planeado: la infraestructura técnica quedó concluida y
el modelo de información entró en su etapa final.

## Demo del portal para revisión
Ya está disponible en línea una primera versión navegable del portal, accesible desde
cualquier navegador o teléfono y sin necesidad de instalar nada:

**https://tar-mvp.netlify.app/**

Es una maqueta funcional —con propiedades de ejemplo, todavía no las reales— que permite
visualizar la apariencia y el comportamiento del sitio (colores, tipografía, organización
de las páginas, fichas de propiedad y mapa) antes de desarrollar la versión definitiva. La
intención es validar la imagen del portal en una etapa en la que los ajustes son rápidos y
de bajo costo.

La maqueta es **totalmente adaptable a cualquier dispositivo** (responsive): se ve y funciona
de forma óptima en celular, tableta y computadora —el menú, los listados, el mapa, las fichas
y el panel de administración se reacomodan según el tamaño de la pantalla—. Así el equipo puede
revisarla cómodamente desde donde sea y tener un panorama completo de cómo lucirá en cada caso.

A partir de una primera maqueta, el equipo envió comentarios que ya fueron incorporados; la
versión publicada los refleja. Quedamos a la espera de una nueva ronda de observaciones para
cerrar y aprobar el diseño. Conviene precisar que las observaciones pendientes son sobre todo
de carácter **estético** —ajustes de imagen y presentación—; la estructura y el funcionamiento
del portal ya están definidos.

## Avances de la semana
- **Infraestructura del proyecto.** Se montó la estructura completa sobre la que se desarrolla
  el portal —sitio público, panel de administración y base de datos—, organizada para avanzar
  con rapidez y sin retrabajos. No es algo visible para el usuario final, pero es la base que
  sostiene todo lo demás.
- **Base de datos.** Se definió la forma en que el portal almacenará y relacionará su
  información: propiedades, usuarios, contactos interesados, precios y ubicaciones. Contempla
  desde el inicio los requerimientos del negocio: ubicación en mapa, precios de venta y renta en
  pesos y dólares, y búsqueda en español.
- **Entorno idéntico al de producción.** El desarrollo se realiza con la misma configuración que
  tendrá el servidor final, de modo que lo que funciona hoy funcione igual al publicarse, sin
  sorpresas en la entrega.
- **Controles de calidad automáticos.** Cada cambio se somete a revisiones automáticas antes de
  darse por válido, lo que reduce errores y sostiene el ritmo de avance.

## Material disponible para revisión
- La demo del portal puede abrirla cualquier persona en https://tar-mvp.netlify.app/, sin usuario
  ni instalación.
- En el plano técnico, el sistema base ya arranca por completo y opera con datos de muestra (ver
  detalle al final).

## Decisiones
- Mantener el entorno de desarrollo como espejo del servidor de producción, para que la puesta en
  marcha sea directa y sin imprevistos.
- Tratar la versión publicada como maqueta de diseño para validación —no como sitio final—:
  primero se aprueba la apariencia con el equipo y después se construye sobre ella.

## Pendientes y riesgos
- **Aprobación del diseño.** Se requiere la siguiente ronda de comentarios, o el visto bueno del
  equipo sobre la maqueta, para dar por cerrada la imagen del portal. Mientras no se apruebe, no
  inicia la construcción del sitio público definitivo.
- Más adelante se necesitarán algunos accesos de terceros (mapa de Google y servicio de envío de
  correos), aún no requeridos en esta etapa.

## Estado de avance
- **Infraestructura del proyecto: concluida.** Toda la base técnica del portal está terminada.
- **Modelo de información: en etapa final.** Ya está definido dónde y cómo vivirá cada dato; resta
  afinar las reglas que garantizan que la información se capture completa y correcta. Se concluye
  la próxima semana.
- **Maqueta de diseño: publicada,** con los ajustes del equipo aplicados y a la espera de
  aprobación.

## Próximos pasos
- Recoger la siguiente ronda de comentarios sobre la maqueta y dejar el diseño aprobado.
- Concluir el modelo de información y sus validaciones para comenzar a cargar y mostrar datos
  reales.

---

### Detalle técnico (referencia)
- Monorepo pnpm + Turborepo (`apps/api`, `apps/web`, `packages/db`, `packages/shared`),
  TypeScript estricto, ESLint + Prettier, Node 20.
- Base de datos en Docker con la **misma imagen que producción** (`postgis/postgis:16-3.4`) →
  paridad dev/prod.
- API en Express 5: configuración por variables de entorno validadas, logger, manejo de errores
  central y endpoint de salud `/health`.
- Web en Next.js 14 + Tailwind con los colores de marca.
- CI (GitHub Actions): en cada cambio corre lint → typecheck → build.
- Modelo de datos completo (14 tablas) con PostGIS, precios duales (venta/renta, MXN/USD) y
  búsqueda de texto en español. Migración aplicada y datos de muestra (seed).
- Evidencia: `pnpm dev` levanta API + Web; `GET /health` responde conectado a PostGIS;
  `pnpm db:migrate` + `pnpm db:seed` corren limpio (10 propiedades de muestra).
- La demo en línea corresponde al **prototipo de diseño v3** publicado en Netlify
  (`tar-prototipo-v3.zip`), con la ronda de correcciones del equipo aplicada.
