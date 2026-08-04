#!/usr/bin/env bash
# restore.sh — restauración de un respaldo (PRD §14, objetivo contractual <2h).
#
# Uso:
#   ./infra/backup/restore.sh --list                  ver respaldos disponibles
#   ./infra/backup/restore.sh --latest                restaurar el más reciente (local)
#   ./infra/backup/restore.sh --from-r2 --latest      bajar de Cloudflare R2 y restaurar
#   ./infra/backup/restore.sh --db /ruta/db-....sql.gz [--media /ruta/media-....tar.gz]
#   ./infra/backup/restore.sh --latest --dry-run      ensayo: valida sin escribir nada
#
# ESTO SOBRESCRIBE la base de datos y las imágenes actuales. El script pide
# confirmación escrita salvo que se pase --yes (para pruebas automatizadas).
#
# Escenario de pérdida total del VPS: aprovisionar el servidor nuevo con
# SETUP_SERVIDOR_UBUNTU.md, clonar el repo, poner el .env, `./infra/deploy.sh`,
# y luego `./infra/backup/restore.sh --from-r2 --latest`.

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_DIR/.env"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/tar}"
DB_CONTAINER="${DB_CONTAINER:-tar-db}"
API_CONTAINER="${API_CONTAINER:-tar-api}"
RCLONE_REMOTE="${RCLONE_REMOTE:-r2}"
RCLONE_BUCKET="${RCLONE_BUCKET:-tar-respaldos}"

MODE=''
DB_PATH=''
MEDIA_PATH=''
FROM_R2=0
ASSUME_YES=0
DRY_RUN=0

while (( $# > 0 )); do
  case "$1" in
    --list)    MODE='list' ;;
    --latest)  MODE='latest' ;;
    --db)      MODE='explicit'; DB_PATH="${2:?--db necesita una ruta}"; shift ;;
    --media)   MEDIA_PATH="${2:?--media necesita una ruta}"; shift ;;
    --from-r2) FROM_R2=1 ;;
    --yes|-y)  ASSUME_YES=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) printf 'Opción desconocida: %s\n' "$1" >&2; exit 1 ;;
  esac
  shift
done

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
die() { printf '\n✖ %s\n' "$*" >&2; exit 1; }
trap 'die "La restauración falló en la línea $LINENO. La base puede haber quedado a medias: revisa antes de reintentar."' ERR

[[ -f "$ENV_FILE" ]] || die "No existe $ENV_FILE"
envval() { grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true; }

POSTGRES_USER="$(envval POSTGRES_USER)"
POSTGRES_DB="$(envval POSTGRES_DB)"; POSTGRES_DB="${POSTGRES_DB:-tar_portal}"
MEDIA_HOST_DIR="$(envval MEDIA_HOST_DIR)"; MEDIA_HOST_DIR="${MEDIA_HOST_DIR:-/srv/tar/media}"
[[ -n "$POSTGRES_USER" ]] || die "Falta POSTGRES_USER en .env"

# ── Traer los respaldos de R2 si se pidió ────────────────────────────────────
if (( FROM_R2 )); then
  command -v rclone >/dev/null 2>&1 || die "rclone no está instalado (ver SETUP_SERVIDOR_UBUNTU.md §7)"
  SRC="${RCLONE_REMOTE}:${RCLONE_BUCKET}/$(hostname)"
  log "Descargando respaldos desde $SRC…"
  mkdir -p "$BACKUP_DIR"
  if ! rclone copy "$SRC" "$BACKUP_DIR" --stats-one-line; then
    log "No se encontró la carpeta de este host; se listan las disponibles en el bucket:"
    rclone lsd "${RCLONE_REMOTE}:${RCLONE_BUCKET}"
    die "Elige el host correcto: RCLONE_BUCKET=... o copia a mano con rclone copy."
  fi
  log "✔ Descarga completa"
fi

# ── Listado ──────────────────────────────────────────────────────────────────
if [[ "$MODE" == 'list' || -z "$MODE" ]]; then
  printf '\nRespaldos en %s:\n\n' "$BACKUP_DIR"
  if compgen -G "$BACKUP_DIR/db-*.sql.gz" > /dev/null; then
    # shellcheck disable=SC2012  # se quiere el formato legible de ls, no un parseo
    ls -lh "$BACKUP_DIR"/db-*.sql.gz "$BACKUP_DIR"/media-*.tar.gz 2>/dev/null | awk '{print "  " $9 "  (" $5 ", " $6 " " $7 ")"}'
  else
    printf '  (ninguno)\n'
  fi
  printf '\nPara restaurar el más reciente:  %s --latest\n' "$0"
  printf 'Desde Cloudflare R2:             %s --from-r2 --latest\n\n' "$0"
  [[ "$MODE" == 'list' ]] && exit 0
  exit 0
fi

