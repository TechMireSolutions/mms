#!/usr/bin/env bash
set -euo pipefail

# MMS @mms/shared SSOT purity auditor.
#
# Fails when the shared package imports a runtime it must not depend on
# (React/Fastify/DB/Redis/Pino) or touches DOM/Node-only globals. The package
# must stay a pure, environment-agnostic leaf so both apps can consume it.
echo "🔍 Checking @mms/shared SSOT purity & boundaries…"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT_DIR"

SHARED_SRC="packages/shared/src"
if [[ ! -d "$SHARED_SRC" ]]; then
  echo "✗ Shared source directory not found at $SHARED_SRC"
  exit 1
fi

node -e '
const fs = require("node:fs");
const path = require("node:path");

const sharedDir = path.resolve("packages/shared/src");

function scanDir(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(scanDir(full));
    else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) files.push(full);
  }
  return files;
}

const BANNED_PACKAGES = [
  "react", "react-dom", "fastify", "drizzle-orm", "pg", "postgres",
  "redis", "ioredis", "bullmq", "pino",
];

// Environment-bound globals/APIs: @mms/shared is consumed by both the browser
// bundle and the Node backend, so it may not touch either runtime directly.
const BANNED_USAGE = [
  { pattern: /\bdocument\s*\./, label: "document.* (DOM)" },
  { pattern: /\bwindow\s*\./, label: "window.* (DOM)" },
  { pattern: /\blocalStorage\b/, label: "localStorage" },
  { pattern: /\bsessionStorage\b/, label: "sessionStorage" },
  { pattern: /from\s+["\x27]node:/, label: "node: builtin import" },
  { pattern: /from\s+["\x27](fs|path|crypto|os|child_process)["\x27]/, label: "unprefixed Node builtin import" },
];

const files = scanDir(sharedDir);
let violations = 0;

for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  const content = fs.readFileSync(file, "utf8");

  for (const pkg of BANNED_PACKAGES) {
    const regex = new RegExp(`from\\s+["\x27]${pkg}(?:/[^"\x27]*)?["\x27]`);
    if (regex.test(content)) {
      console.error(`✗ Boundary violation in ${rel}: forbidden import of "${pkg}"`);
      violations++;
    }
  }

  for (const { pattern, label } of BANNED_USAGE) {
    if (pattern.test(content)) {
      console.error(`✗ Purity violation in ${rel}: ${label}`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\nFound ${violations} purity violation(s) in @mms/shared.`);
  console.error("Move runtime-specific logic to apps/frontend or apps/backend instead (mms-shared-package, mms-dry.md).");
  process.exit(1);
}
console.log(`  All ${files.length} files in @mms/shared stay pure (no DOM, React, Fastify, DB, Redis, or Node builtins).`);
'

echo "✅ @mms/shared SSOT boundary verified cleanly."
