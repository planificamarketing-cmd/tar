#!/usr/bin/env bash
# deploy.sh — despliegue de producción (PRD §11).
#
#   git pull → validar .env → build imágenes → migraciones → up -d → healthcheck
#
# Uso (desde la raíz del repo, en el VPS, como el usuario `deploy`):
#   ./infra/deploy.sh              despliegue normal
#   ./infra/deploy.sh --no-pull    despliega el código que ya está en disco
#   ./infra/deploy.sh --rollback   vuelve al commit anterior y redespliega
#
# Si el healthcheck falla, el script AVISA y deja los logs a mano; no reinicia
# solo, porque en producción es preferible decidir a ciegas lo menos posible.

set -Eeuo pipefail

# ── Rutas y utilidades ───────────────────────────────────────────────────────
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.prod.yml"
ENV_FILE="$REPO_DIR/.env"

cd "$REPO_DIR"

if [[ -t 1 ]]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'
  BLUE=$'\033[0;34m'; BOLD=$'\033[1m'; NC=$'\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; NC=''
fi

step() { printf '\n%s▶ %s%s\n' "$BLUE$BOLD" "$*" "$NC"; }
ok()   { printf '%s✔ %s%s\n' "$GREEN" "$*" "$NC"; }
warn() { printf '%s⚠ %s%s\n' "$YELLOW" "$*" "$NC"; }
die()  { printf '\n%s✖ %s%s\n' "$RED$BOLD" "$*" "$NC" >&2; exit 1; }

trap 'die "El despliegue se detuvo en la línea $LINENO. Nada más se ejecutó."' ERR

DO_PULL=1
ROLLBACK=0
for arg in "$@"; do
  case "$arg" in
    --no-pull)  DO_PULL=0 ;;
    --rollback) ROLLBACK=1; DO_PULL=0 ;;
    -h|--help)  sed -n '2,14p' "$0"; exit 0 ;;
    *) die "Opción desconocida: $arg (usa --no-pull, --rollback o --help)" ;;
  esac
done

# ── 0. Comprobaciones previas ────────────────────────────────────────────────
step "Comprobando el entorno"

command -v docker >/dev/null 2>&1 || die "Docker no está instalado. Ver SETUP_SERVIDOR_UBUNTU.md §5."
docker compose version >/dev/null 2>&1 || die "Falta el plugin 'docker compose'. Ver SETUP_SERVIDOR_UBUNTU.md §5."
docker info >/dev/null 2>&1 || die "No se puede hablar con Docker. ¿El usuario está en el grupo 'docker'? (usermod -aG docker \$USER y volver a entrar)"
[[ -f "$ENV_FILE" ]] || die "No existe $ENV_FILE. Copia .env.example y llénalo antes de desplegar."
[[ -f "$COMPOSE_FILE" ]] || die "No existe $COMPOSE_FILE."

# Variables sin las que el despliegue quedaría a medias o inseguro.
REQUIRED_VARS=(
  POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB DATABASE_URL
  JWT_ACCESS_SECRET JWT_REFRESH_SECRET
  SITE_DOMAIN ACME_EMAIL
  PUBLIC_SITE_URL MEDIA_DIR MEDIA_BASE_URL CORS_ORIGINS
  NEXT_PUBLIC_API_URL NEXT_PUBLIC_SITE_URL
)
missing=()
for var in "${REQUIRED_VARS[@]}"; do
  # Se lee el .env sin cargarlo al shell (evita ejecutar nada por accidente).
  value="$(grep -E "^${var}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true)"
  [[ -n "${value//[[:space:]]/}" ]] || missing+=("$var")
