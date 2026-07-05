#!/usr/bin/env bash
# Run the CAP provider and the Next.js dashboard together in one container,
# sharing the co-located SQLite file (DB_PATH). Either process exiting takes
# the container down so the platform restarts it.
set -e

export DB_PATH="${DB_PATH:-/app/data/verigate.db}"
mkdir -p "$(dirname "$DB_PATH")"

node dist/main.js &
PROVIDER_PID=$!

( cd web && npm run start -- -p "${PORT:-3000}" ) &
WEB_PID=$!

trap 'kill $PROVIDER_PID $WEB_PID 2>/dev/null || true' TERM INT
wait -n "$PROVIDER_PID" "$WEB_PID"
kill "$PROVIDER_PID" "$WEB_PID" 2>/dev/null || true
