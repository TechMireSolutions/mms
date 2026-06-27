---
name: mms-frontend
description: Builds or modifies the MMS React frontend — apiClient, routing, providers, TanStack Query vs useLiveCollection, Vitest, Playwright, and module file structure. Use when editing apps/frontend, Vite config, frontend hooks, pages, components, or frontend tests.
---

# MMS Frontend Workflow

## Stack

React 19 · Vite 8 · TypeScript · Tailwind 4 · TanStack Query · React Router · shadcn/Radix · Framer Motion · Recharts · Lucide · `@mms/shared`

Path alias: `@/` → `apps/frontend/src/`

## Architecture snapshot

```
main.tsx → App.tsx → AppProviders (providers/AppProviders.tsx)
  RootErrorBoundary → AuthProvider → QueryClientProvider → Router → … → ContactConfigProvider
    AuthenticatedApp → RouterBridge + Suspense → HostRoutes (apex OR tenant tree)
```

| Host | Routes |
|------|--------|
| Apex | Landing, onboarding, workspace gate |
| Tenant | `ProtectedRoute` → `AppLayout` → module pages |

## Before editing

1. Read scoped rules for the area: `mms-api-interface.md`, `mms-data-layer.md`, `mms-hooks.md`, `mms-ui-ux-design.md`, `mms-settings-i18n.md`, `mms-auth-security.md`
2. Run quality gate after substantive changes:

```bash
cd apps/frontend && pnpm typecheck && pnpm lint && pnpm test
```

E2E (repo root): `pnpm exec playwright test`

## API calls

**Always** use `lib/apiClient.ts` for MMS backend routes:

```ts
import { apiJson, apiFetch } from '@/lib/apiClient';

const { students } = await apiJson<{ students: Student[] }>('/api/students');
```

- Cookie session via `credentials: 'include'` — no `localStorage` token reads in `apiClient`
- Exception: third-party URLs (Google OAuth in `ContactSyncPanel.tsx`)

## Data layer decision

```
Does the module have dedicated REST routes (/api/students, /api/contacts)?
├── YES → TanStack Query hooks in hooks/
│         Page reads via useXxx() or useXxxCollection() (hybrid)
│         Mutations via useXxxMutations()
│         queryFn may saveCollection() for KPI widgets still on localStorage
└── NO  → useLiveCollection + saveCollection (finance, obligations, …)
```

| Pattern | Modules |
|---------|---------|
| Query-first | Students, Contacts (page), Workspace registry |
| Hybrid collection | `useStudentsCollection`, `useContactsCollection` |
| Live collection only | Finance, Accounting, Obligations, Sessions, Users, Attendance, Enrollments, … |
| Dashboard | Hybrid + many live collections |

Reference: `hooks/useStudents.ts`, `hooks/useContacts.ts`, `pages/Students.tsx`.

## New page checklist

```
- [ ] Page in src/pages/ — lazy import in HostRoutes.tsx
- [ ] Nav in `lib/config/navConfig.tsx` + SYSTEM_MODULES in @mms/shared
- [ ] Three-tier tabs: useModuleTierTabs + ResponsiveAccordionTabs
- [ ] PageHeader actions unconditional (not gated on activeTab)
- [ ] ErrorBoundary on Work/Reports
- [ ] Copy via t() — mms-settings-i18n.md (no new uiStrings outside Contacts)
- [ ] Internal API via apiClient
- [ ] RBAC via can() — not role === (mms-auth-security.md)
- [ ] Status via StatusBadge — not text-green-500 (mms-ui-ux-design.md)
```

Full module pattern: skill `mms-module-page`.

## Settings page (`/settings`)

App-wide settings only — **not** per-module Fields/Preferences (those live in module Setup tabs).

```
pages/Settings.tsx          → SETTINGS_NAV + lazy SETTINGS_SECTION_COMPONENTS
components/settings/        → Global, Branding, Theme, SystemModules, BackupRestore
components/settings/backup/ → export/import/history sections (logic in useBackupRestore)
components/settings/modules/ModuleSettingsNavGrid.tsx → SYSTEM_MODULE_NAV toggles
hooks/useSettingsDraft.ts   → generic draft + preview + save
hooks/useBrandingDraft.ts   → branding record (Branding + Theme tabs)
hooks/useThemeSettingsDraft.ts
hooks/useBackupRestore.ts   → backup state machine
hooks/useSavedFlash.ts      → post-save footer flash
hooks/useApplyLogoColors.ts → logo → primary/secondary
```

