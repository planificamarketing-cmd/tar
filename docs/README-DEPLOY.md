# Manual de despliegue — Plataforma TAR Internacional

Cómo poner la plataforma en el servidor, actualizarla, respaldarla y
restaurarla. Está escrito para que lo siga una persona con acceso al servidor,
sin tener que leer el código.

> **Antes de empezar** el servidor debe estar preparado siguiendo
> [`SETUP_SERVIDOR_UBUNTU.md`](../SETUP_SERVIDOR_UBUNTU.md) (usuario `deploy`,
> firewall, Docker, zona horaria). Este documento arranca justo después.

---

## 1. Qué se instala

Cuatro piezas dentro de Docker, en un solo servidor:

| Pieza | Qué hace | ¿Visible desde internet? |
|---|---|---|
| `caddy` | Recibe todo el tráfico, pone el candado HTTPS y reparte | **Sí** — puertos 80 y 443 |
| `web` | El sitio público y el panel (Next.js) | No, solo a través de Caddy |
| `api` | La API, el procesado de imágenes y los envíos automáticos | No, solo a través de Caddy |
| `db` | La base de datos PostgreSQL + PostGIS | **No**, nunca |

Todo vive bajo **un solo dominio**. Caddy reparte así:

```
https://tudominio.com/            → sitio público y panel
https://tudominio.com/api/v1/...  → API
https://tudominio.com/media/...   → imágenes (servidas desde el disco)
https://tudominio.com/docs        → documentación interactiva de la API
https://tudominio.com/health      → señal de vida (para monitoreo)
```

`www.tudominio.com` redirige al dominio sin `www`, para tener una sola
dirección canónica (importante para Google).

---

## 2. Instalación inicial

### 2.1 Traer el código

```bash
sudo mkdir -p /opt/tar && sudo chown deploy:deploy /opt/tar
cd /opt/tar
git clone <url-del-repositorio> .
```

### 2.2 Crear la carpeta de imágenes

Las fotos de las propiedades viven en el disco del servidor, fuera de Docker,
para que sobrevivan a cualquier actualización:

```bash
sudo mkdir -p /srv/tar/media
sudo chown -R 1000:1000 /srv/tar/media   # 1000 = usuario 'node' dentro del contenedor
```

### 2.3 Escribir el archivo `.env`

```bash
cp .env.example .env
nano .env
```

**Este archivo nunca se sube al repositorio.** Contiene las contraseñas.

Variables obligatorias (el despliegue se detiene si falta alguna):

| Variable | Ejemplo | Para qué sirve |
|---|---|---|
| `SITE_DOMAIN` | `tarinternacional.com` | Dominio que atenderá Caddy. **Sin** `https://` ni `www` |
| `ACME_EMAIL` | `sistemas@empresa.com` | Correo al que Let's Encrypt avisa si un certificado va a vencer |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `tar` / *(contraseña larga)* / `tar_portal` | Credenciales de la base de datos |
| `DATABASE_URL` | `postgres://tar:CLAVE@db:5432/tar_portal` | ⚠️ El servidor de base de datos se llama **`db`**, no `localhost` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | *(cadenas largas al azar)* | Firman las sesiones del panel |
| `PUBLIC_SITE_URL` | `https://tarinternacional.com` | Enlaces que salen en los avisos automáticos. Sin barra final |
| `PUBLIC_API_URL` | `https://tarinternacional.com/api/v1` | Base pública de la API para los enlaces descargables de los avisos (ficha PDF del prospecto). Vacía = se deriva de `PUBLIC_SITE_URL` |
| `MEDIA_DIR` | `/srv/tar/media` | Ruta **dentro** del contenedor. No cambiar |
| `MEDIA_HOST_DIR` | `/srv/tar/media` | Ruta **en el servidor**. Debe existir (paso 2.2) |
| `MEDIA_BASE_URL` | `https://tarinternacional.com/media` | Dirección pública de las imágenes |
| `CORS_ORIGINS` | `https://tarinternacional.com` | Desde qué dirección se permite usar la API |
| `NEXT_PUBLIC_API_URL` | `/api/v1` | Dirección de la API para el navegador |
| `NEXT_PUBLIC_SITE_URL` | `https://tarinternacional.com` | Dirección del sitio |

