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
| `faculty.reporting_faculty_id` / `hierarchy_rank` | Legacy person-level reporting; Faculty UI may still show; not used for task auth |
| `faculty_assignments.reports_to_assignment_id` | Assignment CTEs/validation still use it; not org-chart authority |

## End state (later release)

1. Backfill positions from assignment reporting where safe.
2. Cut Faculty writes away from person-level reporting.
3. Stop writing `reports_to_assignment_id` for new appointments.
4. Forward-only migration drops legacy columns only after zero dependents.

Until then: new features must use positions; dual trees may diverge—tasks and org chart follow positions only.
