#!/usr/bin/env bash
# Measure faculty-related index usage (run against a live/staging DB with stats).
# Usage: DATABASE_URL=postgres://... bash apps/backend/src/scripts/faculty-index-usage.sh
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE relname LIKE 'faculty%'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- Slow faculty statements (requires pg_stat_statements)
SELECT
  calls,
  round(total_exec_time::numeric, 1) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  left(query, 160) AS query_preview
FROM pg_stat_statements
WHERE query ILIKE '%faculty%'
ORDER BY mean_exec_time DESC
LIMIT 25;
SQL
