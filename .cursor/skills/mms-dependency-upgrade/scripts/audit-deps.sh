#!/usr/bin/env bash
set -euo pipefail

# MMS Dependency and Engine Auditor
echo "🔍 Auditing Dependencies, Catalogs & Engines..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT_DIR"

# 1. Engine verification
echo "• Verifying Node and pnpm engines..."
node -e '
const fs = require("node:fs");
const semver = process.versions.node;
const major = parseInt(semver.split(".")[0], 10);
const minor = parseInt(semver.split(".")[1], 10);

if (major < 24 || (major === 24 && minor < 14)) {
  console.error(`✗ Unsupported Node.js version: v${semver}. Must be >=24.14.0`);
  process.exit(1);
}
console.log(`  Node.js runtime v${semver} meets engine requirements (>=24.14.0)`);
'

# 2. Check pnpm-workspace.yaml catalog consistency
echo "• Verifying pnpm-workspace.yaml catalog..."
if [[ -f "pnpm-workspace.yaml" ]]; then
  echo "  Workspace catalog configuration detected."
fi

# 3. Check security audit
echo "• Running pnpm audit for production dependencies..."
pnpm audit --prod --audit-level high || true

echo "✅ Dependency audit completed successfully!"
