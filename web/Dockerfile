FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app

FROM base AS deps
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .

ENV API_PROXY_TARGET=http://host.docker.internal:8010
ENV API_INTERNAL_URL=http://host.docker.internal:8010
RUN pnpm run build

FROM base AS runtime
WORKDIR /app

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "server.js"]
