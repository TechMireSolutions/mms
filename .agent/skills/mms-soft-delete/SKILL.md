---
name: mms-soft-delete
description: Implements, verifies, or audits the MMS Soft-Delete System — column quintuple, 3-tier index strategy, partial unique indexes, BEFORE DELETE triggers, RLS policies, dynamic query ASTs, Drizzle relational child guardrails, REST route factories (registerResourceRoutes, registerSoftDeletableBulkTrashRoutes, handleBulkListGet), atomic conditional latches, single-record read semantics, Error 23505 traps, session invalidation, active FK guarding, outbox CDC events with monotonic versioning, frontend UX (URL search param sync ?view=trash, ModuleTrashToggle, bulk actions, detail drawer ArchivedBanner, optimistic undo toasts, retention badges, filter preservation), 4-bucket deletion taxonomy, and scheduled background hard-purge workers (LIMIT 500 SKIP LOCKED). Use when adding or changing soft-delete, trash directories, restore handlers, DDL migrations, or auditing deletion lifecycles.
---

# MMS Soft-Delete System Workflow

**Rules (norms SSOT):** `mms-data-layer.md` §6 · `mms-module-architecture.md` §6–§7 · `mms-core.md` · `mms-auth-security.md` · `mms-form-architecture.md` · `mms-performance.md`. DDL migrations → `mms-schema-migrate`. Backend API → `mms-backend-api`. Work UI → `mms-module-work`. Outbox/Audit → `mms-audit-trail`. Background Jobs → `mms-background-jobs`.

SSOT operational workflow for the soft-delete architecture across tenant workspaces and platform apex per `docs/soft-delete.md`.

---

## When to use

- Adding soft-delete, archive, or restore functionality to a new or existing module
- Writing Drizzle schemas or DDL migrations for soft-deletable tables (`softDeleteColumns` mixin, partial indexes, triggers, RLS)
- Implementing backend routes (`DELETE /:id`, `POST /:id/restore`, `POST /bulk-delete`, `POST /bulk-restore`, `GET /?includeDeleted=true`, `GET /:id?includeDeleted=true`)
- Implementing frontend Work trash UX (`viewingDeleted`, `ModuleTrashToggle`, `ModuleWorkBulkActionBar`, drawer `ArchivedBanner`, optimistic undo toast)
- Handling unique constraints on recyclable fields (`email`, `phone`, `employee_id`, slug)
- Handling account soft-deletion and immediate session invalidation
- Handling transactional outbox CDC tombstones (`entity.soft_deleted`, `entity.restored`) and cache eviction
- Auditing code against soft-delete anti-patterns and performance invariants
- Configuring compliance retention windows and background purge workers (`purgeExpiredArchivedRecords`)

---

## 1. Philosophy & 8 Mandatory Invariants

MMS prefers **soft-delete** (marking rows as archived in-place) over physical `DELETE` for all business entities.

### Core Rationale
- **Audit continuity**: Archived records remain visible in historical reports, financial ledgers, and foreign keys without orphaning rows.
- **Accidental-deletion recovery**: Users self-restore records from Work trash without administrator intervention.
- **Data authority**: Server is the single source of truth; clients never decide whether a record is purged.

### Mandatory System Invariants
1. **Pervasive Query Guarding**: A soft-delete that any read path ignores is a critical data leak. `deleted_at IS NULL` must be enforced across all reads, joins, sub-selects, metrics, and background jobs.
2. **Session Invalidation ("Not deleted until sessions die")**: When a user or staff account (`tenant_users`, `teachers`) is soft-deleted, all active sessions and refresh tokens must be revoked immediately in Redis/auth stores. Authentication resolvers (`authenticateTenant`, `/me`, OAuth, credentials) must explicitly verify `deleted_at IS NULL` to prevent zombie sessions and silent account resurrection.
3. **Database RLS Defense-in-Depth**: In addition to application query predicates, PostgreSQL Row-Level Security policies provide defense-in-depth, automatically hiding soft-deleted rows from standard tenant queries unless `app.include_deleted = 'true'` is explicitly configured.
4. **Schema-Level Hard-Delete Guard (`BEFORE DELETE` Trigger)**: Application-only discipline fails under operator error or errant scripts. PostgreSQL `BEFORE DELETE` triggers forbid physical row deletion on soft-deletable tables unless an explicit session bypass (`app.allow_hard_purge = 'true'`) is initialized by retention workers or workspace teardown.
5. **GDPR / Right-to-Erasure Boundary**: Soft-delete is for operational recovery, **not** GDPR Article 17 compliance. When Right to Erasure applies, personal data must undergo **crypto-shredding** (key destruction) paired with **in-place pseudonymization/scrubbing**; soft-delete alone does not satisfy erasure.
6. **Referential Integrity Contract**: Standard SQL foreign keys do not cascade on soft-deletes. Modules must define either:
   - **Restrict Guard (Default)**: Block soft-delete if active dependent children exist (`activeEntriesCount > 0` → 409 Conflict).
   - **Programmatic Atomic Cascade**: Soft-delete parent and children within one transaction, tagging children with `deleted_with_cascade: true`.
