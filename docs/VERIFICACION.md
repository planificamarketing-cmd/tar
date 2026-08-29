# Cómo verificar que todo funciona

Tres formas, de la más rápida a la más manual. **Todas necesitan la BD arriba.**

```bash
pnpm db:up        # levanta Postgres+PostGIS en Docker (una vez)
pnpm db:migrate   # aplica el esquema (una vez, o tras cambios)
pnpm db:seed      # datos de muestra + admin (admin@tarinternacional.com / admin123)
```

## 1. `pnpm smoke` — checklist end-to-end (recomendado) ✅

Arranca la API en memoria y recorre **todo el flujo** imprimiendo ✓/✗: salud,
login, crear propiedad, subir imagen (WebP), validación al publicar, publicar,
listar/detalle/mapa, cambio de estatus y borrado. Limpia lo que crea.

```bash
pnpm smoke
```

Es la forma más rápida de **ver que lo construido funciona**. Cada fase nueva
añade comprobaciones aquí.

## 2. `pnpm test` — pruebas automáticas (la garantía real)

Pruebas de integración (Vitest + Supertest) que se ejecutan contra la BD real y
cubren los casos felices y los de error (credenciales, validación, rotación de
tokens, guardas de rol, etc.). Hoy: **121 pruebas**.

```bash
pnpm test
```

## 3. `pnpm test:e2e` — el sitio en un navegador real (Playwright)

Abre el sitio en Chromium (escritorio 1440 px y móvil 390 px) y comprueba lo que
**ve un visitante**: portada, listado con filtros, ficha, página de mapa, y los
ajustes pedidos por TAR (tamaño del logotipo, que la ficha **no** publique la calle,
el **círculo de zona** sobre el mapa y las insignias de **Exclusiva**).

```bash
pnpm db:seed        # datos de muestra (las pruebas leen el inventario real de la API)
pnpm test:e2e       # levanta API + web si no están corriendo, y ejecuta las pruebas
```

Las capturas quedan en `apps/web/test-results/capturas/` (fuera del repo). Para verlas
paso a paso: `pnpm --filter web test:e2e:ui`.

> **Requisito del sistema (una sola vez).** El navegador de Playwright necesita tres
> librerías de Ubuntu que no vienen de fábrica en WSL:
>
> ```bash
> sudo apt-get install -y libnss3 libnspr4 libasound2t64
> pnpm --filter web exec playwright install chromium   # descarga el navegador
> ```
>
> Sin ellas el navegador no arranca y falla con `libnspr4.so: cannot open shared
> object file`.

## 4. Manual — probar endpoint por endpoint

Levanta la API y pruébala con el archivo de peticiones o con `curl`:

```bash
pnpm dev          # API en http://localhost:4000  (+ web en :3000)
```

- **Desde el IDE (VS Code):** abre `apps/api/requests.http` con la extensión
  *REST Client* y dale **“Send Request”** a cada petición. El login guarda el
  token y las demás peticiones lo reutilizan solas.
- **Con curl:**
  ```bash
  # login → guarda el token
  TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@tarinternacional.com","password":"admin123"}' \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

  curl -s "http://localhost:4000/api/v1/properties?sort=relevancia&limit=3" | python3 -m json.tool
  curl -s "http://localhost:4000/api/v1/auth/me" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
  ```

> Una imagen subida queda en `apps/api/uploads/` y se sirve en
> `http://localhost:4000/media/...` (en producción la sirve Caddy).

## Importador de inventario (A.5)

Verifica el parseo del CSV real **sin escribir nada**:

```bash
pnpm import:inventario data/inventario/INVENTARIO_DE_PROPIEDADES.csv --dry-run
```

Debe reportar **105 filas · 35 venta / 70 renta** (coincide con el PRD §4.3). Para
una carga real: quita `--dry-run` (geocodifica si hay `GOOGLE_GEOCODING_API_KEY`,
descarga imágenes EB → WebP). Es idempotente por `external_ref`.

## Prototipo visual (diseño)

Independiente del backend:

```bash
pnpm prototipo    # http://localhost:4173
```

## Estado del backend por fase

| Fase | Qué puedes verificar hoy |
|---|---|
| A.1 Auth | login / refresh (rotación) / logout / me · roles |
| A.2 Propiedades | CRUD · publicar (slug, geo) · filtros · mapa bbox · estatus |
| A.3 Media | subir (WebP+thumb) · portada · reordenar · borrar |
| A.4 Leads/Webhooks | crear lead (honeypot/LFPDPPP) · CRUD admin · analítica · **webhooks salientes firmados (pg-boss)** · entrantes (X-API-Key) |
| A.5 Importador | `pnpm import:inventario … --dry-run` (105 props, 35/70) · idempotente |
