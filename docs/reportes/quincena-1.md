# Reporte quincenal — Quincena 1 (Semanas 1–2)

**Fases cubiertas:** Fase 0 (Cimientos) y Fase 1 (Datos + Prototipos) · **Corte:** 19 de junio de 2026

## Resumen ejecutivo
En estas dos primeras semanas quedó lista toda la base sobre la que se construye el portal
y se publicó una maqueta navegable en línea para que el equipo la recorra y opine antes de
construir la versión definitiva. La maqueta está disponible para abrirse desde cualquier
navegador o teléfono, sin necesidad de instalar nada:

https://tar-mvp.netlify.app/

Asimismo quedó definido cómo se guardará toda la información del portal y se acordaron con el
cliente las primeras decisiones sobre su funcionamiento.

## Hitos alcanzados
- **Cimientos técnicos listos y sistema operativo de extremo a extremo.** Quedó montada de
  forma ordenada toda la estructura sobre la que se levanta el portal —el sitio público, el
  panel de administración y la base de datos—, organizada para que el desarrollo avance con
  rapidez y sin retrabajos.
- **Base de datos preparada para el negocio.** Se definió dónde y cómo vivirá cada dato del
  portal —propiedades, usuarios y contactos interesados— contemplando desde el inicio lo que
  el negocio requiere: ubicación en mapa, precios de venta y renta en pesos y dólares, y
  búsqueda en español. Ya está cargada con datos de muestra.
- **Maqueta del portal navegable y lista para validar.** Una primera versión del sitio, con
  los colores y el estilo de marca definitivos, ya recorrible para someterla a aprobación del
  cliente. Es **totalmente adaptable a cualquier dispositivo** (responsive): se ve y funciona
  de forma óptima en celular, tableta y computadora, por lo que puede revisarse cómodamente
  desde cualquier pantalla.
- **Panel de administración de muestra.** El panel ilustra, a manera de demostración, cómo se
  llevará el seguimiento de los prospectos por etapas.

## Avance vs cronograma
El portal se construye por etapas, y el porcentaje refleja qué proporción del total del
proyecto está terminada. Conviene precisar que buena parte de lo avanzado en esta quincena es
obra que el usuario final no ve, pero sin la cual nada se sostiene, de modo que el porcentaje
no resulta evidente a simple vista.

- **% global aprox.:** ~25%.
- **Estado:** adelantado. Los cimientos del proyecto y la parte técnica de esta etapa quedaron
  completos antes de lo previsto.

## Demostraciones disponibles
- **Maqueta en línea del portal:** https://tar-mvp.netlify.app/ — se abre sin instalación ni
  usuario, desde cualquier navegador o teléfono. Permite apreciar cómo lucirá el sitio
  —colores, tipografías, distribución de las páginas, fichas de propiedad y mapa— antes de
  construir la versión definitiva, e incorpora ya los ajustes que solicitó el equipo.
- **Base de datos con datos de muestra:** disponible para mostrar cómo queda organizada la
  información del portal.

## Decisiones acordadas con el cliente
- El rol que antes se denominaba "broker" se renombró a "editor".
- El seguimiento de prospectos se llevará en cinco etapas.
- Por ahora no se incluye WhatsApp.
- El panel de administración estará en una dirección web oculta, no visible al público.
- El alta de una propiedad se hará escribiendo la dirección, y el sistema la ubicará en el
  mapa de forma automática.

## Riesgos y dependencias
- **Aprobación de la maqueta de diseño, pendiente.** Se requiere la siguiente ronda de
  comentarios, o el visto bueno del equipo sobre la versión en línea, para dar por cerrada la
  imagen del portal. Mientras no se apruebe, no avanza la construcción del sitio público
  definitivo. Conviene precisar que las observaciones pendientes son sobre todo de carácter
  estético —ajustes de imagen y presentación—; la estructura y el funcionamiento del portal ya
  están definidos.
- Más adelante harán falta algunos accesos de terceros —el mapa de Google y el servicio de
  envío de correos—, aún no necesarios en esta etapa.

## Plan de la siguiente quincena
- Construir el motor que conecta los datos con las pantallas —el componente que en la jerga
  técnica se denomina "backend"—: el inicio de sesión seguro de los operadores, la gestión de
  propiedades y sus fotos, la captación de prospectos y los avisos automáticos a otros
  sistemas.

---

### Detalle técnico (referencia)
Para quien desee el detalle de ingeniería de esta quincena:
- Monorepo pnpm + Turborepo (`apps/api`, `apps/web`, `packages/db`, `packages/shared`),
  TypeScript estricto, ESLint + Prettier, Node 20.
- Base de datos en Docker con la **misma imagen que producción** (`postgis/postgis:16-3.4`)
  → paridad dev/prod.
- Esqueleto de API en Express 5 y web en Next.js 14 + Tailwind con los colores de marca.
- CI (GitHub Actions): en cada cambio corre lint → typecheck → build.
- Modelo de datos definitivo: **14 tablas** con PostGIS (geolocalización), precios duales
  (venta/renta, MXN/USD) y búsqueda de texto en español. Migración aplicada y datos de
  muestra (seed).
- Proyecto operativo en local end-to-end (`pnpm dev`).
- Demostraciones: prototipo navegable (`pnpm prototipo`); base de datos con datos de
  muestra (`pnpm db:web`).
- La demo en línea corresponde al **prototipo de diseño v3** publicado en Netlify, con la
  ronda de correcciones del equipo aplicada; navegable y listo para firma del cliente.
- Decisiones de producto acordadas: `broker` → `editor`; pipeline de leads de 5 etapas;
  sin WhatsApp; panel por subdominio oculto; alta de propiedad por dirección
  (geolocalización).
- Dependencias para fases siguientes: API keys de Google y SendGrid.