7. **Change Data Capture (CDC) & Outbox Tombstones**: Because soft-delete operates via SQL `UPDATE`, external search indexes (Meilisearch) and distributed caches do not detect SQL `DELETE` signals. Every soft-delete and restore must emit transactional outbox events (`entity.soft_deleted`, `entity.restored`) with monotonic versioning to drive immediate cache and search index eviction.
8. **Active Foreign Key Guarding (Dangling Reference Prevention)**: Standard SQL foreign keys validate physical row presence, not logical lifecycle state. A soft-deleted entity still exists in SQL, allowing newly created child records to reference an archived entity without an SQL FK error. Application write services and Zod validation must actively verify that referenced foreign keys point to active entities (`deleted_at IS NULL`).

**Soft-delete is mandatory for all entity tables in tenant modules.** Physical `DELETE` is strictly restricted to:
- Platform workspace teardown (`purgeTenantDataBySubdomain` with `SET LOCAL app.allow_hard_purge = 'true'`)
- Background-job temporary artifact cleanup
- Scheduled retention hard-purge workers (§11)

---

## 2. Architectural Deletion Taxonomy (4-Bucket Model)

| Bucket | Deletion Mechanism | Target Entities | Rationale & Lifecycle |
|---|---|---|---|
| **1. Soft-Delete (Audit & Recovery)** | `UPDATE SET deleted_at = NOW()` | `contacts`, `students`, `teachers`, `sessions`, `enrollments`, `finance_invoices`, `accounting_accounts` | High referential weight; user self-service restoration; historical reporting and accounting continuity. |
| **2. Ephemeral Hard-Delete** | Standard SQL `DELETE` | `question_bank_tests`, `assessment_results`, join table edges, draft forms | Scratchpad data without independent lifecycle; no incoming FKs; absence represents desired state. |
| **3. Sweeper-Driven TTL Purge** | Scheduled background worker (`lte(purge_after, NOW())`) | `message_logs`, temporary upload artifacts, idempotency records, session tokens | Time-bounded operational data; purged after retention window (§11) to prevent storage and index bloat. |
| **4. Append-Only Immutable (Never Deleted)** | `DELETE` and `UPDATE` forbidden at DB layer | `audit_trail_events`, `accounting_entries`, hash chain partitions | Forensic source of truth; regulatory compliance; tamper-evident immutability. |

---

## 3. Database Schema Layer

### 3.1 Column Quintuple (Metadata Standard)
Every soft-deletable entity table carries standard audit columns via the shared Drizzle mixin:

```ts
// apps/backend/src/db/schema/softDeleteSchema.ts (re-exported via db/schema/index.ts)
export const softDeleteColumns = {
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: varchar('deletion_reason', { length: 500 }), // capped at DB + Zod layer
  restoredAt: timestamp('restored_at', { withTimezone: true, mode: 'date' }),
  restoredBy: text('restored_by'),
  deletedWithCascade: boolean('deleted_with_cascade').default(false),
};
```

> **Type contract:** `deletedAt` and `restoredAt` must always be passed as JavaScript `Date` objects (`new Date()`) — never ISO strings. Drizzle `mode: 'date'` expects `Date | null`.

### 3.2 Three-Tier Index Strategy
1. **Category A — Trash-mode index (non-partial):** Covers `includeDeleted = true` queries.
   ```ts
   index('students_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt)
   ```
2. **Category B — Active-record partial indexes (`WHERE deleted_at IS NULL`):** Covers hot active list reads (`includeDeleted = false`).
   ```ts
   index('students_workspace_active_idx')
     .on(table.workspaceSubdomain)
     .where(sql`${table.deletedAt} is null`),
   index('students_workspace_status_updated_at_active_idx')
     .on(table.workspaceSubdomain, table.status, table.updatedAt)
     .where(sql`${table.deletedAt} is null`),
   ```
3. **Category C — Archived-record partial indexes (`WHERE deleted_at IS NOT NULL`):** Covers trash-browser filtered/paginated queries. Eliminates full table scans in trash views.
   ```ts
   index('students_workspace_deleted_records_idx')
     .on(table.workspaceSubdomain, table.deletedAt)
     .where(sql`${table.deletedAt} is not null`),
   ```

### 3.3 Partial Unique Indexes vs PostgreSQL 15+ `NULLS NOT DISTINCT`
- **Partial Unique Indexes Mandatory:** Unique constraints on recyclable natural keys (`email`, `phone`, `employee_id`, `student_id`, slug) MUST use partial unique indexes scoped to `WHERE deleted_at IS NULL`:
  ```ts
  uniqueIndex('contacts_email_active_unique')
    .on(table.workspaceSubdomain, table.email)
    .where(sql`${table.deletedAt} is null`),
  ```
  Prevents archived rows from permanently blocking re-registration of the same identifier.
- **`UNIQUE NULLS NOT DISTINCT` Strict Ban:** PostgreSQL 15 `UNIQUE NULLS NOT DISTINCT` does NOT work for soft-delete. It treats NULLs as identical, permitting only *one* active row (`deleted_at = NULL`), but strictly forbidding subsequent soft-deleted rows with `NULL` timestamps.