Recomendadas:

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_MEDIA_HOSTNAME` | `tarinternacional.com` — permite optimizar las fotos |
| `NEXT_PUBLIC_MAP_TILES_URL` + `NEXT_PUBLIC_MAP_TILES_ATTRIBUTION` | Solo para cambiar de proveedor de mosaicos del mapa. Vacías = CARTO/OpenStreetMap por defecto, que **no requiere llave ni cuenta** |
| `NEXT_PUBLIC_MAP_AREA_RADIUS_M` | Radio en metros del círculo de *zona aproximada* del mapa de la ficha. Vacío = 400 m |
| `SENDGRID_API_KEY` + `LEADS_NOTIFY_TO` | Envío de correos al recibir un prospecto |
| `REVALIDATE_SECRET` | Que los cambios del panel se vean al instante. **Mismo valor** que usa el sitio |
| `GOOGLE_GEOCODING_API_KEY` | Ubicar automáticamente las propiedades al importarlas |
| `USD_MXN_RATE` | Tipo de cambio para ordenar y filtrar precios |

Para generar contraseñas y secretos seguros:

```bash
openssl rand -base64 36
```

### 2.4 Apuntar el dominio

En el panel de DNS del dominio, dos registros **A** hacia la IP del servidor:

```
tarinternacional.com        A    <IP-del-servidor>
www.tarinternacional.com    A    <IP-del-servidor>
```

Hazlo **antes** de desplegar: Caddy pide el certificado HTTPS en el primer
arranque y necesita que el dominio ya resuelva.

### 2.5 Desplegar

```bash
./infra/deploy.sh
```

El script:

1. Comprueba Docker y revisa que el `.env` esté completo y sin errores típicos.
2. Trae la última versión del código (`git pull`).
3. Construye las imágenes del sitio y de la API.
4. Levanta la base de datos y **aplica las migraciones**.
5. Levanta la API, el sitio y Caddy.
6. Comprueba que la API responde y que ve la base de datos.

Termina imprimiendo las direcciones. El certificado HTTPS puede tardar hasta un
minuto en emitirse la primera vez; se sigue con `docker compose logs -f caddy`.

### 2.6 Crear el primer usuario del panel

Una instalación nueva arranca sin usuarios. Para crear el primer administrador:

```bash
cd /opt/tar
docker compose -f infra/docker-compose.prod.yml run --rm \
  -e ADMIN_EMAIL='persona@empresa.com' \
  -e ADMIN_PASSWORD='una-contraseña-larga-y-única' \
  -e ADMIN_NAME='Nombre Apellido' \
  api node dist/create-admin.cjs
```

La contraseña debe tener **al menos 10 caracteres**. El comando se puede repetir
sin problema: si el correo ya existe, actualiza la contraseña y reactiva la
cuenta — sirve también para recuperar el acceso si se pierde.

A partir de ahí, el resto de usuarios se dan de alta desde **Ajustes → Usuarios**
en el panel (`https://tudominio.com/admin`).

> Entra y **cambia la contraseña** si usaste una provisional. Y evita dejarla en
> el historial del shell: puedes anteponer un espacio al comando.

---

## 3. Actualizaciones del día a día

```bash
cd /opt/tar
./infra/deploy.sh
```

Es el mismo comando. Reconstruye siempre las imágenes, porque el dominio y la
proveedor de mosaicos del mapa quedan **incrustados** en el sitio al construirlo: cambiar
esas variables exige reconstruir, no basta reiniciar.

Variantes:

```bash
./infra/deploy.sh --no-pull     # despliega el código que ya está en el servidor
./infra/deploy.sh --rollback    # vuelve a la versión anterior y redespliega
```

Comandos útiles:

```bash
cd /opt/tar
docker compose -f infra/docker-compose.prod.yml ps            # estado
docker compose -f infra/docker-compose.prod.yml logs -f api    # registros de la API
docker compose -f infra/docker-compose.prod.yml logs -f caddy  # certificados, tráfico
docker compose -f infra/docker-compose.prod.yml restart api    # reiniciar una pieza
```

---

## 4. Respaldos

Tres capas independientes (PRD §14):

| Capa | Qué guarda | Dónde | Cada cuándo |
|---|---|---|---|
| 1 — Local | Base de datos + imágenes | `/var/backups/tar`, 30 días | Diario |
| 2 — Fuera del servidor | Lo mismo, copiado | Cloudflare R2 | Diario |
| 3 — Servidor completo | Imagen del disco entero | Panel del proveedor del VPS | Según el plan |

