#!/usr/bin/env bash
# Apply GitHub branch ruleset + production environment protections for MMS.
# Requires repo admin (or org admin). Current push-only collaborators get 403/404.
#
# Usage:
#   bash scripts/ci/apply-github-branch-protections.sh
#   OWNER=Techmire-Solutions REPO=mms CODEOWNER_LOGIN=hasnainwasaya88 \
#     bash scripts/ci/apply-github-branch-protections.sh
#
# What it configures:
#   - Ruleset "main: PR + CI Gate": 1 approval, CODEOWNERS review, strict CI Gate,
#     squash-only merges, no force-push/delete of default branch
#   - Repo: delete_branch_on_merge=true
#   - Environment "production": required reviewer (CODEOWNER), protected-branch deploys only
#   - Prints how to enable secret scanning + push protection in the UI if API lacks scope
set -euo pipefail

OWNER="${OWNER:-Techmire-Solutions}"
REPO="${REPO:-mms}"
CODEOWNER_LOGIN="${CODEOWNER_LOGIN:-hasnainwasaya88}"
RULESET_NAME="main: PR + CI Gate"
CI_GATE_CONTEXT="CI Gate (All Checks Passed)"
# GitHub Actions app id used by existing ruleset status checks
ACTIONS_INTEGRATION_ID="${ACTIONS_INTEGRATION_ID:-15368}"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required" >&2
  exit 1
fi

echo "Resolving CODEOWNER user id for @${CODEOWNER_LOGIN}..."
CODEOWNER_ID="$(gh api "users/${CODEOWNER_LOGIN}" --jq .id)"
echo "  id=${CODEOWNER_ID}"

echo "Looking up existing ruleset by name..."
RULESET_ID="$(
  gh api "repos/${OWNER}/${REPO}/rulesets" --jq \
    --arg name "$RULESET_NAME" \
    '.[] | select(.name == $name) | .id' | head -n1
)"

RULESET_BODY="$(cat <<EOF
{
  "name": "${RULESET_NAME}",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["squash"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          {
            "context": "${CI_GATE_CONTEXT}",
            "integration_id": ${ACTIONS_INTEGRATION_ID}
          },
          {
            "context": "PR Title (Conventional Commits)",
            "integration_id": ${ACTIONS_INTEGRATION_ID}
          }
        ]
      }
    }
  ]
}
EOF
)"

if [[ -n "$RULESET_ID" ]]; then
  echo "Updating ruleset id=${RULESET_ID}..."
  echo "$RULESET_BODY" | gh api --method PUT "repos/${OWNER}/${REPO}/rulesets/${RULESET_ID}" --input -
else
  echo "Creating ruleset..."
  echo "$RULESET_BODY" | gh api --method POST "repos/${OWNER}/${REPO}/rulesets" --input -
fi

echo "Enabling delete_branch_on_merge..."
gh api --method PATCH "repos/${OWNER}/${REPO}" \
  -f delete_branch_on_merge=true \
  -f allow_squash_merge=true \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false >/dev/null

echo "Updating production environment reviewers + protected-branch policy..."
gh api --method PUT "repos/${OWNER}/${REPO}/environments/production" --input - <<EOF
{
  "wait_timer": 0,
  "prevent_self_review": false,
  "reviewers": [{"type": "User", "id": ${CODEOWNER_ID}}],
  "deployment_branch_policy": {
    "protected_branches": true,
    "custom_branch_policies": false
  }
}
EOF

echo
echo "✅ Branch / environment protections applied."
echo
echo "Still verify in GitHub UI (API may lack scope):"
echo "  Settings → Code security → Secret scanning + Push protection → Enable"
echo "  https://github.com/${OWNER}/${REPO}/settings/security_analysis"
echo
echo "Confirm ruleset:"
echo "  gh api repos/${OWNER}/${REPO}/rulesets --jq '.[] | {id,name}'"
