#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# -ne 2 || "$1" != '--confirm-replace' || ! -f "$2" ]]; then
 echo 'Uso: scripts/restore.sh --confirm-replace archivo.dump (reemplaza los datos de la base configurada)' >&2
 exit 1
fi
docker compose stop backend worker frontend proxy
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --single-transaction --no-owner' < "$2"
docker compose up -d
