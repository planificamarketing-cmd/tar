# TAR Internacional — Portal inmobiliario

Monorepo del portal inmobiliario de **TAR Internacional**: motor (API), panel de
administración (backoffice) y sitio público. Stack **PERN + Next.js 14** (PostgreSQL +
PostGIS · Node 20 · Express 5 · React 18), monorepo **pnpm + Turborepo**.

> Para una guía detallada de qué se puede operar hoy, los links y qué falta, ver
> **[`docs/PUESTA-EN-MARCHA.md`](docs/PUESTA-EN-MARCHA.md)**. Índice de documentación en
> **[`docs/README.md`](docs/README.md)**.

## Requisitos (una sola vez)
- **Node 20** (el repo trae `.nvmrc`; recomendado vía [nvm](https://github.com/nvm-sh/nvm))
- **pnpm 9.15.9** (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- **Docker** (la base de datos corre en contenedor; misma imagen que producción)

## Arranque en otra PC (clonar y correr)
```bash
git clone https://github.com/planificamarketing-cmd/tar.git
cd tar
cp .env.example .env      # los valores de desarrollo ya sirven tal cual
pnpm install              # instala todo el workspace
pnpm db:up                # 1) Base de datos (Postgres + PostGIS en Docker)
pnpm db:migrate           # 2) Crea el esquema
pnpm db:seed              # 3) Datos de muestra + usuario administrador
pnpm dev                  # 4) API (:4000) + Web (:3000) en paralelo
```

| Servicio | URL |
|---|---|
| **Panel de administración (backoffice)** | http://localhost:3000/admin |
| Sitio web (Next.js) | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Documentación interactiva de la API (Swagger) | http://localhost:4000/docs |

**Usuario de prueba del panel:** `admin@tarinternacional.com` / `admin123`

> **Windows + WSL2:** si `localhost` no responde desde el navegador de Windows, usa la IP
> de WSL (`hostname -I`) o activa el modo de red *mirrored* en `.wslconfig`. Detalle en
> [`docs/PUESTA-EN-MARCHA.md`](docs/PUESTA-EN-MARCHA.md).

## Verificar que funciona
```bash
pnpm smoke      # checklist end-to-end del backend
pnpm test       # pruebas automáticas (Vitest + Supertest)
```

## Apagar
```bash
pnpm db:down    # apaga la base de datos (los datos persisten en el volumen Docker)
```

## Estructura
```
apps/api          Express 5 (modules/ middleware/ lib/ jobs/)
apps/web          Next.js 14 — sitio público + panel /admin
packages/db       Drizzle: schema, migraciones y seed
packages/shared   Esquemas Zod y tipos compartidos
infra/            docker-compose, Caddyfile, scripts
docs/             documentación de entrega (puesta en marcha, arquitectura, manual, openapi)
```

## Estado actual
- ✅ **Motor (API)** completo: auth, propiedades, media, leads/CRM, webhooks, importador.
- ✅ **Panel de administración (backoffice)** completo: catálogo con asistente, CRM por
  etapas, usuarios y roles, integraciones (webhooks + API keys) y scripts de marketing.
- ⏳ **Sitio público** — pendiente de la firma del diseño con el cliente.

Manual del panel para el equipo: [`docs/MANUAL-ADMIN.md`](docs/MANUAL-ADMIN.md).
