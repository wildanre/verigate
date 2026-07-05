# VeriGate — provider + dashboard in one image, sharing a SQLite volume.
FROM node:22-slim

WORKDIR /app

# Build toolchain for the better-sqlite3 native addon.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Provider (root package)
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Dashboard (web package)
COPY web/package*.json ./web/
RUN cd web && npm ci
COPY web ./web
RUN cd web && npm run build

COPY scripts ./scripts

ENV NODE_ENV=production
ENV DB_PATH=/app/data/verigate.db
EXPOSE 3000

CMD ["bash", "scripts/start.sh"]
