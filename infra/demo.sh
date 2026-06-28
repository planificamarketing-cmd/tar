#!/usr/bin/env bash
# demo.sh — Levanta el portal de un solo origen y lo expone a internet con un
# Cloudflare Quick Tunnel (URL https temporal, sin dominio ni cuenta) para enseñar
# el backoffice mientras no hay VPS.
#
#   API (:4000) + Web (:3000)  ──►  Caddy (:8080)  ──►  cloudflared  ──►  https://*.trycloudflare.com
#
# Uso:   ./infra/demo.sh          (Ctrl-C para detener todo)
# Requisitos ya instalados: caddy y cloudflared en ~/.local/bin
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH"
export NEXT_PUBLIC_API_URL=/api/v1

LOGS="infra/.demo-logs"
mkdir -p "$LOGS"
PIDS=()

cleanup() {
  echo ""
  echo "→ Deteniendo demo…"
  for pid in "${PIDS[@]:-}"; do kill "$pid" 2>/dev/null || true; done
  # cloudflared y caddy a veces dejan hijos
  pkill -P $$ 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait_port() { # $1=puerto $2=nombre
  for _ in $(seq 1 60); do
    if (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; then exec 3>&- 3<&-; return 0; fi
    sleep 1
  done
  echo "✗ $2 no respondió en :$1 (revisa $LOGS)"; return 1
}

echo "→ Verificando base de datos (Docker)…"
pnpm db:up >/dev/null 2>&1 || true

echo "→ Iniciando API (:4000)…"
pnpm --filter api dev >"$LOGS/api.log" 2>&1 & PIDS+=($!)

echo "→ Iniciando Web producción (:3000)…"
pnpm --filter web start >"$LOGS/web.log" 2>&1 & PIDS+=($!)

wait_port 4000 "API"
wait_port 3000 "Web"

echo "→ Iniciando Caddy (reverse proxy :8080)…"
caddy run --config infra/Caddyfile.demo >"$LOGS/caddy.log" 2>&1 & PIDS+=($!)
wait_port 8080 "Caddy"

echo "→ Abriendo túnel Cloudflare…"
# El endpoint gratuito (trycloudflare.com) a veces responde 500 (error 1101) por
# saturación; reintentamos varias veces hasta obtener la URL pública.
URL=""
for attempt in $(seq 1 8); do
  : >"$LOGS/tunnel.log"
  cloudflared tunnel --url http://localhost:8080 >"$LOGS/tunnel.log" 2>&1 &
  CF_PID=$!
  for _ in $(seq 1 20); do
    URL=$(grep -Eo 'https://[a-z0-9.-]+\.trycloudflare\.com' "$LOGS/tunnel.log" | head -1 || true)
    [ -n "$URL" ] && break
    grep -q 'error code: 1101\|failed to unmarshal' "$LOGS/tunnel.log" && break
    kill -0 "$CF_PID" 2>/dev/null || break
    sleep 1
  done
  if [ -n "$URL" ]; then PIDS+=("$CF_PID"); break; fi
  echo "  · intento $attempt: Cloudflare respondió 500 (su lado); reintentando…"
  kill "$CF_PID" 2>/dev/null || true
  sleep 4
done

echo ""
echo "════════════════════════════════════════════════════════════════"
if [ -n "$URL" ]; then
  echo "  ✅ DEMO EN LÍNEA:  $URL/admin/login"
else
  echo "  ⚠ No se detectó la URL; revisa $LOGS/tunnel.log"
fi
echo "  Usuario: admin@tarinternacional.com   ·   Contraseña: admin123"
echo "  (Ctrl-C para detener y cerrar el túnel)"
echo "════════════════════════════════════════════════════════════════"

wait