### 4.1 Activar el respaldo diario

```bash
sudo crontab -e
```

Agregar:

```
0 3 * * * /opt/tar/infra/backup/backup.sh >> /var/log/tar-backup.log 2>&1
```

Prueba manual:

```bash
/opt/tar/infra/backup/backup.sh --no-remote   # solo local, para probar
/opt/tar/infra/backup/backup.sh               # completo, incluyendo R2
```

El script **verifica** cada archivo que genera: si un volcado sale corrupto o
sospechosamente pequeño, falla en vez de dar un respaldo inservible por bueno.

### 4.2 Configurar Cloudflare R2 (capa 2)

En el panel de Cloudflare: crear el bucket `tar-respaldos` y un token de API de
R2 con permiso de lectura y escritura. En el servidor:

```bash
sudo apt install -y rclone
rclone config create r2 s3 \
  provider=Cloudflare \
  access_key_id=<ACCESS_KEY> \
  secret_access_key=<SECRET_KEY> \
  endpoint=https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
  acl=private
rclone lsd r2:tar-respaldos    # debe responder sin error
```

En el bucket, activar una **regla de ciclo de vida** de 30–60 días para que las
copias viejas se borren solas.

Si rclone no está configurado, el respaldo local **sí se hace** y el script solo
avisa que omitió la copia externa.

---

## 5. Restauración

```bash
/opt/tar/infra/backup/restore.sh --list          # ver qué hay disponible
/opt/tar/infra/backup/restore.sh --latest        # restaurar el más reciente
/opt/tar/infra/backup/restore.sh --from-r2 --latest   # bajar de R2 y restaurar
```

**Ensayo sin riesgo** (comprueba que los archivos están completos, sin escribir
nada — conviene correrlo de vez en cuando):

```bash
/opt/tar/infra/backup/restore.sh --latest --dry-run
```

La restauración real pide escribir `RESTAURAR` para confirmar, detiene la API
mientras trabaja, **recrea la base desde cero**, carga el volcado, repone las
imágenes (dejando las anteriores en una carpeta `.anterior-<fecha>`) y al final
informa cuántas propiedades y prospectos quedaron.

### 5.1 Pérdida total del servidor (objetivo: menos de 2 horas)

1. Contratar un servidor nuevo y prepararlo con `SETUP_SERVIDOR_UBUNTU.md`.
2. `git clone` del repositorio en `/opt/tar`.
3. Recrear el `.env` (guarda una copia cifrada fuera del servidor) y la carpeta
   `/srv/tar/media` (paso 2.2).
4. `./infra/deploy.sh` → la plataforma sube vacía.
5. `./infra/backup/restore.sh --from-r2 --latest` → vuelven los datos y las fotos.
6. Apuntar el DNS a la nueva IP y esperar el certificado.

> **Haz este simulacro al menos una vez antes del arranque en producción.** Un
> respaldo que nunca se ha restaurado no es un respaldo comprobado.

---

## 6. Ambiente de pruebas (staging)

Sirve para revisar cambios y medir el rendimiento sin tocar producción. Vive en
el mismo servidor, con **su propia base de datos**, bajo `staging.tudominio.com`,
protegido con usuario y contraseña y marcado para que Google no lo indexe.

