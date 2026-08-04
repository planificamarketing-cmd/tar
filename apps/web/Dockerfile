# Imagen del sitio Next.js 14 (§11), salida `standalone`: el build produce un
# servidor mínimo con solo las dependencias que realmente usa.
#
# IMPORTANTE — las variables `NEXT_PUBLIC_*` se incrustan en el JavaScript
# DURANTE EL BUILD, no al arrancar. Por eso llegan como `ARG` desde
# `docker-compose.prod.yml`. Si cambias el dominio o la llave de Google Maps hay
# que **reconstruir** la imagen (`./infra/deploy.sh` lo hace), no basta reiniciar.
#
# El contexto de build es la RAÍZ del repo (monorepo pnpm), no apps/web.

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

# ── Dependencias + build ────────────────────────────────────────────────────
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN echo 'node-linker=hoisted' > .npmrc \
 && pnpm install --frozen-lockfile --filter web...

COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MEDIA_HOSTNAME
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_MEDIA_HOSTNAME=$NEXT_PUBLIC_MEDIA_HOSTNAME \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY \
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=$NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter web build

# ── Imagen final ────────────────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# `standalone` ya trae su propio node_modules recortado; `static` y `public` van
# aparte porque Next los deja fuera del bundle a propósito.
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/ -o /dev/null || exit 1

CMD ["node", "apps/web/server.js"]
