#!/bin/sh
# Starts the bundled JioSaavn API, then Django, then Next.js on the public port.
set -e

: "${PORT:=3000}"
export PORT
: "${DJANGO_INTERNAL_PORT:=8000}"
export DJANGO_INTERNAL_PORT

# Must match the constant in saavn-api/serve.mjs and upstream.JIOSAAVN_API.
SAAVN_API_PORT=8123

# Wait for an HTTP endpoint to answer. $1 = url, $2 = label, $3 = pid to watch.
wait_for() {
  waited=0
  while [ "$waited" -lt 90 ]; do
    if curl -fsS "$1" >/dev/null 2>&1; then
      echo "[streamify] $2 is ready"
      return 0
    fi
    if [ -n "$3" ] && ! kill -0 "$3" 2>/dev/null; then
      echo "[streamify] $2 exited during startup" >&2
      return 1
    fi
    waited=$((waited + 1))
    sleep 0.5
  done
  echo "[streamify] $2 did not become ready in time" >&2
  return 1
}

# ------------------------------------------------------------ music catalogue --
cd /app/saavn-api
echo "[streamify] starting the bundled JioSaavn API on 127.0.0.1:${SAAVN_API_PORT}"
node serve.mjs &
SAAVN_PID=$!

# The root route serves the API's own docs page, so this checks that the process
# is listening without consuming a real upstream lookup.
wait_for "http://127.0.0.1:${SAAVN_API_PORT}/" "the JioSaavn API" "$SAAVN_PID" || {
  echo "[streamify] continuing without the music API" >&2
}

# ------------------------------------------------------------------- django ---
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

wait_for "http://127.0.0.1:${DJANGO_INTERNAL_PORT}/api/health/" "Django" "$DJANGO_PID" || exit 1

# --------------------------------------------------------------------- next ---
cd /app/frontend

echo "[streamify] starting Next.js on 0.0.0.0:${PORT}"
HOSTNAME=0.0.0.0 node server.js &
NEXT_PID=$!

forward_signal() {
  echo "[streamify] shutting down"
  kill -TERM "$NEXT_PID" "$DJANGO_PID" "$SAAVN_PID" 2>/dev/null || true
}

trap forward_signal TERM INT

# Keep the shell in the foreground so container signals reach the trap.
set +e
wait "$NEXT_PID"
STATUS=$?
forward_signal
wait "$DJANGO_PID" 2>/dev/null
wait "$SAAVN_PID" 2>/dev/null
exit "$STATUS"
