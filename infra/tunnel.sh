#!/usr/bin/env bash
# tunnel.sh — abre (con reintentos) un Cloudflare Quick Tunnel sobre el Caddy local
# (:8080) cuando el stack ya está corriendo. Reintenta ante el 500/1101 del endpoint
# gratuito de Cloudflare y, al obtener la URL, deja el túnel vivo.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH"
LOG="infra/.demo-logs/tunnel.log"
mkdir -p infra/.demo-logs

for attempt in $(seq 1 15); do
  : >"$LOG"
  cloudflared tunnel --url http://localhost:8080 >"$LOG" 2>&1 &
  CF_PID=$!
  URL=""
  for _ in $(seq 1 20); do
    URL=$(grep -Eo 'https://[a-z0-9.-]+\.trycloudflare\.com' "$LOG" | head -1 || true)
    [ -n "$URL" ] && break
    grep -q 'error code: 1101\|failed to unmarshal' "$LOG" && break
    kill -0 "$CF_PID" 2>/dev/null || break
    sleep 1
  done
  if [ -n "$URL" ]; then
    echo "TUNNEL_OK $URL"
    wait "$CF_PID"   # mantener vivo el túnel
    exit 0
  fi
  echo "intento $attempt: Cloudflare 500/1101, reintento…"
  kill "$CF_PID" 2>/dev/null || true
  sleep 5
done
echo "TUNNEL_FAIL"
exit 1
