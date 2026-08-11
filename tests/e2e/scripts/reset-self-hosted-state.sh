#!/usr/bin/env bash
set -euo pipefail

INSTANCE="${ZED_SELF_HOST_INSTANCE:-${ZED_E2E_INSTANCE:-default}}"
CONTAINER_NAME="${SUPABASE_DB_CONTAINER:-zed-${INSTANCE}-supabase-db-1}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Container '$CONTAINER_NAME' is not running."
  echo "Start the local stack first with: zed self-host start --local --yes"
  exit 1
fi

echo "Resetting auth users in $CONTAINER_NAME ..."
docker exec "$CONTAINER_NAME" psql -U postgres -d postgres -c "delete from auth.users;"
echo "Done. install-status should now report installed=false."