### 3.4 Schema-Level Hard-Delete Guard (`BEFORE DELETE` Trigger)
```sql
CREATE OR REPLACE FUNCTION forbid_hard_delete() RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.allow_hard_purge', true) = 'true' THEN RETURN OLD; END IF;
  RAISE EXCEPTION 'Hard delete forbidden on table "%", use soft-delete (UPDATE ... SET deleted_at = NOW())', TG_TABLE_NAME
    USING ERRCODE = 'check_violation';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_students_forbid_hard_delete
  BEFORE DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION forbid_hard_delete();
```
Direct `DELETE` queries fail with `check_violation`. Bypass is permitted only when authorized retention workers or workspace teardown routines execute `SET LOCAL app.allow_hard_purge = 'true'` inside their transaction.

### 3.5 Row-Level Security (RLS) Policy Specification
```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE students FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_soft_delete_isolation ON students FOR ALL
  USING (
    workspace_subdomain = current_setting('app.current_tenant', true)
    AND (deleted_at IS NULL OR current_setting('app.include_deleted', true) = 'true')
  );
```
When browsing the trash, backend route handlers execute `SET LOCAL app.include_deleted = 'true'` within the request transaction boundary after verifying delete privileges.

### 3.6 Storage Engine Mechanics & Autovacuum Tuning
- **HOT Update Ineligibility:** Because `deleted_at` is indexed across Category A and Category C indexes, setting `deleted_at = NOW()` cannot execute a Heap-Only Tuple (HOT) update. PostgreSQL must register new index pointers.
- **Category B Partial Index Eviction:** The moment a row is soft-deleted, PostgreSQL removes its pointer from the `WHERE deleted_at IS NULL` Category B index, keeping hot active-record indexes compact and cache-resident.
- **Autovacuum Tuning on High-Churn Tables:** Tables with frequent soft-delete or TTL sweeper operations (`message_logs`, `attendance_records`) must be tuned in DDL to prevent dead-tuple bloat:
  ```sql
  ALTER TABLE message_logs SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_vacuum_cost_limit = 1000);
  ```

### 3.7 Covered Entity Tables

| Schema File | Entities |
|---|---|
| `contacts.ts` | `contacts`, `tenant_users` |
| `contactTables.ts` | contact-linked lookup tables |
| `students.ts` | `students` |
| `teachers.ts` | `teachers` |
| `sessions.ts` | `sessions` |
| `enrollments.ts` | `enrollments` |
| `attendance.ts` | `attendance_records` |
| `finance.ts` | `finance_invoices`, `finance_payments` |
| `accounting.ts` | `accounting_accounts`, `accounting_fiscal_years`, `accounting_entries` |
| `obligations.ts` | `obligation_collections` |
| `hasanat.ts` | `hasanat_distributions` |
| `examinations.ts` | `exams`, `questions`, `tests`, `assessment_results` |
| `examinationQuestionBankTables.ts` | question bank entity tables |
| `messaging.ts` | `message_logs` |

---

## 4. Query Planner Optimization & Relational Guardrails

### 4.1 Static vs Dynamic Predicates (Banned Parameterized Booleans)
- **Strict Ban on Parameterized Boolean Predicates:**
  ```sql
  -- ❌ BANNED: disables Category B partial index, causes full table scan
  SELECT * FROM students WHERE workspace_subdomain = $1 AND ($2::boolean IS TRUE OR deleted_at IS NULL);
  ```
- **Mandatory Dynamic AST Construction:** In Drizzle ORM, construct query AST branches dynamically:
  ```ts
  const conditions = [eq(table.workspaceSubdomain, tenant)];
  if (!includeDeleted) {
    conditions.push(isNull(table.deletedAt));   // Directly emits "deleted_at IS NULL" -> Category B index hit
  } else {
    conditions.push(isNotNull(table.deletedAt)); // Directly emits "deleted_at IS NOT NULL" -> Category C index hit
  }
  ```

### 4.2 Drizzle Relational Query Guardrails (`db.query.*`)
Drizzle ORM relational queries (`db.query.table.findMany`) do **not** automatically apply soft-delete filters to nested relations declared in `with: { ... }`. Without explicit relational scoping, soft-deleted child rows silently leak into the parent payload:
```ts
// ❌ LEAK HAZARD: soft-deleted enrollments are loaded with active session
const sessionWithLeakedChildren = await db.query.sessions.findFirst({
  where: and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)),
  with: { enrollments: true },
});

// ✅ MANDATORY PATTERN: Explicit relational where filter on all child relations
const session = await db.query.sessions.findFirst({
  where: and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)),
  with: {
    enrollments: {
      where: (enrollments, { isNull }) => isNull(enrollments.deletedAt),
    },
  },
});
```

---

## 5. Referential Integrity: Restrict vs Atomic Cascade

