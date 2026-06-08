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
tokens, guardas de rol, etc.). Hoy: **22 pruebas**.

```bash
pnpm test
```

## 3. Manual — probar endpoint por endpoint

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
