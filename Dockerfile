FROM node:22-slim AS deps

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-slim AS build

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS deps-prod

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-slim AS dev

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM node:22-slim AS prod

WORKDIR /app
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
USER appuser

EXPOSE 3000
CMD ["node", "dist/main"]

FROM gcr.io/distroless/nodejs22-debian12:nonroot AS prod-distroless

WORKDIR /app
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["dist/main"]

FROM node:22-slim AS migrate

WORKDIR /app
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

CMD ["node_modules/.bin/typeorm", "-d", "dist/config/data-source.js", "migration:run"]

FROM node:22-slim AS seed

WORKDIR /app
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

CMD ["node", "dist/seed/seed.js"]