### Policy A: Restrict Guard (Default for Financial & Academic Records)
If active dependent records exist, soft-delete is blocked with `409 Conflict`:
```ts
const activeEntriesCount = await db.$count(accountingEntries, and(
  eq(accountingEntries.accountId, accountId),
  isNull(accountingEntries.deletedAt),
));
if (activeEntriesCount > 0) {
  throw new ConflictError('Cannot archive account with active ledger entries');
}
```

### Policy B: Programmatic Atomic Cascade (`deleted_with_cascade`)
For modules where parent archival cascades to children (e.g. archiving a Session archives its Enrollments):
- Add `deletedWithCascade: boolean('deleted_with_cascade').default(false)` column.
- On parent soft-delete: mark children with `deletedWithCascade = true`.
- On parent restore: restore **only** children where `deletedWithCascade = true`, preserving records that were independently archived before the parent was deleted.
- **Parent Deletion vs Child Insertion Race (Orphan Guard):** When executing an atomic cascade, lock the parent row (`tx.select({ id: parent.id }).from(parent).where(...).for('update')`) before cascading to prevent concurrent child insertions from creating orphaned active records.

---

## 6. Backend Route Factories & API Interface

All soft-delete route logic flows through shared route factories. **Never hand-roll an ad-hoc `DELETE /:id` or `POST /:id/restore`.**

### 6.1 `registerResourceRoutes` (`apps/backend/src/lib/crudResourceRoutes.ts`)
- Registers `DELETE /:id` (soft-delete) and `POST /:id/restore` (restore).
- Gated on `canDelete(user)` (defaults to `canDeleteCollection(user, collection)`).
- **Atomic Conditional Latch**: Soft-delete updates must use an atomic conditional latch to prevent TOCTOU concurrent delete races:
  ```ts
  const [deleted] = await db
    .update(table)
    .set({ deletedAt: new Date(), deletedBy: userId, deletionReason: reason ?? null })
    .where(and(
      eq(table.id, id),
      eq(table.workspaceSubdomain, tenant),
      isNull(table.deletedAt), // Atomic latch: matches only if currently active
    ))
    .returning({ id: table.id });
  if (!deleted) throw new NotFoundError('Record not found or already archived');
  ```
- **Idempotency Contract**:
  - `DELETE /:id` on an already-archived record → `404 Not Found`.
  - `POST /:id/restore` on an already-active record → `404 Not Found`.

### 6.2 `registerSoftDeletableBulkTrashRoutes` (`apps/backend/src/lib/crudBulkRouteFactories.ts`)
- Registers `POST /bulk-delete` and `POST /bulk-restore` (capped at 500 IDs via `bulkIdsBodySchema`).
- **Batched Single-Statement Updates**: Implementations **must** use a single batched SQL statement (`inArray(table.id, ids)`) — per-row iteration loops ($N+1$ query pattern) are strictly banned (`mms-performance.md` §1).

### 6.3 `handleBulkListGet` (`apps/backend/src/lib/crudBulkRouteHelpers.ts`)
- Use `supportsIncludeDeleted: true` to enable trash-aware list loading.
- Uses `isQueryFlagTrue(request.query.includeDeleted)` to parse query flags safely.
- Gates `includeDeleted = true` on `canDeleteCollection(user, collection)`.
- **Ban `scopeDeleted()` in New Modules**: Never load the full table into Node.js memory to filter in application memory. Always filter at the database layer.

### 6.4 Single-Record Read Semantics (`GET /:id`)
1. **Default Read Path (`GET /:id` without flags)**:
   - Must append `isNull(table.deletedAt)`.
   - If the row exists but has `deleted_at IS NOT NULL`, the endpoint **must return `404 Not Found`**.
2. **Trash Inspection Path (`GET /:id?includeDeleted=true`)**:
   - Used exclusively by detail drawers opened from trash views.
   - Validates `canDeleteCollection(user, collection)` prior to reading → `403 Forbidden` if denied.
   - Sets `SET LOCAL app.include_deleted = 'true'` inside request transaction.

### 6.5 Uniqueness-on-Restore Contract & Error 23505 Trap
When restoring an entity that holds unique fields (`email`, `phone`, `employee_id`):
1. Pre-check for conflicting active records (`isNull(deletedAt)`).
2. Execute restore update inside a `try/catch` block.
3. Catch PostgreSQL error `23505` (`unique_violation`) and map cleanly to `409 Conflict`:
```ts
try {
  return await db.update(table)
    .set({ deletedAt: null, deletedBy: null, deletionReason: null, restoredAt: new Date(), restoredBy: userId })
    .where(and(eq(table.id, id), isNotNull(table.deletedAt)))
    .returning();
} catch (err: unknown) {
  if (typeof err === 'object' && err !== null && 'code' in err && err.code === '23505') {
    throw new ConflictError('Cannot restore record: conflicting active record was restored concurrently');
  }
  throw err;
}
```

---

## 7. `@mms/shared` Types, DTOs & Manifest

