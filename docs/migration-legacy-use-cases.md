# Migration Plan — Legacy Modules to Use-Case + Repository-Interface Pattern

## Goal

Bring the remaining ~10 tenant modules onto the target backend architecture defined in
`.agent/skills/mms-code-review/SKILL.md`:

> `routes → use-cases (repo DI) → repository interface → adapter`

The **reference pattern is `contacts`** (already migrated): `contacts/use-cases/contactUseCases.ts`
(exposes a `createContactsUseCases(repo: ContactsRepository = contactsRepository)` composition root
whose default instance is `contactUseCases`), `contacts/repository/contactsRepository.ts` (the
`ContactsRepository` interface) and `contacts/repository/contactsRepositoryAdapter.ts` (the Drizzle
adapter). Routes consume the use-cases facade; the repository interface is the sole storage gateway and
is fake-injectable for tests.

## Current state

**Migrated (reference):** `contacts`, `students`, `teachers`.
**Legacy (~10 modules):** `hasanat`, `obligations`, `messaging`, `attendance`, `examinations`,
`questionBank`, `enrollments`, `sessions`, `accounting`, `finance`, `users`.

Today these legacy modules route → `services/<module>Service.ts` → concrete functions in
`db/repositories/<module>Repository.ts`. There is **no** repository interface and **no** use-case DI
(services import concrete repo functions directly, so they are not fake-testable at the seam). The
storage-gateway invariant already holds (no Drizzle/pg in route handlers) — this is an architecture
conformance gap, not a functional defect.

## Principles (non-negotiable)

1. **Behavior-preserving.** Each step keeps existing HTTP status codes, response bodies, RBAC gates,
   idempotency, and soft-delete semantics byte-for-byte. Do one module at a time; green tests gate each.
2. **Repository interface is the sole gateway.** No new Drizzle usage inside use-cases/routes; the
   adapter owns all SQL.
3. **DI at the composition root.** `create<Module>UseCases(repo)` factory + default instance, mirroring
   contacts, so unit tests can pass a fake repo.
4. **`withTenant` unchanged.** All reads/writes stay inside `withTenant(tenantId, …)` transactions.
5. **No drive-by refactors.** Touch only the module under migration and its tests.

## Recommended order (lowest → highest risk)

| Phase | Module | Notes |
|---|---|---|
| 1 | `sessions`, `enrollments` | Narrow surface, direct CRUD contract routers |
| 2 | `finance` | Invoice/payment CRUD; test fee reconciliation paths |
| 3 | `attendance` | Hot write path + bulk upsert; keep idempotency |
| 4 | `hasanat`, `questionBank`, `examinations` | Denomination/batch & bulk soft-delete semantics |
| 5 | `obligations`, `accounting` | Ledger double-entry — highest data-risk; add `inject()` tests first |
| 6 | `messaging`, `users` | RBAC + idempotency heavy; users already has `handleUserRouterError` helper |

## Step template (per module)

1. **Extract the repository interface.**
   - Create `apps/backend/src/<module>/repository/<module>Repository.ts` declaring the interface,
     derived from the existing `db/repositories/<module>Repository.ts` exports used by the service
     (list/create/update/delete/bulk/softDelete/restore/metrics/aggregates as applicable).
   - Create `<module>RepositoryAdapter.ts` implementing the interface by delegating to the existing
     concrete repo functions (no SQL rewrite in the first pass — preserve queries).
   - Re-export a default adapter instance.

2. **Create the use-cases facade.**
   - Create `apps/backend/src/<module>/use-cases/<module>UseCases.ts` with
     `create<Module>UseCases(repo: <Module>Repository = <module>RepositoryAdapter)` and a default
     `export const <module>UseCases = create<Module>UseCases()`.
   - Map each use-case method to the corresponding service logic. Prefer moving the domain logic from
     the legacy `services/<module>Service.ts` into the use-case (service may stay as a thin re-export
     temporarily, or be retired once no route imports it).

3. **Rewire the route.**
   - Replace `services/<module>Service` imports in `routes/tenant/<module>*.ts` with the use-cases
     facade (same method names where possible to minimize churn).

4. **Tests.**
   - Add/keep `__tests__/<module>.integration.test.ts` `inject()` allow+deny tests (tenant isolation,
     RBAC, error status codes). Add a unit test for the use-case with a **fake repository** to prove DI.
   - Confirm the existing integration suite is green before/after.

5. **Clean-up.**
   - Delete or mark-retired the legacy `db/repositories/*` concrete repo only after the adapter fully
     supersedes it and all references are migrated (keep the adapter as the single adapter).
   - Update the Open Gaps Register in `.agent/rules/mms-migration-status.md` and this doc's checklist.

## Verification gate

```bash
pnpm typecheck
pnpm --filter mms-backend test          # affected module integration tests
cd apps/backend && pnpm lint --quiet
```

Each module's PR must show: repository interface + adapter, use-cases facade with DI factory, route
rewired to the facade, and green unit + inject tests. No behavior change.

## Checklist tracking

- [ ] sessions
- [ ] enrollments
- [ ] finance
- [ ] attendance
- [ ] hasanat
- [ ] questionBank
- [ ] examinations
- [ ] obligations
- [ ] accounting
- [ ] messaging
- [ ] users
