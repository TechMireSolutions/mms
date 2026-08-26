---
description: Review MMS changes against project rules and migration status
---

# Workflow: Code Review

This workflow guides the systematic review of codebase changes (e.g., Pull Requests or local diffs) to ensure strict adherence to MMS project standards and prevent technical debt regression.

## Phase 1: Context & Rule Loading

- [ ] **Load review skill**: Invoke the `mms-code-review` skill to prepare for the review process.
- [ ] **Load always-on rules**: Review the core guidelines by reading `rules/antigravity-global.md`, `rules/mms-core.md`, `rules/mms-migration-status.md`, and `rules/mms-completion-review.md`.
- [ ] **Load scoped rules**: Identify the domain of the changes and load relevant scoped rules (e.g., `rules/mms-dry.md`, `rules/mms-dependencies.md`).

## Phase 2: Automated Checks

- [ ] **Run static analysis**: Execute the following commands to catch low-hanging fruit before manual review:
  ```bash
  pnpm typecheck
  cd apps/frontend && pnpm lint
  cd apps/backend && pnpm lint
  ```
- [ ] **Run tests**: If applicable, run `pnpm test` for the affected packages or apps.

## Phase 3: Diff Analysis

- [ ] **Check against rules**: Review the diff against the checklists found in `skills/mms-code-review/SKILL.md` (paying special attention to soft-delete mechanisms and Gold Standard §7 layout rules).
- [ ] **Audit debt regressions**: Cross-reference changes with `rules/mms-migration-status.md`. Ensure no "Recently Resolved" technical debt items are being reintroduced.
- [ ] **Evaluate DRY violations**: Check if any duplicated logic should be extracted to `@mms/shared` or local UI primitives.

## Phase 4: Report Generation

Format your review output clearly, categorizing findings by severity. Do not output the entire file content; point to specific lines or files.

### Finding Classifications

- **Critical** — Blockers that must be fixed before merge (e.g., build failures, severe security flaws, type errors).
- **Major** — Significant rule violations that spread debt or architectural flaws (e.g., missing RLS checks, incorrect query invalidation).
- **Minor** — Style nits, optional DRY extractions, or minor optimizations.

---

> [!IMPORTANT]
> **Zero-Regression Policy**
> If the review uncovers newly introduced violations of existing standards, flag them as **Major** or **Critical**. Do not let technical debt accumulate in new feature work.
