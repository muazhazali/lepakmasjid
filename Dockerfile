# Production image: Vite build + Express (static + /api)
FROM node:20-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY server/package.json server/pnpm-lock.yaml ./server/
RUN pnpm install --frozen-lockfile
RUN pnpm --dir server install --frozen-lockfile

COPY . .
ARG VITE_APP_URL=https://lepakmasjid.example.com
ARG VITE_API_URL=/api
ENV VITE_APP_URL=$VITE_APP_URL VITE_API_URL=$VITE_API_URL
RUN pnpm build
RUN pnpm --dir server build

FROM node:20-bookworm-slim AS run
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
WORKDIR /app

COPY server/package.json server/pnpm-lock.yaml ./server/
RUN pnpm --dir server install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist
COPY --from=build /app/server/dist ./server/dist
COPY server/migrations ./server/migrations
COPY deploy/docker-entrypoint.sh /app/deploy/docker-entrypoint.sh
RUN chmod +x /app/deploy/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=8080
ENV STATIC_DIR=/app/dist
ENV UPLOAD_DIR=/app/server/uploads

EXPOSE 8080
VOLUME ["/app/server/uploads"]

ENTRYPOINT ["/app/deploy/docker-entrypoint.sh"]