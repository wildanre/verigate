# For platforms that run one process per type (share a persistent volume for DB_PATH).
# Single-container platforms should use the Dockerfile (scripts/start.sh) instead.
provider: node dist/main.js
web: cd web && npm run start -- -p $PORT
