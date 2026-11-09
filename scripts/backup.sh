#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p infrastructure/backups/postgres
file="infrastructure/backups/postgres/mssp-$(date -u +%Y%m%dT%H%M%SZ).dump"
umask 077
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$file"
printf 'Backup: %s\n' "$file"
