#!/usr/bin/env bash
# Validate a Conventional Commits subject (commit message or PR title).
# Shared by .githooks/commit-msg and CI (pr-title job).
# Usage: bash scripts/ci/validate-conventional-commit.sh <subject-line>
set -euo pipefail

subject="${1:-}"
if [[ -z "$subject" ]]; then
  echo "Usage: bash scripts/ci/validate-conventional-commit.sh <subject-line>" >&2
  exit 2
fi

# Allow automated/special commits (merge bots, revert PRs, etc.)
if [[ "$subject" =~ ^(Merge|Revert|fixup!|squash!) ]]; then
  exit 0
fi

# Same type set as .githooks/commit-msg — https://www.conventionalcommits.org
pattern="^(feat|fix|chore|refactor|perf|test|docs|ci|build|style|revert)(\([a-zA-Z0-9_.-]+\))?: .+"
if ! [[ "$subject" =~ $pattern ]]; then
  echo "❌ Invalid Conventional Commits subject." >&2
  echo "Expected: type(scope): description" >&2
  echo "Valid types: feat, fix, chore, refactor, perf, test, docs, ci, build, style, revert" >&2
  echo "Example: feat(contacts): add keyset pagination support" >&2
  echo "Received: '$subject'" >&2
  exit 1
fi

echo "✅ Conventional Commits subject OK: $subject"
