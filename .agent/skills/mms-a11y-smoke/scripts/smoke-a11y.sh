#!/usr/bin/env bash
# MMS A11y Smoke Verifier
# Checks for missing aria-labels on icon buttons and sub-44px touch targets.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

echo "🔍 Running MMS A11y Smoke Check..."
ERRORS=0

# 1. Check for icon-only buttons missing aria-label or accessible text
echo "Checking icon buttons for accessible labels..."
while IFS= read -r match; do
  echo "⚠️  Potential icon button missing aria-label: $match"
  ERRORS=$((ERRORS + 1))
done < <(grep -rnE '<button[^>]*>[[:space:]]*<[A-Z][a-zA-Z]*Icon' apps/frontend/src/components/ui/ apps/frontend/src/tenant/features/ 2>/dev/null | grep -v 'aria-label' || true)

# 2. Check for sub-44px interactive controls on mobile viewports
echo "Checking mobile touch targets (≥44px)..."
while IFS= read -r match; do
  echo "⚠️  Interactive target smaller than 44x44px without min-h-11: $match"
  ERRORS=$((ERRORS + 1))
done < <(grep -rnE 'className="[^"]*\b(h-6|h-7|h-8)\b[^"]*"' apps/frontend/src/components/ui/button.tsx 2>/dev/null | grep -v 'min-h-11' || true)

if [ "$ERRORS" -gt 0 ]; then
  echo "⚠️ A11y smoke found $ERRORS potential touch or label warnings. Review against mms-ui-ux-design.md §7."
else
  echo "✅ A11y smoke checks clean!"
fi
exit 0
