# Puesta en marcha — qué se puede operar hoy y cómo

Guía práctica: **qué está listo, cómo encenderlo, con qué links, y qué falta**.

---

## 1. Requisitos (una sola vez)
- **Node 20** (vía nvm; el repo trae `.nvmrc`), **pnpm 9.15.9** (`corepack`), **Docker**.
- Copiar variables de entorno: `cp .env.example .env` (los valores de dev ya sirven).
- Instalar dependencias: `pnpm install`.

> **Windows + WSL2:** si `localhost` no responde desde el navegador de Windows, usa la
> **IP de WSL** (`hostname -I`, ~`172.28.x.x`) en lugar de `localhost`, o activa el modo
> de red *mirrored* (`.wslconfig` → `networkingMode=mirrored` + `wsl --shutdown`).

## 2. Encender el entorno
```bash
pnpm db:up        # 1) Base de datos (Postgres+PostGIS en Docker)
pnpm db:migrate   # 2) Crear el esquema  (una vez, o tras cambios)
pnpm db:seed      # 3) Datos de muestra + admin
pnpm dev          # 4) API (http://localhost:4000) + Web (http://localhost:3000)
```
Usuario de prueba del panel: **`admin@tarinternacional.com` / `admin123`**.

## 3. Qué puedes hacer HOY (y el link/cómo)

| Quiero… | Cómo | Link |
|---|---|---|
| **Ver la documentación de la API** e incluso probarla | `pnpm dev` | http://localhost:4000/**docs** (Swagger) |
| **Verificar que TODO el backend funciona** (checklist) | `pnpm smoke` | (consola) |
| **Correr las pruebas automáticas** (44) | `pnpm test` | (consola) |
| **Ver la base de datos** en el navegador | `pnpm db:web` | http://`<IP-WSL>`:**8081** (pgweb) |
| **Ver la BD** con otra herramienta (DBeaver/pgAdmin) | host `<IP-WSL>`, 5432, `tar`/`tar`, db `tar_portal` | — |
| **Probar endpoints a mano** | abrir `apps/api/requests.http` con la extensión *REST Client* de VS Code | — |
| **Ver el prototipo de diseño** (lo que verá el cliente) | `pnpm prototipo` | http://localhost:**4173** |
| **Probar el importador** del inventario real (sin escribir) | `pnpm import:inventario data/inventario/INVENTARIO_DE_PROPIEDADES.csv --dry-run` | (consola) |
| **Exportar la especificación OpenAPI** | `pnpm openapi` | genera `docs/openapi.json` |

### La API en sí (base `http://localhost:4000/api/v1`)
- **Auth:** `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`.
- **Propiedades:** `GET /properties` (filtros+orden+paginación), `GET /properties/map`
  (por área), `GET /properties/{slug}` (ficha); y protegidas: crear/editar/publicar/
  cambiar estatus/borrar.
- **Imágenes:** `POST/PATCH/DELETE /properties/{id}/images`.
- **Leads:** `POST /leads` (público), `GET/PATCH /leads` (panel), `POST /events/track`.
- **Webhooks:** suscripciones, bitácora, llaves de API, y `POST /webhooks/inbound`.
- **Detalle completo y “probar” cada uno:** **`/docs`**.

## 4. Qué se puede / qué NO (todavía)

### ✅ Se puede hacer hoy
- Operar **toda la API** (auth, propiedades, media, leads, CRM, webhooks, importador).
- **Migrar el inventario** real desde EasyBroker (parseo probado con 105 propiedades).
- **Documentación interactiva** y verificación end-to-end.
- Mostrar el **prototipo** de diseño navegable.

### ⏳ Aún no (en construcción)
- **Backoffice (panel admin) visual** — en curso (Fase C). La API que consume ya existe.
- **Sitio público (frontend)** — **bloqueado hasta que el cliente firme el diseño**
  (Fase B).

### 🔑 Depende de insumos del cliente
- **Firma del prototipo v3** → desbloquea la Fase B.
- **API key de Google Maps** → mapa real en el público y **geocoding** del importador
  (sin ella, las propiedades importadas quedan en *borrador* para ubicar a mano).
- **Cuenta SendGrid** → envío real de emails de leads (sin ella, no falla; solo no envía).
- **Dominio definitivo**, **servidor Ubuntu** y **Cloudflare R2** (respaldos) → para el
  **Lanzamiento**.

## 5. Apagar / limpiar
```bash
pnpm db:web:down   # apaga el visor de BD
pnpm db:down       # apaga la base de datos (los datos persisten en el volumen)
```

## 6. Glosario y significados
¿No sabes qué es un “slug”, un “webhook”, “PostGIS”, los estatus o el pipeline de leads?
→ **[GLOSARIO.md](GLOSARIO.md)**. ¿Cómo está armado todo? → **[ARQUITECTURA.md](ARQUITECTURA.md)**.

## 7. Notas de producción (resumen; detalle en Lanzamiento)
- En el VPS **no** se exponen los puertos de Postgres ni de la API: solo **Caddy**
  (80/443) es público (TLS automático). La media la sirve Caddy desde el disco.
- Migración al VPS = clonar repo + `.env` de prod + desplegar. La guía completa de
  despliegue (`README-DEPLOY.md`) se entrega en la Fase Lanzamiento.
