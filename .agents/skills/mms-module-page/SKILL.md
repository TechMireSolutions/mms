---
name: mms-module-page
description: Creates or modifies MMS module pages with Operations, Analytics, and Configuration tabs, PageHeader CTAs, and settings panels. Use when adding a new module, module page, settings panel, or the standard three-tier tab layout.
---

# MMS Module Page Pattern

## Required structure

```
Operations  |  Analytics  |  Configuration
                                    └─ Fields | Preferences
```

Reference implementations:

| Module | Data layer |
|--------|------------|
| `Contacts.tsx` | `useLiveCollection` (localStorage) |
| `Students.tsx` | `useStudents` + `useStudentMutations` (REST + Query) |
| `Finance.tsx` | `useLiveCollection` |

## Checklist

```
- [ ] Page in apps/frontend/src/pages/ — lazy route in HostRoutes.tsx
- [ ] Nav entry in lib/navConfig.tsx (standalone or Academics subItems; set moduleId)
- [ ] Registry: SYSTEM_MODULES + SYSTEM_MODULE_NAV + enabledModules default in @mms/shared
- [ ] PageHeader with unconditional actions in .actions
- [ ] Operations: CRUD/list views
- [ ] Analytics: KPISummary(category) + ModuleReports from components/reports/
- [ ] Configuration: *Settings panel (Fields + Preferences sub-tabs)
- [ ] Data: useLiveCollection OR TanStack Query — not one-shot useState
- [ ] Internal API via apiClient (mms-frontend.mdc)
- [ ] Module settings object: {module}_settings via saveObject
- [ ] Types/settings defaults in packages/shared/src/settingsTypes.ts
```

## Data layer choice

| Scenario | Pattern |
|----------|---------|
| Module has `/api/{resource}` routes | Query hooks in `hooks/use{Resource}.ts` — see `useStudents.ts` |
| Module uses generic `/api/db/collections` | `useLiveCollection` + `saveCollection` |
| Migrating to REST | Replace live collection in page only after hooks ship; sync localStorage if KPI views still read it |

## New module settings

1. Add `XxxSettings` interface + `DEFAULT_XXX_SETTINGS` in `@mms/shared/settingsTypes.ts`
2. Export from `packages/shared/src/index.ts`
3. Seed object key in backend seeds if needed
4. Create `components/xxx/XxxSettings.tsx` using `CustomFieldsBuilder` + `DraggableFieldList`

## Module isolation

Each tier is **module-scoped only** (`mms-module-isolation.mdc`):

| Tier | Content |
|------|---------|
| Operations | CRUD, lists, wizards — no KPIs or reports |
| Analytics | `KPISummary(moduleCategory)` + `ModuleReports` / module charts |
| Configuration | `{module}_settings`, fields, preferences |

- `KPISummary` **inside Analytics tab only** — never above the tier tabs.
- Use the module's own `category` (not `academic`).

## Responsive tabs

Wrap tier navigation in `ResponsiveAccordionTabs` — `mms-ui-tabs.mdc`.

## Do not

- Add a fourth top-level tab
- Gate PageHeader CTAs on `activeTab`
- Mount `*Settings` under `/settings` — Configuration tab only
- Use raw `fetch('/api/...')` — use `apiClient`
- Duplicate data paths (Query + `useLiveCollection` for same entity)

## Rules

`mms-module-isolation.mdc`, `mms-ui-tabs.mdc`, `mms-settings-navigation.mdc`, `mms-config.mdc`, `mms-query.mdc`
