#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="gymmie-test-db"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="gymmie_test"

cleanup_existing() {
  if docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    echo "Stopping existing container $CONTAINER_NAME..."
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
  if podman inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    echo "Stopping existing container $CONTAINER_NAME..."
    podman rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
}

wait_for_ready() {
  local max_attempts=30
  local attempt=0
  echo "Waiting for PostgreSQL to be ready..."
  while [ $attempt -lt $max_attempts ]; do
    if pg_isready -h localhost -p 5432 -U "$DB_USER" >/dev/null 2>&1; then
      echo "PostgreSQL is ready."
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  echo "PostgreSQL did not become ready in time."
  return 1
}

cleanup_existing

# Try docker compose first (works in environments with full Docker)
if docker compose version >/dev/null 2>&1; then
  echo "Starting test database with docker compose..."
  if docker compose -f compose.test.yml up -d --wait 2>/dev/null; then
    echo "Test database started via docker compose on port 5433."
    echo "TEST_DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5433/$DB_NAME"
    exit 0
  fi
  echo "docker compose failed, falling back to podman..."
fi

# Fallback: podman run with --network host (port 5432)
echo "Starting test database with podman (--network host)..."
podman run -d --rm \
  --name "$CONTAINER_NAME" \
  --network host \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -e POSTGRES_DB="$DB_NAME" \
  postgres:16-alpine

wait_for_ready

echo "Test database started via podman on port 5432."
echo "TEST_DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
