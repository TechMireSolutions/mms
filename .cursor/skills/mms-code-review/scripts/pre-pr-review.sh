#!/usr/bin/env bash
# MMS Pre-PR Quality & Completion Review Verifier
# Runs mandatory automated gates per mms-completion-review.md.
# MMS_CI_SCOPE=affected (set by scripts/ci/local-ci.sh) narrows typecheck to
# turbo --affected vs MMS_CI_BASE and lint to the paths in MMS_CI_CHANGED.
set -euo pipefail
SCOPE="${MMS_CI_SCOPE:-full}"

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

echo "=================================================="
echo "🚀 Starting MMS Pre-PR Automated Verification"
echo "=================================================="

echo "Step 0: Staged Secrets Check..."
pnpm run check:secrets

echo "Step 1: Rules & Skills Integrity Check..."
node scripts/verify-rules-integrity.mjs

echo "Step 2: Migration Index Quality Check..."
pnpm run check:migration-indexes

echo "Step 3: Database Projection Hygiene Check..."
pnpm run check:db-projections

echo "Step 4: Code Norms Ratchet (Any, Hex, 300 LOC, @theme)..."
pnpm run check:code-norms

echo "Step 5: Work Directory Convergence Ratchet (DataTable, viewMode)..."
pnpm run check:work-directory

if [[ "$SCOPE" == "affected" ]]; then
  echo "Step 6: TypeScript Strict Typecheck (affected packages vs ${MMS_CI_BASE:-main})..."
  TURBO_SCM_BASE="${MMS_CI_BASE:-main}" pnpm exec turbo run typecheck --affected

  echo "Step 7: ESLint (changed files only)..."
  printf '%s
' "${MMS_CI_CHANGED:-}" | bash scripts/ci/lint-changed.sh
else
  echo "Step 6: TypeScript Strict Typecheck..."
  pnpm typecheck

  echo "Step 7: Monorepo ESLint Quality Check..."
  pnpm lint
fi

echo "=================================================="
echo "✨ All automated completion review checks passed!"
echo "=================================================="
exit 0
