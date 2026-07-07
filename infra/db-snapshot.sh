#!/usr/bin/env bash
#
# db-snapshot.sh — Snapshot portátil de la BD + media para mover entre PCs.
#
# La BD (volumen Docker) y las imágenes (apps/api/uploads/) NO viajan por git.
# Este script empaqueta el ESTADO VIVO real (propiedades, leads, usuarios,
# ediciones del panel e imágenes) en un solo .tgz que llevas por USB/Drive/scp.
#
# Uso:
#   ./infra/db-snapshot.sh dump [etiqueta]     # crea snapshots/tar-snapshot-<fecha>[-etiqueta].tgz
#   ./infra/db-snapshot.sh restore <archivo>   # restaura BD + uploads desde un .tgz
#   ./infra/db-snapshot.sh list                # lista snapshots locales
#
# Requiere: contenedor `tar-db` levantado (pnpm db:up) y .env con POSTGRES_*.

set -euo pipefail

# --- Rutas y entorno --------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SNAP_DIR="$ROOT_DIR/snapshots"
UPLOADS_DIR="$ROOT_DIR/apps/api/uploads"
CONTAINER="tar-db"

# Carga POSTGRES_* desde .env (sin volcar el resto del entorno al shell).
ENV_FILE="$ROOT_DIR/.env"
if [[ -f "$ENV_FILE" ]]; then
  PG_USER="$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"
  PG_DB="$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"
fi
PG_USER="${PG_USER:-tar}"
PG_DB="${PG_DB:-tar_portal}"

err()  { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; }
ok()   { printf '\033[32m✓ %s\033[0m\n' "$*"; }
info() { printf '\033[36m→ %s\033[0m\n' "$*"; }

require_container() {
  if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    err "El contenedor '$CONTAINER' no está levantado. Corre: pnpm db:up"
    exit 1
  fi
}

# --- dump -------------------------------------------------------------------
cmd_dump() {
  require_container
  mkdir -p "$SNAP_DIR"
  local label="${1:-}"
  local stamp; stamp="$(date +%Y%m%d-%H%M%S)"
  local name="tar-snapshot-${stamp}${label:+-$label}"
  local work; work="$(mktemp -d)"
  trap 'rm -rf "$work"' RETURN

  info "Volcando BD '$PG_DB' desde el contenedor '$CONTAINER'…"
  # Plano + gzip: idempotente al restaurar (--clean --if-exists) y sin dueños
  # para que sea portable a otra PC con distinto usuario de Postgres.
  docker exec "$CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" \
    --clean --if-exists --no-owner --no-privileges \
    | gzip -9 > "$work/db.sql.gz"
  ok "BD volcada ($(du -h "$work/db.sql.gz" | cut -f1))"

  if [[ -d "$UPLOADS_DIR" ]] && [[ -n "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]]; then
    info "Empaquetando imágenes (apps/api/uploads/)…"
    tar -czf "$work/uploads.tgz" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
    ok "Imágenes empaquetadas ($(du -h "$work/uploads.tgz" | cut -f1))"
  else
    info "Sin imágenes en uploads/ (se omite)"
  fi

  # Manifiesto legible para saber qué contiene el snapshot sin abrirlo.
  {
    echo "snapshot:   $name"
    echo "creado:     $(date '+%Y-%m-%d %H:%M:%S %z')"
    echo "host:       $(hostname)"
    echo "db:         $PG_DB (usuario $PG_USER)"
    echo "uploads:    $([[ -f "$work/uploads.tgz" ]] && find "$UPLOADS_DIR" -type f | wc -l || echo 0) archivos"
    echo "git commit: $(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo '?')"
  } > "$work/manifest.txt"

  local out="$SNAP_DIR/$name.tgz"
  tar -czf "$out" -C "$work" .
  ok "Snapshot listo: ${out#$ROOT_DIR/} ($(du -h "$out" | cut -f1))"
  echo
  cat "$work/manifest.txt"
}

# --- restore ----------------------------------------------------------------
cmd_restore() {
  require_container
  local file="${1:-}"
  if [[ -z "$file" ]]; then
    err "Falta el archivo. Uso: ./infra/db-snapshot.sh restore <archivo.tgz>"
    exit 1
  fi
  # Permite pasar solo el nombre si está en snapshots/.
  [[ -f "$file" ]] || file="$SNAP_DIR/$file"
  [[ -f "$file" ]] || { err "No existe el archivo: $1"; exit 1; }

  local work; work="$(mktemp -d)"
  trap 'rm -rf "$work"' RETURN
  info "Extrayendo snapshot…"
  tar -xzf "$file" -C "$work"
  [[ -f "$work/manifest.txt" ]] && { echo; cat "$work/manifest.txt"; echo; }

  printf '\033[33m⚠  Esto REEMPLAZA la BD "%s" y el contenido de uploads/ de ESTA PC.\033[0m\n' "$PG_DB"
  read -r -p "¿Continuar? (escribe 'si'): " confirm
  [[ "$confirm" == "si" ]] || { info "Cancelado."; exit 0; }

  if [[ -f "$work/db.sql.gz" ]]; then
    info "Restaurando BD…"
    gunzip -c "$work/db.sql.gz" | docker exec -i "$CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -q
    ok "BD restaurada"
  else
    err "El snapshot no contiene db.sql.gz"; exit 1
  fi

  if [[ -f "$work/uploads.tgz" ]]; then
    info "Restaurando imágenes…"
    rm -rf "$UPLOADS_DIR"
    mkdir -p "$(dirname "$UPLOADS_DIR")"
    tar -xzf "$work/uploads.tgz" -C "$(dirname "$UPLOADS_DIR")"
    ok "Imágenes restauradas ($(find "$UPLOADS_DIR" -type f | wc -l) archivos)"
  else
    info "El snapshot no traía imágenes (uploads/ sin cambios)"
  fi
  echo; ok "Restauración completa."
}

# --- list -------------------------------------------------------------------
cmd_list() {
  if [[ -d "$SNAP_DIR" ]] && [[ -n "$(ls -A "$SNAP_DIR" 2>/dev/null)" ]]; then
    info "Snapshots en ${SNAP_DIR#$ROOT_DIR/}/:"
    ls -lh "$SNAP_DIR"/*.tgz 2>/dev/null | awk '{print "  " $9 "  (" $5 ")"}'
  else
    info "No hay snapshots todavía. Crea uno con: pnpm db:dump"
  fi
}

# --- dispatch ---------------------------------------------------------------
case "${1:-}" in
  dump)    shift; cmd_dump "$@" ;;
  restore) shift; cmd_restore "$@" ;;
  list)    cmd_list ;;
  *)
    echo "Uso: $0 {dump [etiqueta] | restore <archivo.tgz> | list}"
    exit 1
    ;;
esac
