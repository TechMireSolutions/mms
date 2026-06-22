---
description: Review MMS changes against project rules and migration status
---

# Workflow: Code Review

## Steps

1. Load skill: `mms-code-review`
2. Load always-on rules: `antigravity-global`, `mms-core`, `mms-migration-status`
3. Run checks:
   ```bash
   pnpm typecheck
   cd apps/frontend && pnpm lint
   ```
4. Review diff against checklist in `skills/mms-code-review/SKILL.md`
5. Classify findings: Critical / Major / Minor
6. Note any new violations of migration-status table

## Output format

- **Critical** — must fix before merge
- **Major** — rule violations that spread debt
- **Minor** — style or optional DRY
