# Reporte semanal — Semana 02

**Etapa del proyecto:** Datos definitivos y diseño del portal (Fase 1) · **Corte:** 19 de junio de 2026

## Resumen
Durante la semana quedó cerrada la forma en que el portal almacenará y relacionará su
información, y avanzó el diseño visual del sitio: el equipo revisó la maqueta navegable y
sus comentarios ya fueron incorporados. La base de datos del proyecto entró en su etapa
final y la imagen del portal quedó a la espera de la aprobación formal del cliente.

## Demo del portal para revisión
La maqueta navegable del portal está publicada y se abre desde cualquier navegador o
teléfono, sin necesidad de instalar nada:

**https://tar-mvp.netlify.app/**

Es una maqueta funcional —con propiedades de ejemplo, todavía no las reales— que permite
visualizar la apariencia y el comportamiento del sitio (colores, tipografía, organización
de las páginas, fichas de propiedad y mapa) antes de construir la versión definitiva.

La maqueta es **totalmente adaptable a cualquier dispositivo** (responsive): se ve y funciona
de forma óptima en celular, tableta y computadora —el menú, los listados, el mapa, las fichas
y el panel de administración se reacomodan según el tamaño de la pantalla—, de modo que el
equipo puede revisarla cómodamente desde donde sea y tener un panorama completo de cómo lucirá
en cada caso.

El equipo revisó la maqueta y envió observaciones que ya fueron incorporadas; la versión
publicada las refleja. Entre los ajustes aplicados:
- **Página de inicio:** se retiró el sello de "60 años" y la tarjeta destacada; ahora se
  muestra un mapa real en lugar de un dibujo, y las preguntas frecuentes tienen una
  animación suave al abrirse.
- Se quitó WhatsApp del sitio público y se ocultó el botón de "Guardar/favoritos", que se
  reactivará cuando existan cuentas de usuario para el público.
- La sección "Nosotros" se rediseñó con foto real y los valores de la empresa.
- **Panel de administración:** la sección "Brokers" pasó a llamarse "Usuarios"; ahora una
  propiedad se da de alta escribiendo su dirección y ubicándola en el mapa, sin teclear
  coordenadas; se explicaron los filtros y los avisos automáticos a otros sistemas
  (webhooks); se retiraron los emojis y el acceso al panel quedó oculto.
- **Seguimiento de prospectos funcional:** se muestra el recorrido del interesado por
  etapas (Nuevo → Cita agendada → Cita concretada → Apartado → Firma de contrato), con
  avisos automáticos que se sincronizan en ambos sentidos con otros sistemas.
- Mejoras de uso propias de un portal inmobiliario: contador de fotos, ruta de navegación
  tipo "miga de pan" (breadcrumbs), precio por metro cuadrado y un botón de "Buscar en
  esta área" para encontrar propiedades en la zona visible del mapa.

Conviene precisar que las observaciones pendientes son sobre todo de carácter **estético**
—ajustes de imagen y presentación—; la estructura y el funcionamiento del portal ya están
definidos. Quedamos a la espera de una nueva ronda de comentarios para cerrar y aprobar el
diseño.

## Avances de la semana
- **Reglas que cuidan la calidad de los datos.** Se definieron, de forma única y compartida
  por todo el sistema, las reglas que verifican que cada dato entre correcto y completo
  —propiedades, filtros, prospectos y avisos a otros sistemas—, evitando errores e
  información mal capturada desde el origen.
- **Mapa de la información del portal.** Quedó dibujado y documentado cómo se relacionan
  los datos entre sí (propiedades, usuarios, prospectos, precios y ubicaciones), de modo
  que cualquiera pueda entender la estructura del portal.
- **Color de marca definitivo.** El diseño quedó con el rojo de marca tomado del logo, para
  que la imagen del portal sea fiel a la identidad de TAR.
- **Información real del cliente resguardada.** Se recibieron y se guardaron de forma segura
  los datos reales del inventario (105 propiedades) y el aviso de privacidad, listos para
  cargarse cuando corresponda.

## Material disponible para revisión
- La maqueta puede abrirla cualquier persona en https://tar-mvp.netlify.app/, sin usuario
  ni instalación, y recorrer todos los ajustes aplicados.
