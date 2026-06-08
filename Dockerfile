FROM node:22-slim AS base

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src/ src/
RUN pnpm run build

FROM base AS runtime
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist-build ./dist-build
COPY package.json ./
COPY config/ config/

RUN mkdir -p data/skills data/employees data/sources dist

VOLUME ["/app/data", "/app/dist", "/app/config"]

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3100

EXPOSE 3100

CMD ["node", "dist-build/cli.js", "serve"]