```bash
# 1. DNS: staging.tudominio.com → misma IP
# 2. Variables propias
cp .env .env.staging && nano .env.staging     # URLs con staging. y BD 'db-staging'
# 3. Levantar
docker compose -f infra/docker-compose.staging.yml --env-file .env.staging up -d --build
# 4. Publicar en Caddy
docker exec tar-caddy caddy hash-password --plaintext 'CONTRASEÑA'
cp infra/caddy-sites/staging.caddy.example infra/caddy-sites/staging.caddy
nano infra/caddy-sites/staging.caddy          # pegar el hash y el dominio real
docker exec tar-caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## 7. Si algo sale mal

| Síntoma | Causa más probable | Qué hacer |
|---|---|---|
| `deploy.sh` dice que faltan variables | El `.env` está incompleto | Compararlo con la tabla del punto 2.3 |
| `DATABASE_URL apunta a localhost` | Se copió el `.env` de desarrollo | Cambiar el servidor a `db` |
| El sitio no carga y no hay candado | El DNS no apunta al servidor todavía | Verificar los registros A; `docker compose logs caddy` |
| "Carpeta de media ausente" | Falta `/srv/tar/media` | Crearla con el paso 2.2 |
| Las fotos no se ven | `MEDIA_BASE_URL` o `NEXT_PUBLIC_MEDIA_HOSTNAME` mal puestos | Corregir y **volver a desplegar** (se reconstruye el sitio) |
| El mapa sale en gris, sin calles | El servidor no alcanza el proveedor de mosaicos | Comprobar la salida a internet del servidor; si hace falta, cambiar `NEXT_PUBLIC_MAP_TILES_URL` a otro proveedor |
| Los cambios del panel tardan en verse | Falta `REVALIDATE_SECRET` o no coincide | Poner el **mismo valor** en la API y en el sitio |
| La API responde pero `"db": false` | La base no arrancó o la contraseña cambió | `docker compose logs db`; revisar `DATABASE_URL` |
| No puedo entrar al panel de una instalación nueva | Todavía no hay usuarios | Crear el administrador con el paso 2.6 |
| Perdí la contraseña del administrador | — | Repetir el paso 2.6 con el mismo correo: la reemplaza |
| Una versión nueva rompió algo | — | `./infra/deploy.sh --rollback` |

Señal de vida para monitoreo externo (UptimeRobot): `https://tudominio.com/health`
debe responder `200` con `"status":"ok"` y `"db":true`.

---

## 8. Notas técnicas

- **Puertos.** Solo Caddy publica puertos (80, 443). La base de datos y la API
  no son alcanzables desde internet ni desde el propio servidor por TCP; viven
  en la red interna de Docker. No agregar `ports:` a esos servicios.
- **Certificados TLS.** Los guarda el volumen `caddy-data`. **No borrarlo**:
  Let's Encrypt limita cuántas veces se puede reemitir un certificado.
- **Migraciones.** Corren en un contenedor aparte que se ejecuta una sola vez y
  termina; la API no arranca hasta que terminan bien. Nunca queda corriendo
  contra una base con el esquema viejo.
- **Compresión.** Caddy comprime con zstd y gzip. El brotli de compresión no
  viene incluido en Caddy; si se quisiera, hay que compilar Caddy con ese
  complemento. zstd cubre a los navegadores modernos con mejor ratio que brotli
  y gzip queda como respaldo universal.
- **Caché.** Las imágenes y los archivos versionados del sitio se sirven con
  caché de un año (sus nombres incluyen un identificador único, así que un
  cambio genera un nombre nuevo).
- **Variables del navegador.** Las que empiezan con `NEXT_PUBLIC_` se incrustan
  al construir el sitio. Cambiarlas obliga a reconstruir; `deploy.sh` siempre
  reconstruye, así que basta con volver a ejecutarlo.

---

## 9. Lista de verificación para el arranque

- [ ] Servidor preparado según `SETUP_SERVIDOR_UBUNTU.md` (firewall, SSH, Docker).
- [ ] DNS de `dominio` y `www.dominio` apuntando al servidor.
- [ ] `.env` completo, con contraseñas nuevas (no las de desarrollo).
- [ ] Copia del `.env` guardada fuera del servidor, en un gestor de contraseñas.
- [ ] `/srv/tar/media` creada y con el dueño correcto.
- [ ] `./infra/deploy.sh` termina en verde y `https://dominio/health` responde.
- [ ] Certificado HTTPS emitido (candado en el navegador).
- [ ] Inventario importado y revisado (`pnpm import:inventario`), **antes** de
      cancelar EasyBroker: al cancelarlo las fotos originales dejan de existir.
- [ ] Primer administrador creado y acceso al panel comprobado.
- [ ] Formulario de contacto probado de punta a punta (llega el correo y el aviso).
- [ ] Respaldo diario en el cron y **restauración de prueba hecha con éxito**.
- [ ] Cloudflare R2 configurado y con regla de ciclo de vida.
- [ ] Snapshots del proveedor del VPS activados.
- [ ] UptimeRobot vigilando `https://dominio/health`.
- [ ] Mapa comprobado en el dominio final (se cargan los mosaicos y se ven los marcadores).

---

> Glosario de términos: **[GLOSARIO.md](GLOSARIO.md)** ·
> Manual del panel: **[MANUAL-ADMIN.md](MANUAL-ADMIN.md)** ·
> Arquitectura: **[ARQUITECTURA.md](ARQUITECTURA.md)**
