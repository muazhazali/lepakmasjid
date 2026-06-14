#!/bin/sh
set -e
cd /app/server
node dist/scripts/migrate.js
if [ "${RUN_SEED:-}" = "1" ]; then
  node dist/scripts/seed.js
fi
cd /app
exec node server/dist/src/production.js