# ── Elegir archivos ──────────────────────────────────────────────────────────
if [[ "$MODE" == 'latest' ]]; then
  DB_PATH="$(find "$BACKUP_DIR" -maxdepth 1 -name 'db-*.sql.gz' -print0 2>/dev/null \
    | xargs -0 -r ls -1t 2>/dev/null | head -n 1 || true)"
  [[ -n "$DB_PATH" ]] || die "No hay respaldos de base de datos en $BACKUP_DIR"
  if [[ -z "$MEDIA_PATH" ]]; then
    MEDIA_PATH="$(find "$BACKUP_DIR" -maxdepth 1 -name 'media-*.tar.gz' -print0 2>/dev/null \
      | xargs -0 -r ls -1t 2>/dev/null | head -n 1 || true)"
  fi
fi

[[ -f "$DB_PATH" ]] || die "No se encuentra el volcado: $DB_PATH"
gzip -t "$DB_PATH" || die "El volcado está corrupto: $DB_PATH"
if [[ -n "$MEDIA_PATH" ]]; then
  [[ -f "$MEDIA_PATH" ]] || die "No se encuentra el paquete de imágenes: $MEDIA_PATH"
  gzip -t "$MEDIA_PATH" || die "El paquete de imágenes está corrupto: $MEDIA_PATH"
fi

printf '\nSe va a restaurar:\n'
printf '  Base de datos : %s  (%s)\n' "$(basename "$DB_PATH")" "$(du -h "$DB_PATH" | cut -f1)"
if [[ -n "$MEDIA_PATH" ]]; then
  printf '  Imágenes      : %s  (%s)\n' "$(basename "$MEDIA_PATH")" "$(du -h "$MEDIA_PATH" | cut -f1)"
else
  printf '  Imágenes      : (no se restauran)\n'
fi
printf '  Destino       : BD "%s" y carpeta %s\n' "$POSTGRES_DB" "$MEDIA_HOST_DIR"

if (( DRY_RUN )); then
  printf '\n✔ Ensayo (--dry-run): los archivos son válidos y están completos. No se escribió nada.\n'
  exit 0
fi

printf '\n⚠  ESTO SOBRESCRIBE LOS DATOS ACTUALES.\n'
if (( ! ASSUME_YES )); then
  read -r -p 'Escribe RESTAURAR para continuar: ' answer
  [[ "$answer" == 'RESTAURAR' ]] || die "Cancelado por el usuario."
fi

docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER" \
  || die "El contenedor '$DB_CONTAINER' no está corriendo. Levanta la plataforma primero (./infra/deploy.sh)."

# ── Restaurar ────────────────────────────────────────────────────────────────
# La API se detiene para que nada escriba mientras se recarga el esquema.
if docker ps --format '{{.Names}}' | grep -qx "$API_CONTAINER"; then
  log "Deteniendo la API para que nadie escriba durante la restauración…"
  docker stop "$API_CONTAINER" >/dev/null
  RESTART_API=1
else
  RESTART_API=0
fi

# La base se recrea desde cero en vez de sobrescribirse encima: las tablas
# particionadas de pg-boss traen restricciones heredadas que no se pueden
# soltar individualmente, así que un volcado "con DROP" fallaría a medias.
# WITH (FORCE) corta las conexiones que sigan abiertas (worker de pg-boss, etc.).
log "Recreando la base '$POSTGRES_DB' vacía…"
docker exec "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 --quiet \
  -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE)"
docker exec "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 --quiet \
  -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\""

log "Cargando el volcado…"
gunzip -c "$DB_PATH" | docker exec -i "$DB_CONTAINER" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 --quiet
log "✔ Base de datos restaurada"

if [[ -n "$MEDIA_PATH" ]]; then
  log "Restaurando las imágenes…"
  PARENT="$(dirname "$MEDIA_HOST_DIR")"
  if [[ -d "$MEDIA_HOST_DIR" ]]; then
    SAFETY="$MEDIA_HOST_DIR.anterior-$(date '+%Y%m%d-%H%M')"
    mv "$MEDIA_HOST_DIR" "$SAFETY"
    log "  (las imágenes anteriores quedaron en $SAFETY)"
  fi
  mkdir -p "$PARENT"
  tar -xzf "$MEDIA_PATH" -C "$PARENT"
  # El contenedor corre como el usuario `node` (uid 1000).
  chown -R 1000:1000 "$MEDIA_HOST_DIR" 2>/dev/null \
    || log "  ⚠ No se pudo ajustar el dueño de $MEDIA_HOST_DIR (¿hace falta sudo?)"
  log "✔ Imágenes restauradas"
fi

if (( RESTART_API )); then
  log "Levantando la API…"
  docker start "$API_CONTAINER" >/dev/null
fi

# ── Verificación ─────────────────────────────────────────────────────────────
log "Comprobando…"
COUNT="$(docker exec "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -tAc 'select count(*) from properties' 2>/dev/null || echo '?')"
LEADS="$(docker exec "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -tAc 'select count(*) from leads' 2>/dev/null || echo '?')"
printf '\n✔ Restauración terminada\n'
printf '  Propiedades en la base: %s\n' "$COUNT"
printf '  Prospectos en la base : %s\n' "$LEADS"
SITE_DOMAIN="$(envval SITE_DOMAIN)"
printf '\n  Comprueba el sitio:  curl -fsS https://%s/health\n\n' "${SITE_DOMAIN:-<dominio>}"
