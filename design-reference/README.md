# design-reference/

Referencia de diseño obligatoria del frontend (PRD §7.0). Replica este look con
**Tailwind** en la Fase B — NO copies sus estilos inline, su Leaflet ni sus CDNs;
el mapa real es **Google Maps** con marcadores *price-pill* (la guía del proyecto → Diseño).

## `prototipo-v3/` — prototipo v3 (handoff de diseño)

SPA React servida por CDN (React + Babel standalone + Leaflet). Páginas:
`Home · Listings · Map · Detail · Nosotros · Privacidad · Admin` (+ Header, Modal).

- `index.html` — prototipo v3 (era `TAR Internacional v3.html`).
- `print.html` — variante para impresión.
- `tar-data.jsx` — datos de muestra (referencia imágenes de `assets.easybroker.com`).
- `v3-ui.jsx · v3-pages.jsx · v3-content.jsx · v3-admin.jsx` — componentes.
- `assets/tar-logo.webp` — logo de marca oficial entregado por el cliente (blanco
  sobre transparente; en la UI va sobre una pastilla navy para verse en header claro
  y sobre el hero oscuro). `assets/tar-logo.svg` queda como referencia del color.

### Cambios aplicados sobre el handoff original
- **Rojo de marca → `#D2103E`** (+ hover `#A80D32`), tomado del logo (`tar-logo.svg`
  contiene exactamente `#D2103E`). Sustituye el `#C41930`/`#A01428` del prototipo,
  tal como exige la guía del proyecto / PLAN Fase 1.

#### Ronda 2 de correcciones del cliente
- **Logo oficial**: se reemplazó por el `.webp` entregado por el cliente.
- **Tipografía → familia DM**: `DM Serif Display` (títulos) + `DM Sans` (interfaz) +
  `DM Mono` (cifras). Sustituye Fraunces + Inter.
- **Buscadores con autocompletado**: hero, sidebar de Propiedades y mapa sugieren
  colonias, alcaldías y zonas del inventario; la búsqueda ignora acentos/mayúsculas
  y cubre título, ubicación, colonia, ciudad y zona.
- **Filtro de precio coherente**: las opciones se adaptan a la operación (rentas en
  `$/mes`, ventas en `MDP`); ya no se mezclan umbrales incompatibles.
- **Rentas/ventas en `$/m²`**: las propiedades comerciales que en EasyBroker vienen
  con precio por metro cuadrado se muestran etiquetadas como `$X/m²[/mes]` (estándar
  profesional) en lugar de tratar el valor unitario como total — evita cifras
  irreales (p. ej. el edificio de 12,500 m² que aparentaba `$5M/mes`).

### Verlo / publicarlo
Necesita servirse por HTTP (carga los `.jsx` por `fetch`; `file://` no funciona):

```bash
pnpm prototipo        # sirve en http://localhost:4173 (python3 http.server)
```

Para **publicarlo al cliente** (hosting estático gratuito): es estático, se puede
subir tal cual a Netlify drop / Vercel / GitHub Pages / Cloudflare Pages. Pendiente
de elegir host y cuenta (ver ESTADO.md).

### Tokens de diseño (para portar a `tailwind.config` tras la firma)
| Token | Valor |
|---|---|
| Rojo marca / hover | `#D2103E` / `#A80D32` |
| Navy | `#0F1B2D` |
| Fondo | `#FAFAF8` |
| Texto / muted / borde | `#374151` / `#6B7280` / `#E5E5E4` |
| Premium (degradado) | `#E4C66A` → `#BE8C3C` |
| Tipografías | Fraunces (display) · Inter (UI) · DM Mono (cifras) |

## Estado
⏳ **Pendiente de revisión y firma del cliente** (hasta 3 rondas, §13). No se
construye la Fase B hasta que exista la versión firmada. La Fase A (backend) no
depende de esto.

> El CSV real de inventario, el aviso de privacidad (PDF) y las capturas del diseño
> desplegado están en `data/` (gitignored, fuera del repo por contener PII).
