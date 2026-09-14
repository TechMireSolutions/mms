#!/usr/bin/env bash
# MMS Pre-PR Quality & Completion Review Verifier
# Runs mandatory automated gates per mms-completion-review.md.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

echo "=================================================="
echo "🚀 Starting MMS Pre-PR Automated Verification"
echo "=================================================="

echo "Step 1: Rules & Skills Integrity Check..."
node scripts/verify-rules-integrity.mjs

echo "Step 2: Migration Index Quality Check..."
pnpm run check:migration-indexes

echo "Step 3: Database Projection Hygiene Check..."
pnpm run check:db-projections

echo "Step 4: TypeScript Strict Typecheck..."
pnpm typecheck

echo "=================================================="
echo "✨ All automated completion review checks passed!"
echo "=================================================="
exit 0