### 7.1 Request Body Schemas
Defined in `packages/shared/src/schemas/api.dto.ts`:
- `softDeleteBodySchema`: `{ deletionReason?: string.max(500) }` (.strict(), deepSanitizeStrings).
- `bulkIdsBodySchema`: `{ ids: (string | number)[].min(1).max(500), deletionReason?: string.max(500) }` (.strict()).
- `bulkStringIdsBodySchema`: String-only ID variant for UUID-based modules.

### 7.2 Write Schema Guard (Client Soft-Delete Field Stripping)
Create and update write schemas must reject or strip client-supplied soft-delete and restore keys (`deletedAt`, `deletedBy`, `deletionReason`, `restoredAt`, `restoredBy`, `deletedWithCascade`) using `.omit()` or `stripClientSoftDeleteFields`. Forms never accept or mutate lifecycle metadata directly:
```ts
// packages/shared/src/contactSoftDelete.ts
export const CLIENT_SOFT_DELETE_KEYS = [
  'deletedAt',
  'deletedBy',
  'deletionReason',
  'restoredAt',
  'restoredBy',
  'deletedWithCascade',
] as const;

export function stripClientSoftDeleteFields<T extends Record<string, unknown>>(record: T): T {
  const next = { ...record };
  for (const key of CLIENT_SOFT_DELETE_KEYS) delete next[key];
  return next;
}
```

### 7.3 Canonical Parsing & Helpers
- `isQueryFlagTrue(value: unknown): boolean` from `packages/shared/src/paginationUtils.ts`. Accepts `true`, `1`, `'true'`, `'yes'`, `' 1 '`. Use everywhere `includeDeleted` is parsed — ban ad-hoc inline ternaries.
- Export `is[Entity]Deleted(entity)` and `filterActive[Entities](entities)` in domain types.

### 7.4 Module Manifest `softDelete` Block
Every module manifest in `@mms/shared` must declare:
```ts
softDelete: {
  workExcludesDeleted:      boolean;    // true = Work list hides archived (standard)
  reportsIncludeDeleted:    boolean;    // false = Reports show only active rows
  exportsIncludeDeleted:    boolean;    // false = CSV exports exclude archived
  duplicatesIncludeDeleted?: boolean;   // false = dedup scans skip archived
  captureDeletionReason:    boolean;    // true = UI prompts for reason on archive
  retentionDays?:           number;     // null = keep indefinitely; N = purge after N days
}
```
When `captureDeletionReason: false`, the frontend **must not** render a deletion reason prompt.

---

## 8. Frontend UX Layer

### 8.1 URL Search Parameter Synchronization (`useTrashMode`)
Synchronize `viewingDeleted` with URL search parameters (`useSearchParams` with `?view=trash` or `?archived=true`) via the shared hook `useTrashMode`:
```tsx
// apps/frontend/src/hooks/useTrashMode.ts
import { useTrashMode } from '@/hooks/useTrashMode';

// Inside directory controller:
const [showDeleted, setShowDeleted] = useTrashMode();
```
`useTrashMode` supports boolean setters and functional updaters `(prev) => !prev`, synchronizes with `?view=trash`, and strictly preserves active search parameters and filter facets.
Map `viewingDeleted` to `includeDeleted` in TanStack Query keys and API fetch URLs.

### 8.2 Toolbar Controls & State Preservation
- **`ModuleTrashToggle`**: Shared UI primitive (`apps/frontend/src/components/ui/ModuleTrashToggle.tsx`). Renders with `aria-pressed={showDeleted}`. Mount inside `ModuleWorkToolbar` (not in Filters dropdown).
- **Preserve Search & Filter State**: Toggling `ModuleTrashToggle` must **preserve** active search query and facet selections. Never reset filters on toggle (`docs/soft-delete.md` §7.10).
- **Hide Add/Create & Export**: When `viewingDeleted = true`, hide the Add/Create button and Export button (per manifest `exportsIncludeDeleted: false`).
- **Keyboard Shortcut Guard**: `Cmd/Ctrl+N` (open create) must check `!viewingDeleted && canWrite` before firing.

### 8.3 Bulk Actions & Drawer Interaction
- **`ModuleWorkBulkActionBar`**: Wires `BulkSelectionDeleteAction` (when `!viewingDeleted`) and `BulkSelectionRestoreAction` (when `viewingDeleted`). Mount on the list/parent container.
- **Drawer Precedence**: When a detail drawer opens while bulk items are selected, the drawer takes visual and operational precedence. The drawer's restore action operates strictly on the single drawer entity without clearing the bulk selection.

### 8.4 Detail Drawer Archive Chrome (`DetailDrawerArchiveChrome`)
Shared primitives in `apps/frontend/src/components/ui/DetailDrawerArchiveChrome.tsx`:
- `DetailDrawerArchivedBanner`: Top-level warning banner with calculated purge countdown.
- `EntityArchivedBanner`: Domain-level wrapper with formatted title and localized deletion reason.
- `DetailDrawerRestoreOrEditAction`: Header action toggling between edit (active) and restore (archived, gated on `canDelete`).
- `RetentionCountdownBadge`: Expiry countdown badge for trash cards and tables.
- `DrawerSyncStatusFooter`: WCAG-compliant text + dot indicator for archived vs synced states.

