# Streamify — one image, one Render web service.
#
# Next.js serves the PWA on $PORT and proxies /api/* to Django on loopback, so the
# browser only ever talks to a single origin. YouTube Music support (and with it
# yt-dlp/ffmpeg) has been removed, which keeps this image small.

# ---------------------------------------------------------------- frontend ---
FROM node:22-bookworm-slim AS frontend

WORKDIR /build/frontend

# Dependency layer first so it is cached across source edits.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ----------------------------------------------------------------- runtime ---
FROM node:22-bookworm-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DJANGO_SETTINGS_MODULE=streamify_api.settings \
    VIRTUAL_ENV=/opt/venv \
    PATH="/opt/venv/bin:$PATH" \
    PORT=3000

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv curl \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip

# Backend dependencies (separate layer from the source).
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

# Next.js standalone server + the assets it does not bundle itself.
WORKDIR /app/frontend
COPY --from=frontend /build/frontend/.next/standalone ./
COPY --from=frontend /build/frontend/.next/static ./.next/static
COPY --from=frontend /build/frontend/public ./public

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

WORKDIR /app
EXPOSE 3000

CMD ["/app/docker-entrypoint.sh"]
