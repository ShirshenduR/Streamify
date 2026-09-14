# Streamify — one image, one Render web service.
#
# Three processes share this container, and only one of them is public:
#
#   Next.js  0.0.0.0:$PORT        the PWA (public; proxies /api/* to Django)
#   Django   127.0.0.1:8000       the Streamify API + library
#   JioSaavn 127.0.0.1:8123       music catalogue, bundled so it cannot be
#                                IP-banned out from under us
#
# YouTube Music support (and with it yt-dlp/ffmpeg) was removed earlier, which is
# why this stays small.

# ---------------------------------------------------------------- frontend ---
FROM node:22-bookworm-slim AS frontend

WORKDIR /build/frontend

# Dependency layer first so it is cached across source edits.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -------------------------------------------------------------- jiosaavn api --
# Fetched and pinned at build time. The alternative — shipping against the shared
# public instance — is what broke: its WAF bans whole networks, and a fix here
# would not help. Pinning keeps the build reproducible.
FROM node:22-bookworm-slim AS saavn-api

ARG SAAVN_API_SHA=6dc24cfb1ec444cdfcea9de1e59afd1146a51547

WORKDIR /api

# Node's built-in fetch handles the download: bookworm-slim ships neither git nor
# curl, and this avoids installing either.
RUN node -e "fetch('https://codeload.github.com/ShirshenduR/jiosaavn/tar.gz/${SAAVN_API_SHA}') \
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }) \
      .then((b) => require('fs').writeFileSync('/tmp/api.tgz', Buffer.from(b)))" \
    && tar -xzf /tmp/api.tgz -C /api --strip-components=1 \
    && rm /tmp/api.tgz

# --ignore-scripts: the project's postinstall installs git hooks, which is
# meaningless in a build stage and fails outside a git checkout.
RUN npm install --ignore-scripts --no-audit --no-fund \
    && npm run build \
    && npm prune --omit=dev

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

# Music API: compiled output, production dependencies, and the server entry.
# package.json is required so dist/*.js load as ES modules.
WORKDIR /app/saavn-api
COPY --from=saavn-api /api/dist ./dist
COPY --from=saavn-api /api/node_modules ./node_modules
COPY --from=saavn-api /api/package.json ./package.json
COPY saavn-api/serve.mjs ./serve.mjs

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

WORKDIR /app
EXPOSE 3000

CMD ["/app/docker-entrypoint.sh"]
