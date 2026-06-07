# design-reference/

Referencia de diseño obligatoria del frontend (PRD §7.0). Replica este look con
**Tailwind** en la Fase B — NO copies sus estilos inline, su Leaflet ni sus CDNs;
el mapa real es **Google Maps** con marcadores *price-pill* (CLAUDE.md → Diseño).

## `prototipo-v3/` — prototipo v3 (handoff de Claude Design)

SPA React servida por CDN (React + Babel standalone + Leaflet). Páginas:
`Home · Listings · Map · Detail · Nosotros · Privacidad · Admin` (+ Header, Modal).

- `index.html` — prototipo v3 (era `TAR Internacional v3.html`).
- `print.html` — variante para impresión.
- `tar-data.jsx` — datos de muestra (referencia imágenes de `assets.easybroker.com`).
- `v3-ui.jsx · v3-pages.jsx · v3-content.jsx · v3-admin.jsx` — componentes.
- `assets/tar-logo.svg` — logo de marca.

### Cambios aplicados sobre el handoff original
- **Rojo de marca → `#D2103E`** (+ hover `#A80D32`), tomado del logo (`tar-logo.svg`
  contiene exactamente `#D2103E`). Sustituye el `#C41930`/`#A01428` del prototipo,
  tal como exige CLAUDE.md / PLAN Fase 1.

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
