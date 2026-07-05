# VeriGate CAP provider — always-on agent + read-only HTTP API.
# Deploy to any container host (e.g. Tencent Cloud). The Next.js dashboard
# deploys separately (e.g. Vercel) and reads this API via PROVIDER_API_URL.
FROM node:22-slim

WORKDIR /app

# Build toolchain for the better-sqlite3 native addon.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
ENV DB_PATH=/app/data/verigate.db
ENV PORT=8080

# Persist the order store across restarts — mount a volume here on the host.
VOLUME ["/app/data"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