When viewing an entity with `deletedAt != null`:
- ❌ Hide Edit button and create-style CTAs.
- ❌ Hide Call, WhatsApp, SMS, Email, and payment recording/correction mutation buttons.
- ✅ Show Restore button (gated on `canDelete`).

### 8.5 Optimistic Soft-Delete with Undo Toast (5–10s Grace Window)
Single-record deletions from directory rows hide the item immediately in the TanStack Query cache and display an instant toast with an `[Undo]` action via `notify` (`apps/frontend/src/lib/notify.ts`):
```tsx
notify.warning(t('common.recordArchived'), {
  action: (
    <Button size="sm" variant="outline" onClick={() => restoreRecord(id)}>
      {t('common.undo')}
    </Button>
  ),
  duration: 7000,
});
```

### 8.6 Retention Expiry Countdown Badge
In trash mode and archived drawers, calculate remaining retention time from `purgeAfter` or `deletedAt + retentionDays`:
- If $\le 7$ days remain: render warning badge: `⚠️ Purges in N days`.
- Standard display: `Archived on Jan 12 • Purges in N days`.
- If `retentionDays` is null: display `Archived indefinitely`.

---

## 9. Audit Trail, Outbox CDC & Forensics

### 9.1 Audit Event Emission & Hook Execution Patterns
- Audit hooks `onAfterDelete` and `onAfterRestore` log state changes.
- Include `deletionReason` in audit logs when provided.
- Bulk operations log `succeeded` and `failed` counts.
- Restore events attribute the **restoring user**, not the original deleting user.
- **Audit Hook Execution Patterns:**
  - **Option A — Fire-and-forget with structured error log (current default for non-critical modules):**
    ```ts
    onAfterDelete?.(user, id, reason).catch((err) =>
      fastify.log.error({ err, id }, 'soft-delete audit hook failed')
    );
    ```
  - **Option B — Atomic in `deleteFn` transaction (gold-standard, tamper-evident):**
    Audit write and the `UPDATE` share one database transaction — atomic, never partially applied. Preferred for person modules (`contacts`, `students`, `teachers`).
  Choose one pattern per module and document it. Never use `await` in the hook and claim it is non-blocking.

### 9.2 Transactional Outbox CDC Events & Monotonic Versioning
Inside the same transaction as the soft-delete `UPDATE`, emit an outbox record with an incremented monotonic `version` or millisecond timestamp:
- **`entity.soft_deleted`**: `{ entityType, entityId, tenantId, deletedAt, deletedBy, version: Date.now() }`.
  - Downstream search processor deletes index document (`meiliSearch.index(entityType).deleteDocument(entityId)`).
  - Downstream cache worker invalidates relevant Redis keys (`mms:{tenant}:{entityType}:...`).
- **`entity.restored`**: `{ entityType, entityId, tenantId, restoredAt, restoredBy, version: Date.now() }`.
  - Downstream search processor re-indexes entity document.
- **Idempotent Consumer Guard**: External consumers must discard events where `incomingEvent.version <= existingIndexMeta.version` to prevent out-of-order deliveries from desynchronizing search indexes.

### 9.3 Content Snapshotting on Archival (Forensics Survival)
For entities with user-authored text (student progress notes, remarks, incident logs):
When an entity is soft-deleted, the audit trail event payload **must capture the full snapshot of text and body content** at deletion time. If the entity is eventually hard-purged after its retention period, the textual forensic record remains preserved in the immutable audit trail.

---

## 10. Anti-Patterns (Banned Practices)

