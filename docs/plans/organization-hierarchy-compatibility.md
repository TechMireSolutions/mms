# Organization hierarchy compatibility strategy

## Canonical model

| Concern | Authority |
|---|---|
| Org chart structure | `organization_positions.parent_position_id` |
| Position occupancy | `faculty_assignments.position_id` |
| Task delegation | Position descendants of the actor’s active occupied positions |

## Compatibility (do not drop yet)

| Field | Status |
|---|---|
| `faculty.reporting_faculty_id` / `hierarchy_rank` | Legacy person-level reporting. Seed defaults `reportingFacultyId` **disabled**; Faculty form shows a deprecation notice when re-enabled. **Soft-stopped on create** (forced `NULL`); updates may preserve an existing value. Not used for task auth. |
| `faculty_assignments.reports_to_assignment_id` | Compatibility only. **Soft-stopped on create** (forced `NULL`); updates may preserve an existing value. Assignment CTEs/validation still understand it; not org-chart authority. |

## API notes

- `PUT/POST` faculty assignment: `reportsToAssignmentId` is optional and ignored for new appointment IDs. Prefer `positionId`.
- Faculty person writes: `reportingFacultyId` is forced `NULL` on create via `persistFacultyTx`; prefer Organization chart + assignment `positionId` occupancy.

## Backfill helper (ops)

Script: `apps/backend/src/scripts/propose-position-backfill.ts`

Idempotent position proposal/apply for active `faculty_assignments` missing `position_id`. Uses the assignment reporting tree only as a **proposal source**; never drops legacy columns and never rewrites person-level reporting.

### Dry-run (required first)

```bash
pnpm --filter mms-backend exec tsx src/scripts/propose-position-backfill.ts --tenant <subdomain> --dry-run
```

Prints proposed `code` / `name` / parent links per assignment. Review output before apply. Re-running dry-run after partial apply skips rows that already have `position_id`.

### Apply

```bash
pnpm --filter mms-backend exec tsx src/scripts/propose-position-backfill.ts --tenant <subdomain>
```

Creates missing `organization_positions` when needed and sets `faculty_assignments.position_id`. Safe to re-run: assignments that already have `position_id` are skipped.

### Non-goals

- No auto-DDL / no migration generation
- No drop of `reports_to_assignment_id` or person reporting columns
- Not a substitute for Organization blueprint apply on empty tenants

## End state (later release)

1. Backfill positions from assignment reporting where safe.
2. Cut Faculty writes away from person-level reporting (**done** soft-stop on create; seed already off for new tenants).
3. Stop writing `reports_to_assignment_id` for new appointments (**done** soft-stop).
4. Forward-only migration drops legacy columns only after zero dependents.

Until then: new features must use positions; dual trees may diverge—tasks and org chart follow positions only.

## Applied blueprint metadata (0137+)

Workspaces persist `applied_blueprint_key`, `applied_blueprint_version`, and `blueprint_applied_at` when a blueprint is applied (onboarding or Organization Setup). Industry type remains a separate field (`industry_type`).
