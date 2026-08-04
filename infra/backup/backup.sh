#!/usr/bin/env bash
# backup.sh — respaldo diario (PRD §14). Capas 1 y 2 del esquema de 3:
#
#   Capa 1 (local)     pg_dump comprimido + tar de las imágenes → /var/backups/tar
#                      con rotación automática (30 días por defecto).
#   Capa 2 (off-site)  sincronización a Cloudflare R2 con rclone.
#   Capa 3             snapshots del proveedor del VPS (se configuran en su panel,
#                      no dependen de este script).
#
# Uso:
#   ./infra/backup/backup.sh              respaldo completo (BD + media + R2)
#   ./infra/backup/backup.sh --no-remote  solo local, sin subir a R2
#   ./infra/backup/backup.sh --db-only    solo la base de datos
#
# Cron (diario 3:00 AM), como root o como el usuario `deploy` con acceso a docker:
#   0 3 * * * /opt/tar/infra/backup/backup.sh >> /var/log/tar-backup.log 2>&1
#
# Restauración: ./infra/backup/restore.sh (ver docs/README-DEPLOY.md).

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_DIR/.env"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/tar}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_CONTAINER="${DB_CONTAINER:-tar-db}"
RCLONE_REMOTE="${RCLONE_REMOTE:-r2}"
RCLONE_BUCKET="${RCLONE_BUCKET:-tar-respaldos}"

DO_REMOTE=1
DO_MEDIA=1
for arg in "$@"; do
  case "$arg" in
    --no-remote) DO_REMOTE=0 ;;
    --db-only)   DO_MEDIA=0 ;;
    -h|--help)   sed -n '2,20p' "$0"; exit 0 ;;
    *) printf 'Opción desconocida: %s\n' "$arg" >&2; exit 1 ;;
  esac
done

log()  { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
die()  { printf '[%s] ✖ %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2; exit 1; }

trap 'die "El respaldo falló en la línea $LINENO"' ERR

# ── Configuración ────────────────────────────────────────────────────────────
[[ -f "$ENV_FILE" ]] || die "No existe $ENV_FILE"

envval() { grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true; }

POSTGRES_USER="$(envval POSTGRES_USER)"
POSTGRES_DB="$(envval POSTGRES_DB)"
POSTGRES_DB="${POSTGRES_DB:-tar_portal}"
MEDIA_HOST_DIR="$(envval MEDIA_HOST_DIR)"
MEDIA_HOST_DIR="${MEDIA_HOST_DIR:-/srv/tar/media}"

[[ -n "$POSTGRES_USER" ]] || die "Falta POSTGRES_USER en .env"
command -v docker >/dev/null 2>&1 || die "Docker no está disponible"
docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER" \
  || die "El contenedor '$DB_CONTAINER' no está corriendo. ¿Está levantada la plataforma?"

STAMP="$(date '+%Y%m%d-%H%M')"
mkdir -p "$BACKUP_DIR"

log "=== Respaldo $STAMP ==="
log "Destino local: $BACKUP_DIR (retención: ${RETENTION_DAYS} días)"

# ── Capa 1a — Base de datos ──────────────────────────────────────────────────
DB_FILE="$BACKUP_DIR/db-$STAMP.sql.gz"
log "Volcando la base de datos '$POSTGRES_DB'…"
# Volcado LIMPIO, sin sentencias DROP: `restore.sh` recrea la base desde cero
# antes de cargarlo. Con `--clean` fallaría, porque las tablas particionadas de
# pg-boss tienen restricciones heredadas que no se pueden soltar una a una.
# `--no-owner --no-privileges`: el volcado se puede cargar con cualquier usuario.
docker exec "$DB_CONTAINER" pg_dump \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --no-owner --no-privileges \
  | gzip -9 > "$DB_FILE.tmp"
mv "$DB_FILE.tmp" "$DB_FILE"

# Un volcado vacío o truncado es peor que no tener respaldo: se comprueba.
gzip -t "$DB_FILE" || die "El volcado quedó corrupto: $DB_FILE"
DB_SIZE_BYTES="$(stat -c%s "$DB_FILE")"
(( DB_SIZE_BYTES > 1024 )) || die "El volcado es sospechosamente pequeño ($DB_SIZE_BYTES bytes)"
log "✔ Base de datos: $(du -h "$DB_FILE" | cut -f1) → $(basename "$DB_FILE")"

# ── Capa 1b — Imágenes ───────────────────────────────────────────────────────
if (( DO_MEDIA )); then
  if [[ -d "$MEDIA_HOST_DIR" ]]; then
    MEDIA_FILE="$BACKUP_DIR/media-$STAMP.tar.gz"
    log "Empaquetando las imágenes de $MEDIA_HOST_DIR…"
    tar -czf "$MEDIA_FILE.tmp" -C "$(dirname "$MEDIA_HOST_DIR")" "$(basename "$MEDIA_HOST_DIR")"
    mv "$MEDIA_FILE.tmp" "$MEDIA_FILE"
    gzip -t "$MEDIA_FILE" || die "El paquete de imágenes quedó corrupto: $MEDIA_FILE"
    log "✔ Imágenes: $(du -h "$MEDIA_FILE" | cut -f1) → $(basename "$MEDIA_FILE")"
  else
    log "⚠ No existe $MEDIA_HOST_DIR; se omite el respaldo de imágenes."
  fi
fi

# ── Rotación local ───────────────────────────────────────────────────────────
log "Rotando respaldos de más de ${RETENTION_DAYS} días…"
deleted="$(find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.sql.gz' -o -name 'media-*.tar.gz' \) \
  -mtime +"$RETENTION_DAYS" -print -delete | wc -l)"
log "✔ Eliminados: $deleted archivo(s)"

# ── Capa 2 — Off-site en Cloudflare R2 ───────────────────────────────────────
if (( DO_REMOTE )); then
  if ! command -v rclone >/dev/null 2>&1; then
    log "⚠ rclone no está instalado: se omite la copia off-site. Ver SETUP_SERVIDOR_UBUNTU.md §7."
  elif ! rclone listremotes 2>/dev/null | grep -qx "${RCLONE_REMOTE}:"; then
    log "⚠ El remoto '${RCLONE_REMOTE}:' no está configurado en rclone: se omite la copia off-site."
  else
    DEST="${RCLONE_REMOTE}:${RCLONE_BUCKET}/$(hostname)"
    log "Sincronizando con $DEST…"
    rclone sync "$BACKUP_DIR" "$DEST" --transfers 4 --checksum --stats-one-line
    log "✔ Copia off-site al día"
    # La retención en R2 se controla con la regla de ciclo de vida del bucket
    # (30–60 días) desde el panel de Cloudflare, no desde aquí.
  fi
fi

# ── Resumen ──────────────────────────────────────────────────────────────────
TOTAL="$(du -sh "$BACKUP_DIR" | cut -f1)"
COUNT="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.gz' | wc -l)"
log "=== Listo: $COUNT archivo(s), $TOTAL en total ==="
log "Prueba de restauración: ./infra/backup/restore.sh --list"
