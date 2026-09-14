---
name: mms-code-review
description: Reviews a concrete change set (PR or local diff) against MMS rules before merge — severity triage, rule citations, and a merge/no-merge verdict. Use when a specific diff must be accepted or rejected before merge. Do NOT use for finding and fixing a security weakness (use mms-backend-security), for authoring a new module (use mms-module-page), or for running the browser test suites (use mms-testing-e2e).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-15
allowed-tools: Read Grep Glob Bash(pnpm typecheck) Bash(pnpm lint) Bash(pnpm test) Bash(bash scripts/pre-pr-review.sh)
---

# MMS Code Review

**Rule (norms SSOT):** `mms-completion-review.md` · `mms-core.md` · `mms-structure-naming.md` · `mms-performance.md`.

Agent self-review after edits → also follow always-on `mms-completion-review.md`.

**When X → skill Y (deep dive, not this index):** FormModal / Zod forms → **`mms-form-architecture`** · Query factories → **`mms-query-factories`** · axe / focus-return → **`mms-a11y-smoke`** · deps bumps → **`mms-dependency-upgrade`** · DDL → **`mms-schema-migrate`** · CSRF/cookies → **`mms-backend-security`** · backup wipe → **`mms-backup-restore`** · Soft-delete → **`mms-soft-delete`**.

The full pre-merge checklist (12 subsections, per-surface items) is a lookup, not a narrative: **`references/checklist.md`**. Work it top-to-bottom for the surfaces the diff actually touches — shared/lib, hooks/Query, forms, Work tier, setup, backend, DB/RLS, security, i18n/a11y, tests, performance, rules/mirrors.

## Modern practices (pointers only)

| When reviewing… | Owner |
|-----------------|--------|
| Keyset/cursor vs OFFSET lists | `mms-data-layer.md` · **`mms-backend-api`** / **`mms-query-factories`** |
| Contested PUT / `updated_at` → 409 | `mms-api-interface.md` §6 · **`mms-backend-api`** |
| `sql.raw` / statement_timeout | `mms-data-layer.md` · **`mms-schema-migrate`** / **`mms-backend-api`** |
| Dense table virtualization | `@tanstack/react-virtual` — `mms-ui-ux-design.md` · **`mms-module-work`** · `mms-performance.md` |
| List pending a11y (`aria-busy`) | `mms-ui-ux-design.md` · **`mms-a11y-smoke`** |
| Query `placeholderData: (prev) => prev` | `mms-data-layer.md` · **`mms-query-factories`** |
| Zero queries in loops (N+1) | `mms-performance.md` · **`mms-backend-api`** |
| Zero wildcard projections (`SELECT *`) | `mms-performance.md` · **`mms-data-layer.md`** |
| Redis multi-tier caching & invalidation | `mms-performance.md` · **`mms-backend-api`** |
| Performance savings documentation | `mms-performance.md` · **`mms-code-review`** |
| bodyLimit / outbound `AbortSignal.timeout` / idempotency↔body | `mms-api-interface.md` · **`mms-backend-api`** |
| Title Case skip ar/ur/fa / RTL prose | `mms-structure-naming.md` · **`mms-shared-package`** |
| Messaging send idempotency digest | `mms-api-interface.md` §6 · **`mms-messaging`** |
| Audit trail 5 dimensions & RFC 8785 canonical JSON | `mms-data-layer.md` §5 · `mms-auth-security.md` §5 · **`mms-audit-trail`** |
| Sharded hash chains & Merkle rollups | `mms-performance.md` §1 · **`mms-audit-trail`** |
| Crypto-shredding & right-to-erasure | `mms-auth-security.md` §5 · **`mms-audit-trail`** |
| Monthly date partition detachment & WORM cold tier | `mms-ops-infrastructure.md` §5 · `mms-data-layer.md` §5 · **`mms-audit-trail`** |
| Auditing the Auditor & compliance exports | `mms-reports.md` §9 · **`mms-audit-trail`** |
| INSERT-only audit privileges & pgAudit pairing | `mms-auth-security.md` §5 · **`mms-audit-trail`** |
| Soft-delete invariants & 3-tier index strategy | `mms-data-layer.md` §6 · `mms-module-architecture.md` §6 · **`mms-soft-delete`** |
| Uniqueness-on-restore 23505 trap & partial unique indexes | `mms-data-layer.md` §6 · `mms-backend-api` · **`mms-soft-delete`** |
| Session revocation on user soft-delete | `mms-auth-security.md` · `mms-backend-security` · **`mms-soft-delete`** |
| Scheduled retention hard-purge worker (LIMIT 500 SKIP LOCKED) | `mms-data-layer.md` §6 · `mms-background-jobs` · **`mms-soft-delete`** |
| Active foreign key guarding on writes | `mms-data-layer.md` §6 · `mms-form-architecture` · **`mms-soft-delete`** |
| Outbox CDC tombstones with monotonic versioning | `mms-data-layer.md` §6 · **`mms-soft-delete`** |

## Review order

1. Automated gates (`pnpm typecheck`, scoped lint/tests)
2. Security / tenant / RBAC
3. Data layer (Query vs legacy, bulk upsert, RLS)
4. Module §7 gold-standard (+ messaging variants when touched)
5. i18n / a11y (axe smoke via `mms-a11y-smoke` when shells/primitives change)
6. Scope creep

## Automated checks

```bash
pnpm typecheck
pnpm test
cd apps/frontend && pnpm lint
cd apps/backend && pnpm lint
```

E2E when touching auth/routing/onboard: `pnpm test:e2e` (critical path: `e2e/tests/platform-onboarding.spec.ts`)

## Severity

- **Critical:** security bypass, missing `authenticateTenant`, cross-tenant leak, bulk wipe PUT, data loss, breaking audit hash chains
- **Major:** missing RBAC on writes, raw `fetch('/api')`, dual data paths, broken migration journal, nested `ContactConfigProvider`
- **Minor:** style, optional DRY, residual `role ===` in untouched files

## References

## Script

`scripts/pre-pr-review.sh` runs the deterministic gate set before you review by hand:

```bash
bash scripts/pre-pr-review.sh
```

It runs the standards verifier, the migration-index and DB-projection ratchets, `pnpm typecheck` and `pnpm lint`. It does **not** run tests, e2e, or gitleaks — add `pnpm test` / `pnpm test:e2e` for the areas you touched, and remember CI scans the full git history for secrets.

- Rules: `mms-api-interface.md`, `mms-data-layer.md`, `mms-hooks.md`, `mms-ui-ux-design.md`, `mms-auth-security.md`, `mms-form-architecture.md`, `mms-messaging.md`, `mms-migration-status.md`, `mms-performance.md`
- Skills: `mms-frontend`, `mms-backend-api`, `mms-backend-security`, `mms-soft-delete`, `mms-audit-trail`, `mms-form-architecture`, `mms-query-factories`, `mms-schema-migrate`, `mms-backup-restore`, `mms-a11y-smoke`, `mms-dependency-upgrade`, `mms-messaging`

