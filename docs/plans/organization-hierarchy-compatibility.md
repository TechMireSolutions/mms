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
| `faculty.reporting_faculty_id` / `hierarchy_rank` | Legacy person-level reporting. Seed defaults `reportingFacultyId` **disabled**; Faculty form shows a deprecation notice when re-enabled. Not used for task auth. |
| `faculty_assignments.reports_to_assignment_id` | Compatibility only. **Soft-stopped on create** (forced `NULL`); updates may preserve an existing value. Assignment CTEs/validation still understand it; not org-chart authority. |

## API notes

- `PUT/POST` faculty assignment: `reportsToAssignmentId` is optional and ignored for new appointment IDs. Prefer `positionId`.
- Faculty person fields: prefer Organization chart + assignment position occupancy over `reportingFacultyId`.

## Backfill helper

Dry-run proposal script (idempotent; never drops columns):

```bash
pnpm --filter mms-backend exec tsx src/scripts/propose-position-backfill.ts --tenant <subdomain> --dry-run
```

Omit `--dry-run` only after reviewing proposals; the apply path still only writes `position_id` / creates missing positions when safe.

## End state (later release)

1. Backfill positions from assignment reporting where safe.
2. Cut Faculty writes away from person-level reporting (seed already off for new tenants).
3. Stop writing `reports_to_assignment_id` for new appointments (**done** soft-stop).
4. Forward-only migration drops legacy columns only after zero dependents.

Until then: new features must use positions; dual trees may diverge—tasks and org chart follow positions only.

## Applied blueprint metadata (0137+)

Workspaces persist `applied_blueprint_key`, `applied_blueprint_version`, and `blueprint_applied_at` when a blueprint is applied (onboarding or Organization Setup). Industry type remains a separate field (`industry_type`).
