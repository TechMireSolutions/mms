---
name: mms-module-page
description: Creates or modifies MMS module pages with Work, Reports, and Setup tabs, PageHeader CTAs, and settings panels. Use when adding a new module, module page, settings panel, or the standard three-tier tab layout.
---

# MMS Module Page Pattern

## Required structure

```
work  |  reports  |  setup
                    └─ Fields | Preferences
```

Reference implementations:

| Module | Data layer | Primary hooks |
|--------|------------|---------------|
| `Students.tsx` | REST + Query (server-first) | `useStudents`, `useStudentMutations` |
| `Contacts.tsx` | REST + Query + hybrid cache | `useContacts`, `useContactMutations`, `useContactsCollection` |
| `Finance.tsx` | localStorage | `useLiveCollection` |

## Checklist

```
- [ ] Page in apps/frontend/src/pages/ — lazy route in HostRoutes.tsx
- [ ] Nav entry in `lib/config/navConfig.tsx` (standalone or Academics subItems; set moduleId)
- [ ] Registry: SYSTEM_MODULES + SYSTEM_MODULE_NAV + enabledModules default in @mms/shared
- [ ] PageHeader with unconditional actions in .actions
- [ ] ResponsiveAccordionTabs + useModuleTierTabs (mms-ui-tabs.mdc)
- [ ] Work: CRUD/list views (`work` tab)
- [ ] Reports: KPISummary(category) + ModuleReports (`reports` tab)
- [ ] Setup: *Settings panel (Fields + Preferences sub-tabs) (`setup` tab)
- [ ] Data: useLiveCollection OR TanStack Query — not one-shot useState
- [ ] Internal API via apiClient (mms-frontend.mdc)
- [ ] Module settings object: {module}_settings via saveObject
- [ ] Types/settings defaults in packages/shared/src/settingsTypes.ts
- [ ] ErrorBoundary on Work + Reports tiers
- [ ] can() for write/admin actions — not role === (mms-rbac.mdc)
```

## Data layer choice

| Scenario | Pattern |
|----------|---------|
| Module has `/api/{resource}` routes | Query hooks in `hooks/use{Resource}.ts` — see `useStudents.ts`, `useContacts.ts` |
| Module uses generic `/api/db/collections` | `useLiveCollection` + `saveCollection` |
| Migrating to REST | Ship Query hooks first; page uses `useXxxCollection()` if KPI widgets still on localStorage |
| Dashboard/widgets need legacy data | `saveCollection` inside Query `queryFn` — hybrid pattern in `mms-query.mdc` |

## New module settings

1. Add `XxxSettings` interface + `DEFAULT_XXX_SETTINGS` in `@mms/shared/settingsTypes.ts`
2. Export from `packages/shared/src/index.ts`
3. Seed object key in backend seeds if needed
4. Create `components/xxx/XxxSettings.tsx` using `CustomFieldsBuilder` + `DraggableFieldList`

## Module isolation

Each tier is **module-scoped only** (`mms-module-isolation.mdc`):

| Tier (id) | User label | Content |
|-----------|------------|---------|
| operations | Work | CRUD, lists, wizards — no KPIs or reports |
| analytics | Reports | `KPISummary(moduleCategory)` + `ModuleReports` / module charts |
| configuration | Setup | `{module}_settings`, fields, preferences |

- `KPISummary` **inside Reports tab only** — never above the tier tabs.
- Use the module's own `category` (not `academic`).

## Responsive tabs

Wrap tier navigation in `ResponsiveAccordionTabs` — `mms-ui-tabs.mdc`. Inner tiers use `SubTabBar`.

## Do not

- Add a fourth top-level tier
- Gate PageHeader CTAs on `activeTab`
- Mount `*Settings` under `/settings` — Setup tab only
- Use raw `fetch('/api/...')` — use `apiClient`
- Duplicate data paths (Query mutations + parallel `saveCollection` writes for same entity)
- Nest `ContactConfigProvider` on module pages

## Rules

`mms-module-isolation.mdc`, `mms-ui-tabs.mdc`, `mms-settings-navigation.mdc`, `mms-config.mdc`, `mms-query.mdc`, `mms-frontend.mdc`
