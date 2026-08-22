#!/usr/bin/env bash
set -euo pipefail

db_ready() {
  node --input-type=module -e "import pg from 'pg'; const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect(); await c.end();" >/dev/null 2>&1
}

wait_for_db() {
  local attempts="${1:-60}"
  local _
  for _ in $(seq 1 "${attempts}"); do
    if db_ready; then
      return 0
    fi
    sleep 0.5
  done
  return 1
}

ensure_test_db() {
  local name="${PRISMA_DEV_NAME:-gymmie-test}"
  local db_port="${PRISMA_DEV_DB_PORT:-51214}"
  local shadow_port="${PRISMA_DEV_SHADOW_PORT:-51215}"

  export DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@localhost:${db_port}/template1?sslmode=disable}"
  export SHADOW_DATABASE_URL="${SHADOW_DATABASE_URL:-postgres://postgres:postgres@localhost:${shadow_port}/template1?sslmode=disable}"

  if ! db_ready; then
    if [[ -n "${CI:-}" ]]; then
      echo "waiting for CI database at ${DATABASE_URL}" >&2
      if ! wait_for_db 60; then
        echo "timed out waiting for CI database on ${DATABASE_URL}" >&2
        exit 1
      fi
    else
      if ! pnpm exec prisma dev ls 2>/dev/null | grep -q "${name}"; then
        pnpm exec prisma dev --name "${name}" --detach
      fi
      if ! wait_for_db 120; then
        echo "timed out waiting for prisma dev on ${DATABASE_URL}" >&2
        exit 1
      fi
    fi
  fi

  pnpm exec prisma generate
  pnpm exec prisma migrate deploy
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  ensure_test_db
fi
