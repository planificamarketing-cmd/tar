#!/usr/bin/env bash
# tunnel-persist.sh — reintenta el Cloudflare Quick Tunnel SIN LÍMITE hasta que el
# endpoint gratuito (trycloudflare.com) se recupere del 500/1101. Al lograr la URL la
# escribe en infra/.demo-logs/tunnel.url y mantiene el túnel vivo; si se cae, reintenta.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH"
LOG="infra/.demo-logs/tunnel.log"
URLFILE="infra/.demo-logs/tunnel.url"
mkdir -p infra/.demo-logs
rm -f "$URLFILE"

while true; do
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
    echo "$URL" >"$URLFILE"
    wait "$CF_PID"        # túnel arriba; si se cae vuelve al bucle
    rm -f "$URLFILE"
  else
    kill "$CF_PID" 2>/dev/null || true
    sleep 10
  fi
done