| Anti-Pattern | Problem | Fix |
|---|---|---|
| **Missing `WHERE deleted_at IS NULL` on read paths** | Archived rows leak into active lists, APIs, or jobs | Add predicate to every read query; Category B partial index enforces query plan alignment |
| **Referencing soft-deleted foreign key targets** | Allows ghost relationships to archived records | Validate foreign keys reference active entities (`deleted_at IS NULL`) on write |
| **Drizzle relational query without child `where`** | `db.query.table.findMany({ with: { children: true } })` leaks soft-deleted children | Explicitly specify `where: (c, { isNull }) => isNull(c.deletedAt)` on all nested relations |
| **Soft-deleting user without session revocation** | Soft-deleted user accesses API using existing JWT/session | Immediately revoke tokens and Redis sessions on soft-delete |
| **Auth resolver ignoring `deletedAt`** | Soft-deleted user signing in silently resurrects account | Gate all auth resolvers on `deleted_at IS NULL` |
| **Soft-deleting parent with active children** | Leaves orphaned children or causes data inconsistency | Implement Restrict Guard (409) or atomic cascade with `deleted_with_cascade` |
| **Standard `UNIQUE` constraint on recyclable keys** | Archived row permanently blocks reusing email/phone | Replace with `uniqueIndex(...).where(sql`deleted_at IS NULL`)` |
| **Restoring without uniqueness check & error trap** | Restoring conflicting record causes 500 or duplicates | Pre-check active conflicts and catch PostgreSQL error `23505` mapping to 409 |
| **Cascade restore without `deleted_with_cascade` flag** | Restoring parent restores independently archived records | Add `deleted_with_cascade` column; restore only cascade-flagged rows |
| **`scopeDeleted()` in new SQL-backed modules** | Full table loaded into Node memory, then filtered | Filter at DB layer with `WHERE deleted_at IS NULL/NOT NULL` |
| **Parameterized boolean in query predicate** | `$2::boolean IS TRUE OR deleted_at IS NULL` breaks Category B index | Construct dynamic AST branches in Drizzle |
| **Direct SQL `DELETE` without trigger bypass** | Fails with `check_violation` from trigger | Use `UPDATE ... SET deleted_at = NOW()` or set `app.allow_hard_purge = 'true'` in purge job |
| **Omitting monotonic versioning on Outbox CDC events** | Rapid delete-restore processed out of order corrupts search index | Include monotonic `version`; discard stale events in consumer |
| **Inline `includeDeleted` ternary instead of `isQueryFlagTrue`** | Non-standard query values silently misparsed | Use `isQueryFlagTrue(query.includeDeleted)` everywhere |
| **Soft-deleting secrets / tokens / credentials** | Compromised credentials remain in DB | Revoke/delete secrets immediately; do not soft-delete credentials |
| **Unbounded single-transaction hard purge** | Purging thousands of rows causes WAL spikes and lock contention | Chunk deletions in batches of 500 using `LIMIT 500 FOR UPDATE SKIP LOCKED` |
| **`purgeArchivedRecords` running inline in HTTP handler** | Blocks response thread; risks partial timeout | Always run purge as an isolated background job |
| **Not emitting audit event before hard purge** | Leaves no trace that purged rows ever existed | Emit `entity.hard_purge` audit event inside transaction before `DELETE` |

---

## 11. Retention, Hard-Purge & GDPR Article 17 Erasure

### 11.1 GDPR Article 17 Dual-Track Erasure Protocol
Soft-delete alone is **not** compliant with GDPR Article 17 (Right to Erasure). Hard `DELETE` is also banned because it breaks ledger and certification integrity.
Execute within an atomic transaction:
1. **Cryptographic Shredding**: Destroy per-subject KMS envelope keys; encrypted fields (`custom_data`) become undecipherable mathematical noise across databases and backups.
2. **In-Place Pseudonymization / Scrubbing**: Overwrite plain PII attributes while preserving the primary key for relational continuity:
   ```sql
   -- GDPR Article 17 In-Place Erasure
   UPDATE contacts
   SET
     first_name = 'Anonymized',
     last_name = 'Subject',
     email = 'erased-' || id || '@deleted.local',
     phone = NULL,
     custom_data = '{}'::jsonb,
     deleted_at = NOW(),
     deletion_reason = 'GDPR Article 17 Erasure Request'
   WHERE id = :id AND workspace_subdomain = :tenant;
   ```
3. **Metadata Purge**: After legal retention limits expire, the background worker purges row metadata.

### 11.2 Background Purge Worker (`purgeExpiredArchivedRecords`)
The purge worker runs off-peak (daily at 02:00 UTC) as an isolated task (`mms-background-jobs`) — never in HTTP request paths.

```ts
// apps/backend/src/worker/purgeArchivedRecordsJob.ts
const CHUNK_SIZE = 500;
const INTER_CHUNK_PAUSE_MS = 50;

export async function purgeExpiredArchivedRecords(
  db: DbClient,
  tenant: string,
  dryRun = process.env.DRY_RUN === 'true',
): Promise<{ purgedTables: Record<string, number> }> {
  const now = new Date();
  const results: Record<string, number> = {};
  const targets = [
    { table: messageLogs, name: 'message_logs' },
    { table: attendanceRecords, name: 'attendance_records' },
  ];

  for (const { table, name } of targets) {
    let totalPurged = 0;
    while (true) {
      const chunkPurgedCount = await db.transaction(async (tx) => {
        // 1. Bypass BEFORE DELETE trigger within this worker transaction
        await tx.execute(sql`SET LOCAL app.allow_hard_purge = 'true'`);

        // 2. Select batch of IDs using SKIP LOCKED to prevent transaction contention
        const candidates = await tx
          .select({ id: table.id })
          .from(table)
          .where(and(
            eq(table.workspaceSubdomain, tenant),
            isNotNull(table.deletedAt),
            lte(table.purgeAfter, now),
          ))
          .limit(CHUNK_SIZE)
          .for('update', { skipLocked: true });

        if (candidates.length === 0) return 0;
        const ids = candidates.map((c) => c.id);

        // 3. Emit tamper-evident audit trail record inside transaction
        await emitAuditEvent(tx, 'entity.hard_purge', { tenant, table: name, count: ids.length, purgedIds: ids });

        // 4. Physical hard delete of bounded chunk
        await tx.delete(table).where(inArray(table.id, ids));
        return ids.length;
      });

      totalPurged += chunkPurgedCount;
      if (chunkPurgedCount < CHUNK_SIZE) break;
      await new Promise((resolve) => setTimeout(resolve, INTER_CHUNK_PAUSE_MS));
    }
    results[name] = totalPurged;
  }
  return { purgedTables: results };
}
```