Rules: `mms-settings-i18n.md`, `mms-settings-i18n.md`, `mms-hooks.md`.

New section checklist: add to `SETTINGS_SECTIONS`, `SETTINGS_NAV`, `SETTINGS_SECTION_COMPONENTS`; use `SettingsPanel` + `SettingsFormActions`; preview via `settingsPreview.ts`; all copy via `t()`.

## Provider tree (do not break)

`providers/AppProviders.tsx`: RootErrorBoundary → AuthProvider → QueryClientProvider → Router → BrandingPaletteProvider → TenantProvider → PlatformAuthProvider → ContactConfigProvider

Never nest `ContactConfigProvider` on child pages.

## Key paths

| Path | Purpose |
|------|---------|
| `lib/apiClient.ts` | All internal HTTP |
| `lib/db.ts` | localStorage + `/api/db` sync |
| `lib/contexts/AuthContext.tsx` | Session lifecycle |
| `lib/contexts/TenantContext.tsx` | Subdomain / workspace |
| `lib/config/routes.ts` | Path constants |
| `lib/config/navConfig.tsx` | Sidebar nav |
| `lib/config/settingsNavConfig.ts` | `/settings` sidebar items |
| `lib/config/settingsSectionComponents.tsx` | Lazy settings section registry |
| `lib/config/moduleIcons.ts` | `resolveModuleIcon()` for system modules |
| `lib/settingsGlobalDraft.ts` / `lib/settingsModulesDraft.ts` | Global/Modules preview + save helpers |
| `lib/backup/` | Backup download, history, restore types |
| `lib/routing/routePrefetch.ts` | Lazy route chunk warmup |
| `lib/data/*Data.ts` | Module seed/mock collections |
| `lib/notify.ts` | Toasts — sole user feedback API |
| `lib/query-client.ts` | TanStack Query defaults |

## Large files — split pattern

| Concern | Location |
|---------|----------|
| Contact validation/schema | `lib/contactConfig/validationSchema.ts` |
| Contact profile metrics | `lib/contactConfig/profileMetrics.ts` |
| Widget types/colors | `components/reports/pinnedWidgets/types.ts` |
| Widget data utils | `components/reports/pinnedWidgets/widgetDataUtils.ts` |

Re-export from the original entry file for stable imports.

## Known migration debt (do not expand)

| Debt | Where |
|------|-------|
| Contacts `uiStrings` | ~24 files — migrate to `t('contacts.*')` when touching |
| Inline `role ===` | Dashboard widget role filter only |
| Inline status colours | Chart color maps — KPI/PinnedWidgets palettes |

Full register: `mms-migration-status.md`. Skill: `mms-migration-fixes`.

## Testing

| Layer | Config |
|-------|--------|
| Unit | `vitest.config.ts` — `happy-dom`, `src/**/*.test.ts` |
| E2E | `e2e/smoke.spec.ts`, `e2e/interactive.spec.ts` |

- Colocate `*.test.ts` next to source
- Mock `fetch` when testing hooks that call `apiClient`
- Existing: `lib/apiClient.test.ts`, `hooks/hooks.test.ts`

## Rules index (frontend)

| Topic | Rule |
|-------|------|
| Shell, apiClient, layout | `mms-api-interface.md` |
| TanStack Query | `mms-data-layer.md` |
| Hooks inventory | `mms-hooks.md` |
| Tabs, PageHeader | `mms-ui-ux-design.md` |
| Forms, tables, notify | `mms-ui-ux-design.md` |
| Entity modals | `mms-ui-ux-design.md` |
| Colours, StatusBadge | `mms-ui-ux-design.md` |
| i18n | `mms-settings-i18n.md` |
| RBAC UI | `mms-auth-security.md` |
| localStorage sync | `mms-data-layer.md` |
| Apex/tenant | `mms-auth-security.md` |
| a11y | `mms-ui-ux-design.md` |
| Tests | `mms-testing-observability.md` |

## Related skills

- `mms-module-page` — three-tier module layout
- `mms-data-sync` — localStorage / db.ts / hybrid cache
- `mms-form-architecture` — dynamic forms & blueprints
- `mms-code-review` — PR checklist
- `mms-migration-fixes` — open debt items
