#!/bin/sh
# Starts Django (loopback only) and then Next.js on the public port.
set -e

: "${PORT:=3000}"
export PORT
: "${DJANGO_INTERNAL_PORT:=8000}"
export DJANGO_INTERNAL_PORT

# ------------------------------------------------------------------ django ---
cd /app/backend

echo "[streamify] applying database migrations"
python manage.py migrate --noinput

echo "[streamify] collecting static files"
python manage.py collectstatic --noinput >/dev/null 2>&1 || \
  echo "[streamify] collectstatic skipped"

echo "[streamify] starting Django on 127.0.0.1:${DJANGO_INTERNAL_PORT}"
gunicorn streamify_api.wsgi:application \
  --bind "127.0.0.1:${DJANGO_INTERNAL_PORT}" \
  --workers "${GUNICORN_WORKERS:-2}" \
  --threads 4 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - &
DJANGO_PID=$!

# Give Django a moment so the very first proxied request is not a 502.
waited=0
while [ "$waited" -lt 60 ]; do
  if curl -fsS "http://127.0.0.1:${DJANGO_INTERNAL_PORT}/api/health/" >/dev/null 2>&1; then
    echo "[streamify] Django is ready"
    break
  fi
  if ! kill -0 "$DJANGO_PID" 2>/dev/null; then
    echo "[streamify] Django exited during startup" >&2
    exit 1
  fi
  waited=$((waited + 1))
  sleep 0.5
done

# ------------------------------------------------------------------ next -----
cd /app/frontend

echo "[streamify] starting Next.js on 0.0.0.0:${PORT}"
HOSTNAME=0.0.0.0 node server.js &
NEXT_PID=$!

forward_signal() {
  echo "[streamify] shutting down"
  kill -TERM "$NEXT_PID" "$DJANGO_PID" 2>/dev/null || true
}

trap forward_signal TERM INT

# Keep the shell in the foreground so container signals reach the trap.
set +e
wait "$NEXT_PID"
STATUS=$?
forward_signal
wait "$DJANGO_PID" 2>/dev/null
exit "$STATUS"