done
if (( ${#missing[@]} > 0 )); then
  die "Faltan variables en .env: ${missing[*]}"
fi

# Errores clásicos al copiar el .env de desarrollo al servidor.
db_url="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | tail -n 1 | cut -d= -f2-)"
if [[ "$db_url" == *localhost* || "$db_url" == *127.0.0.1* ]]; then
  die "DATABASE_URL apunta a localhost. Dentro de Docker el host de la BD es 'db': postgres://usuario:clave@db:5432/tar_portal"
fi
if grep -qE '^(PUBLIC_SITE_URL|NEXT_PUBLIC_SITE_URL|MEDIA_BASE_URL)=.*localhost' "$ENV_FILE"; then
  warn "Alguna URL pública sigue apuntando a localhost: los enlaces de webhooks, imágenes y SEO saldrán mal."
fi
if [[ "$(grep -E '^NODE_ENV=' "$ENV_FILE" | tail -n 1 | cut -d= -f2-)" != "production" ]]; then
  warn "NODE_ENV no es 'production' en el .env."
fi

# La media vive en el host; si la carpeta no existe, el bind mount la crearía
# como root y la API (usuario 'node') no podría escribir.
MEDIA_HOST_DIR="$(grep -E '^MEDIA_HOST_DIR=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true)"
MEDIA_HOST_DIR="${MEDIA_HOST_DIR:-/srv/tar/media}"
if [[ ! -d "$MEDIA_HOST_DIR" ]]; then
  warn "No existe $MEDIA_HOST_DIR (carpeta de imágenes). Créala antes de continuar:"
  printf '    sudo mkdir -p %s && sudo chown -R 1000:1000 %s\n' "$MEDIA_HOST_DIR" "$MEDIA_HOST_DIR"
  die "Carpeta de media ausente."
fi

ok "Entorno correcto (dominio: $(grep -E '^SITE_DOMAIN=' "$ENV_FILE" | tail -n 1 | cut -d= -f2-))"

compose() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

# ── 1. Código ────────────────────────────────────────────────────────────────
PREVIOUS_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo '')"

if (( ROLLBACK )); then
  step "Rollback al commit anterior"
  [[ -n "$PREVIOUS_COMMIT" ]] || die "Esto no es un repositorio git; no hay a dónde volver."
  git reset --hard HEAD~1
  ok "Ahora en $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"
elif (( DO_PULL )); then
  step "Actualizando el código"
  if [[ -n "$(git status --porcelain)" ]]; then
    die "Hay cambios locales sin commitear en el servidor. Revísalos con 'git status' antes de desplegar."
  fi
  git pull --ff-only
  ok "Ahora en $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"
else
  step "Sin actualizar el código (--no-pull)"
fi

# ── 2. Imágenes ──────────────────────────────────────────────────────────────
# Se reconstruyen SIEMPRE: las NEXT_PUBLIC_* del sitio se incrustan en el build,
# así que un cambio de dominio o de llave solo surte efecto reconstruyendo.
step "Construyendo las imágenes (api y web)"
compose build --pull
ok "Imágenes construidas"

# ── 3. Base de datos ─────────────────────────────────────────────────────────
step "Levantando la base de datos"
compose up -d db
ok "Base de datos arriba"

step "Aplicando migraciones"
compose run --rm migrate
ok "Migraciones al día"

# ── 4. Servicios ─────────────────────────────────────────────────────────────
step "Levantando API, sitio y Caddy"
compose up -d --remove-orphans
ok "Servicios levantados"

# ── 5. Verificación ──────────────────────────────────────────────────────────
step "Comprobando que responde"

health_ok=0
for i in $(seq 1 30); do
  if compose exec -T api curl -fsS http://127.0.0.1:4000/health >/dev/null 2>&1; then
    health_ok=1
    break
  fi
  sleep 2
  printf '.'
done
printf '\n'

if (( ! health_ok )); then
  warn "La API no respondió al healthcheck. Últimos registros:"
  compose logs --tail 40 api || true
  die "Despliegue incompleto. Revisa los logs; para volver atrás: ./infra/deploy.sh --rollback"
fi

health_json="$(compose exec -T api curl -fsS http://127.0.0.1:4000/health)"
ok "API sana: $health_json"
case "$health_json" in
  *'"db":true'*) ok "Conexión a PostgreSQL/PostGIS correcta" ;;
  *) warn "La API responde pero NO ve la base de datos. Revisa DATABASE_URL." ;;
esac

if compose exec -T web curl -fsS -o /dev/null http://127.0.0.1:3000/ 2>/dev/null; then
  ok "Sitio público respondiendo"
else
  warn "El sitio no respondió todavía (puede tardar unos segundos más). Revisa: docker compose logs web"
fi

step "Estado final"
compose ps

DOMAIN="$(grep -E '^SITE_DOMAIN=' "$ENV_FILE" | tail -n 1 | cut -d= -f2-)"
printf '\n%s✔ Despliegue terminado%s\n' "$GREEN$BOLD" "$NC"
printf '  Sitio:   https://%s\n' "$DOMAIN"
printf '  Panel:   https://%s/admin\n' "$DOMAIN"
printf '  API:     https://%s/health\n' "$DOMAIN"
printf '  Docs:    https://%s/docs\n' "$DOMAIN"
printf '\n  Certificado TLS: Caddy lo emite solo en el primer arranque; si acabas de\n'
printf '  apuntar el DNS puede tardar un minuto. Seguimiento: docker compose logs -f caddy\n'
if [[ -n "$PREVIOUS_COMMIT" ]]; then
  printf '\n  Volver atrás: ./infra/deploy.sh --rollback  (commit previo: %s)\n' "${PREVIOUS_COMMIT:0:7}"
fi
