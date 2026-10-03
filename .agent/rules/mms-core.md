---
trigger: always_on
description: MMS core invariants, security, boundaries, and limits
---

# MMS Core Invariants

## 1. Critical Invariants
- **Protected Zones:** Never edit migrations, auth middleware, CI/CD, or root configs without explicit consent.
- **Tenant Isolation:** Enforce RLS (`SET LOCAL app.current_tenant`) + `can()`. Never trust client IDs.
- **Data Safety:** RFC 8785 JSON audit outbox; soft-delete (`WHERE deleted_at IS NULL`); forward-only DDL.

## 2. Boundaries & Limits
- **Layers:** `@mms/shared` = pure types/DTOs. TanStack Query server authority. Zero cross-feature imports.
- **Limits:** Strict TypeScript (zero `any`, no unsafe casts). 200 LOC hard cap per source file.

## 3. Workflow Discipline
- **Execution:** Surgical diffs only. Zero filler prose. Never commit/push unless asked. Run `pnpm typecheck`.
