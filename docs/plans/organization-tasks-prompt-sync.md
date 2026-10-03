# Organization + Tasks prompt sync

Reconciles the external Organization Structure / Task Management prompt (§§1–37) with shipped MMS code on `main` (migrations **0134–0137**, through `a0df11b2`). Hierarchy authority remains in [organization-hierarchy-compatibility.md](./organization-hierarchy-compatibility.md).

## Non-goals

- No third reporting hierarchy
- No role-name authorization (`if (role === 'manager')`)
- No destructive “reset organization to blueprint”
- Keep MMS permission vocabulary (`tasks.write` for create+update); do not rename to prompt’s `tasks.create` / `tasks.update` without a separate RBAC migration

## Status matrix

| Prompt area | Status | Primary artifacts |
|---|---|---|
| Position-based org (`organization_positions.parent_position_id`) | DONE | `0134_…sql`, `organizationPositionTables.ts`, hierarchy validation |
| Locations / branches | DONE | `organization_locations`, Locations panel/routes |
| `faculty_assignments.position_id` occupancy | DONE | validation + Faculty appointment UI |
| Legacy `reports_to_assignment_id` / person reporting | PARTIAL | Soft-stop create; update soft-stop + DROP deferred (see compatibility doc) |
| Industry profiles (independent recommendations) | DONE | `packages/shared/src/industryProfiles.ts` |
| Blueprints (typed, preview/diff, insert-missing apply) | DONE | `organizationBlueprints/*`, blueprint services/routes/UI |
| Blueprint re-apply mutates existing rows | OUT-OF-SCOPE | Apply is idempotent insert-if-missing only |
| Onboarding industry + structure | DONE | 5-step wizard + blueprint apply |
| Terminology profiles | PARTIAL | Registry + org/faculty/sidebar; not all Students/Faculty copy |
| Tasks module (Work/Reports/Setup) | DONE | manifest, routes, `TasksPage`, RBAC, module access |
| Delegation (`descendants` / `direct_reports`) | DONE | `taskRecipientRepository`, Setup prefs, BE enforcement |
| Multi-assignee + login-required recipients | DONE | `task_assignees`, integration tests |
| Priorities / statuses | DONE | `TASK_PRIORITIES`, `TASK_STATUSES` |
| Notify prefs delivery | PARTIAL → residual | Prefs + outbox intents (messaging consumer later) |
| `recommendedRoles` | DONE (advisory) | `getRecommendedRolesForIndustry` + onboarding StructureStep checklist; **not** auto-seeded (IDs ≠ workspace RBAC catalog) |
| `startDate` / `parentTaskId` UI | PARTIAL → residual | DB/API; form/drawer surface in residual cycle |
| Comments / attachments / recurrence | DEFERRED | No schema |
| Reports export / Fields setup | DEFERRED | Gold-standard stretch |
| Legacy column DROP | DEFERRED | After null-position / legacy count gate is zero |

## Residual backlog pointer

See phases in the apply plan: ops backfill gate, notify outbox wiring, advisory roles, task field UI, polish (formatDate, org restore RBAC, update soft-stop).

## Blueprint apply semantics

Re-applying a blueprint **creates missing** departments/designations/positions by code. It does **not** update existing name/parent/capacity. Industry type and applied blueprint metadata remain separate (`industry_type` vs `applied_blueprint_*`).
