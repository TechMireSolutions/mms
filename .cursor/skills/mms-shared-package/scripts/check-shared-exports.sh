#!/usr/bin/env bash
set -euo pipefail

# MMS Shared Package Pure SSOT Boundary Auditor
echo "🔍 Checking @mms/shared SSOT Purity & Boundaries..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT_DIR"

SHARED_SRC="packages/shared/src"

if [[ ! -d "$SHARED_SRC" ]]; then
  echo "✗ Shared source directory not found at $SHARED_SRC"
  exit 1
fi

echo "• Verifying zero banned imports in @mms/shared..."
node -e '
const fs = require("node:fs");
const path = require("node:path");

const sharedDir = path.resolve("packages/shared/src");

function scanDir(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanDir(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(fullPath);
    }
  }
  return files;
}

const bannedPackages = [
  "react",
  "react-dom",
  "fastify",
  "drizzle-orm",
  "pg",
  "postgres",
  "redis",
  "ioredis",
  "bullmq",
  "pino"
];

const files = scanDir(sharedDir);
let violations = 0;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const pkg of bannedPackages) {
    const regex = new RegExp(`from\\s+[\x27\x22]${pkg}(?:/[^\x27\x22]*)?[\x27\x22]`, "g");
    if (regex.test(content)) {
      console.error(`✗ Boundary violation in ${path.relative(process.cwd(), file)}: forbidden import of "${pkg}"`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\nFound ${violations} purity violations in @mms/shared!`);
  process.exit(1);
}
console.log(`  All ${files.length} files in @mms/shared adhere to pure SSOT boundary.`);
'

echo "✅ @mms/shared SSOT boundary verified cleanly!"