- En el plano técnico, la estructura de datos quedó verificada con consultas de mapa y de
  búsqueda por texto funcionando (ver detalle al final).

## Decisiones
- El tipo de usuario administrativo que antes se llamaba "broker" ahora se llama "editor",
  para mayor claridad.
- El seguimiento de prospectos quedó definido en cinco etapas, más un estado de
  "descartado", alineadas al proceso del negocio.
- Sin WhatsApp en el sitio público; el botón de "Guardar" se deja para una fase futura,
  cuando existan cuentas de usuario.
- El acceso al panel de administración vivirá en una dirección web aparte y protegida con
  usuario y contraseña.

## Pendientes y riesgos
- **Firma del diseño.** Falta el visto bueno del cliente sobre la maqueta, con hasta tres
  rondas de comentarios previstas. Es requisito para construir el sitio público definitivo,
  pero no frena el avance del motor de datos ni del panel interno.

## Estado de avance
La parte técnica de esta etapa quedó concluida: la forma en que el portal guardará y
relacionará la información, junto con las reglas que verifican que los datos entren
correctos, está terminada. Es la base que permite empezar a construir las funcionalidades
sobre datos confiables. El diseño del portal está revisado y pendiente de firma: la maqueta
se encuentra en línea con los ajustes del equipo aplicados, a falta de la aprobación formal
para dar por cerrada la imagen del portal y construir sobre ella la versión definitiva.

## Próximos pasos
- Construir el motor que conecta los datos con las pantallas, comenzando por el inicio de
  sesión de los operadores y el catálogo de propiedades.

---

### Detalle técnico (referencia)
- **Validaciones compartidas (Zod)** para toda entrada de la API (propiedades, filtros,
  leads, webhooks, etc.) — una sola fuente de verdad para API y Web.
- **Borrador de ERD** (`docs/ERD.md`) + volcado del esquema (`docs/schema.sql`).
- **Prototipo v3 integrado** en `design-reference/` con el **rojo de marca definitivo
  `#D2103E`** tomado del logo. Navegable en local (`pnpm prototipo`) y preparado para
  publicarse al cliente (GitHub Pages / Netlify; zip listo).
- **Ronda de revisión con el cliente aplicada al prototipo** (varios ajustes):
  - Home: se quitó el badge "60 años" y la tarjeta destacada; **mapa real** en vez de un
    dibujo; preguntas frecuentes con animación suave.
  - Se quitó WhatsApp del sitio público; "Guardar/favoritos" se ocultó (se reactiva cuando
    existan cuentas de usuario público).
  - "Nosotros" con foto real y valores rediseñados.
  - **Panel admin**: "Brokers" → **"Usuarios"**; alta de propiedad **por dirección con
    geolocalización** (sin capturar coordenadas); filtros e **integraciones (webhooks)
    explicadas**; sin emojis; acceso al panel oculto.
  - **CRM funcional** con el pipeline del negocio (Nuevo · Cita agendada · Cita concretada ·
    Apartado · Firma de contrato) y **webhooks bidireccionales** en vivo.
  - Mejoras UX de portal inmobiliario: contador de fotos, breadcrumbs, precio por m²,
    "Buscar en esta área" en el mapa.
- **Datos reales del cliente resguardados** en `data/` (gitignored): CSV de inventario
  (105 propiedades), aviso de privacidad, etc.
- Evidencia: prototipo navegable (`pnpm prototipo` → http://localhost:4173) con todos los
  cambios; esquema migrado + seed; consultas geográficas y de texto verificadas.
- Decisiones/desviaciones acordadas con el cliente: rol `broker` → `editor`; pipeline de
  leads redefinido (5 etapas + descartado); sin WhatsApp en el público; "Guardar" diferido;
  acceso al panel por subdominio aparte detrás de login (en prod).
- Estado: Fase 1 (parte técnica) 100%; diseño revisado, pendiente de firma. La firma del
  prototipo v3 (hasta 3 rondas) es prerequisito de la Fase B (frontend público); no bloquea
  backend ni backoffice.
