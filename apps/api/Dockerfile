# Imagen de la API (§11). Multi-stage: se compila con todas las dependencias y
# la imagen final solo lleva el bundle + las dependencias de producción.
#
# El contexto de build es la RAÍZ del repo (es un monorepo pnpm), no apps/api.
# Ver `infra/docker-compose.prod.yml`.
#
# `node-linker=hoisted` en las etapas de instalación: deja un `node_modules`
# plano en vez del árbol de enlaces simbólicos de pnpm, para que copiarlo entre
# etapas de Docker no rompa las rutas.

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

# ── Manifiestos del workspace (capa cacheable: solo cambia si cambian las deps) ──
FROM base AS manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/

# ── Dependencias completas + compilación ─────────────────────────────────────
FROM manifests AS build
# argon2 se compila desde fuente si no hay binario precompilado para la plataforma.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
RUN echo 'node-linker=hoisted' > .npmrc && pnpm install --frozen-lockfile
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY apps/api/ apps/api/
RUN pnpm --filter api build

# ── Solo dependencias de producción (las que viajan a la imagen final) ───────
FROM manifests AS prod-deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
RUN echo 'node-linker=hoisted' > .npmrc \
 && pnpm install --frozen-lockfile --prod --filter api...

# ── Imagen final ────────────────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=4000
# La carpeta de migraciones no queda junto al código: se pasa explícita.
ENV MIGRATIONS_DIR=/app/migrations

# `curl` lo usa el healthcheck de Docker Compose.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY packages/db/migrations ./migrations

# El almacenamiento de media es un bind mount del host (MEDIA_DIR=/srv/tar/media).
# Se crea aquí para que exista con el dueño correcto si el volumen viene vacío.
RUN mkdir -p /srv/tar/media && chown -R node:node /srv/tar/media
USER node

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:4000/health || exit 1

CMD ["node", "dist/index.cjs"]
