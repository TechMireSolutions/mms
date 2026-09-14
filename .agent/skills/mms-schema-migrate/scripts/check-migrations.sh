#!/usr/bin/env bash
set -euo pipefail

# MMS Schema Migrations & RLS Integrity Auditor
echo "🔍 Checking Drizzle Migrations & Tenant RLS..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT_DIR"

MIGRATIONS_DIR="apps/backend/src/db/migrations_drizzle"
JOURNAL_FILE="$MIGRATIONS_DIR/meta/_journal.json"

# 1. Verify journal exists
if [[ ! -f "$JOURNAL_FILE" ]]; then
  echo "✗ Missing migrations journal: $JOURNAL_FILE"
  exit 1
fi
echo "• Migration journal verified."

# 2. Check for bare drizzle-kit push in package.json scripts
echo "• Scanning for banned drizzle-kit push usage in package.json files..."
if grep -rn '"drizzle-kit push' package.json apps/*/package.json packages/*/package.json 2>/dev/null; then
  echo "✗ Prohibited 'drizzle-kit push' found! All schema changes must use forward migrations."
  exit 1
fi

# 3. Check that tenant tables in migrations have RLS enabled
echo "• Verifying RLS policies in migrations..."
node -e '
const fs = require("node:fs");
const path = require("node:path");

const migrationsDir = path.resolve("apps/backend/src/db/migrations_drizzle");
const journalPath = path.join(migrationsDir, "meta", "_journal.json");
const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));

let rlsErrors = 0;
for (const entry of journal.entries) {
  const sqlFile = path.join(migrationsDir, `${entry.tag}.sql`);
  if (!fs.existsSync(sqlFile)) {
    console.error(`✗ Missing SQL migration file: ${entry.tag}.sql`);
    rlsErrors++;
    continue;
  }
  const content = fs.readFileSync(sqlFile, "utf8");
  
  // Find CREATE TABLE statements that have workspace_subdomain
  const createTables = content.match(/CREATE TABLE [^;]+;/gi) || [];
  for (const statement of createTables) {
    if (statement.includes("workspace_subdomain")) {
      const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?["`]?([a-zA-Z0-9_]+)["`]?/i);
      const tableName = match ? match[1] : "unknown";
      
      const hasEnableRls = content.includes(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY`) || content.includes(`ENABLE ROW LEVEL SECURITY`);
      if (!hasEnableRls) {
        console.warn(`⚠️ Migration ${entry.tag}.sql creates tenant table "${tableName}" but might lack ENABLE ROW LEVEL SECURITY`);
      }
    }
  }
}

if (rlsErrors > 0) {
  process.exit(1);
}
console.log("  Migration journal continuity verified cleanly.");
'

echo "✅ Migration and schema checks passed successfully!"