- **Production Deployment & Safeguards:**
  - **Tenant Scoping**: All purge queries strictly filter by `workspaceSubdomain = tenant`. Global cross-tenant purges are banned.
  - **Node.js 24 Execution**: Run directly via native `--experimental-strip-types` (e.g. `node --experimental-strip-types src/worker/index.ts`).
  - **Audit-First Invariant**: Emits `entity.hard_purge` audit event inside transaction before executing `DELETE`.
  - **Dry-Run Support**: `DRY_RUN=true` logs targeted counts without deleting.
  - **Prometheus Metrics**: Exposes `purge_job_executed_total` and `purge_job_deleted_rows_total`.

---

## 12. Checklist: Adding Soft-Delete to a Module

```
### Schema & DDL
- [ ] Add deletedAt, deletedBy, deletionReason (varchar 500), restoredAt, restoredBy, deletedWithCascade via softDeleteColumns mixin
- [ ] Assign deletedAt/restoredAt as Date objects, never ISO strings
- [ ] Add (workspace_subdomain, deleted_at) index (Category A)
- [ ] Add (workspace_subdomain) WHERE deleted_at IS NULL partial index (Category B)
- [ ] Add (workspace_subdomain, deleted_at) WHERE deleted_at IS NOT NULL partial index (Category C)
- [ ] Replace standard UNIQUE constraints on recyclable natural keys with partial unique indexes WHERE deleted_at IS NULL
- [ ] Attach BEFORE DELETE trigger calling forbid_hard_delete()
- [ ] Define PostgreSQL RLS policy tenant_soft_delete_isolation with app.include_deleted session gate
- [ ] Forward-only Drizzle DDL migration (no drizzle-kit push against shared/prod DB)

### @mms/shared
- [ ] Add softDelete block (all six fields including retentionDays) to module manifest
- [ ] Verify write schema rejects or strips all client soft-delete and restore fields (deletedAt, deletedBy, deletionReason, restoredAt, restoredBy, deletedWithCascade) via stripClientSoftDeleteFields or .omit()
- [ ] Export is[Entity]Deleted() predicate helper
- [ ] Ensure list query schema accepts includeDeleted and parses via isQueryFlagTrue

### Backend Routes
- [ ] Use registerResourceRoutes with deleteFn + restoreFn
- [ ] Use atomic conditional update (WHERE deleted_at IS NULL RETURNING id)
- [ ] Construct dynamic query AST (avoid parameterized boolean flags)
- [ ] Add explicit where: (c, { isNull }) => isNull(c.deletedAt) on all child relations in db.query
- [ ] bulkDeleteFn / bulkRestoreFn use a single batched SQL UPDATE (inArray) — no per-row loops
- [ ] For user/teacher entities: revoke active sessions and JWT tokens in Redis immediately upon soft-delete
- [ ] For user/teacher entities: verify deletedAt IS NULL in auth resolvers and login routes
- [ ] Enforce active foreign key guarding: reject foreign key assignments pointing to soft-deleted entities
- [ ] Enforce referential integrity: Restrict Guard (409) or Programmatic Atomic Cascade (deleted_with_cascade)
- [ ] Lock parent row (FOR UPDATE) when cascading to prevent concurrent child insertion races
- [ ] Implement GET /:id read semantics: 404 for archived records by default; ?includeDeleted=true requires canDeleteCollection
- [ ] Use registerSoftDeletableBulkTrashRoutes for bulk operations
- [ ] Add includeDeleted support via supportsIncludeDeleted: true in handleBulkListGet
- [ ] Wire onAfterDelete and onAfterRestore audit hooks
- [ ] Emit outbox CDC domain events entity.soft_deleted and entity.restored with monotonic versioning
- [ ] Trap PostgreSQL error 23505 on restore and return formatted 409 Conflict

### Frontend UX
- [ ] Add viewingDeleted state synchronized with URL search params (?view=trash)
- [ ] Map viewingDeleted -> includeDeleted in TanStack Query key and URL builder
- [ ] Preserve active search query and filters when toggling ModuleTrashToggle
- [ ] Mount ModuleTrashToggle in ModuleWorkToolbar (gated on canDelete)
- [ ] Wire BulkSelectionDeleteAction / BulkSelectionRestoreAction via ModuleWorkBulkActionBar
- [ ] Implement [Module]ArchivedBanner (WarningCallout) in detail drawer when deletedAt != null
- [ ] Display retention countdown badge in drawer and trash directory (Purges in N days / Archived indefinitely)
- [ ] Implement optimistic soft-delete with 5–10s Undo toast for single-record delete
- [ ] Hide Add/Create and Export CTAs when viewingDeleted = true
- [ ] Guard Cmd/Ctrl+N shortcut: check !viewingDeleted && canWrite

### Verification
- [ ] pnpm typecheck
- [ ] Scoped backend & frontend lint
- [ ] Integration tests verifying 404 on archived GET, 409 on duplicate restore, and correct bulk counts
```
