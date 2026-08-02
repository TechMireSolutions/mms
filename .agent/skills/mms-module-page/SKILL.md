---
name: mms-module-page
description: Creates or modifies MMS module pages per mms-module-architecture.md — Work, Reports, Setup tiers, module manifest, PageHeader command centre, and settings panels. Use when adding a module, three-tier page, or aligning an existing module to universal architecture.
---

# MMS Module Page Pattern

**Rule (norms SSOT):** `mms-module-architecture.md` — this skill is workflow + checklist only.

## Section map

| Section | Topic | Skill / rule |
|---------|--------|--------------|
| §1 | Manifests | `mms-module-architecture.md` |
| §2 | Three-tier shell | `mms-ui-ux-design.md`, this skill |
| §3 | Work directory | skill **`mms-module-work`** |
| §4 | Setup / fields | skill **`mms-module-setup`**, `mms-fields.md` |
| §5 | Background jobs | skill **`mms-background-jobs`** |
| §6 | Soft-delete Work UX + RBAC omit | `mms-module-architecture.md` (+ sessions/RBAC middleware → `mms-auth-security.md`) |
| §7 | Gold-standard parity | checklist below |
| Reports | Analytics / export | skill **`mms-reports-export`** |

Modules live under `apps/frontend/src/tenant/features/{module}/` (lazy route in `HostRoutes` / tenant routes — not legacy `src/pages/`).

## Workflow

1. Add `packages/shared/src/{module}ModuleManifest.ts` (`moduleId`, tiers, permissions, `work.directoryViews`, `setupSubTabs`, `softDelete`).
2. Person-directory Work: `directoryViews: ['table','cards']` (never `list`). Domain modules keep their own sub-modes — `mms-module-work`.
3. Scaffold `{Module}Page.tsx` + `use{Module}PageController` under `tenant/features/{module}/`.
4. Wire nav: `navConfig.tsx` + `SYSTEM_MODULES` / `SYSTEM_MODULE_NAV`.
5. Shell: `PageHeader` (always visible) + `ResponsiveAccordionTabs` + `useFilteredModuleTierTabs({ canViewSetup, canViewReports })`.
6. Work → skill **`mms-module-work`**. Reports → **`mms-reports-export`**. Setup → **`mms-module-setup`**.
7. Data: REST Query-first via **`mms-query-factories`** — no new `useLiveCollection` for REST entities.
8. Gates: `useModulePermissions(manifest)`; omit forbidden CTAs; BE `rbacService` still required.

Reference: Contacts (full), Students/Teachers (soft-delete Work). Before building: read Contacts/Students page + manifest + rule §7.

## Gold-standard checklist (§7)

```
- [ ] Bulk PUT upsert-only (never replaceForWorkspace wipe on API write paths)
- [ ] Soft-delete + Work trash UI (or documented manifest variant)
- [ ] mutateAsync + await form/setup saves; close only after success
- [ ] setupSubTabs + canEditSetup + saveSettingsAsync
- [ ] ErrorState + retry + hint on list query failure
- [ ] Cmd/Ctrl+N create when canWrite and not in trash
- [ ] Person-directory: directoryViews ['table','cards']; cards share server page API
- [ ] useModulePermissions(manifest); omit forbidden CTAs
- [ ] i18n via t() (en/ar/ur/fa)
```

## New module checklist

```
- [ ] {Module}ModuleManifest in @mms/shared
- [ ] Page under tenant/features/{module}/ — lazy route wired
- [ ] Nav: navConfig + SYSTEM_MODULES / SYSTEM_MODULE_NAV
- [ ] PageHeader command centre (metrics/create/export) — not tier-gated
- [ ] useFilteredModuleTierTabs (work | reports | setup)
- [ ] Work / Reports / Setup via sibling skills
- [ ] FormModal for create/edit — mms-form-architecture
- [ ] ErrorBoundary on Work + Reports; Query-first data
- [ ] No nested ContactConfigProvider; no raw fetch('/api/...')
```

## Do not

- Fourth top-level tier; gate PageHeader CTAs on `activeTab`
- Mount module Setup under `/settings`
- Dual-write Query + `saveCollection`; wipe via bulk PUT `replaceForWorkspace`
- Close forms after fire-and-forget `mutate()`
- Reference removed `globlestructure.md` / `globle.md`

## Related skills

`mms-module-work`, `mms-module-setup`, `mms-background-jobs`, `mms-reports-export`, `mms-query-factories`, `mms-form-architecture`, `mms-fields-registry`, `mms-messaging`

## Done

`mms-completion-review.md` — typecheck + FE lint; new modules need §7 checklist green.
