---
name: mms-frontend
description: Builds or modifies the MMS React frontend — apiClient, routing, providers, TanStack Query vs useLiveCollection, Vitest, and module file structure. Use when editing apps/frontend, Vite config, frontend hooks, pages, components, or frontend tests.
---

# MMS Frontend Workflow

## Stack

React 19 · Vite · TypeScript · Tailwind 4 · TanStack Query · React Router · shadcn/Radix · `@mms/shared`

Path alias: `@/` → `apps/frontend/src/`

## Before editing

1. Read scoped rules for the area: `mms-frontend.mdc`, `mms-query.mdc`, `mms-hooks.mdc`, `mms-ui-*`, `mms-i18n.mdc`
2. Run quality gate after substantive changes:

```bash
cd apps/frontend && pnpm typecheck && pnpm lint && pnpm test
```

## API calls

**Always** use `lib/apiClient.ts` for MMS backend routes:

```ts
import { apiJson, apiFetch } from '@/lib/apiClient';

const { students } = await apiJson<{ students: Student[] }>('/api/students');
```

Exception: third-party URLs (Google OAuth, etc.).

## Data layer decision

```
Does the module have dedicated REST routes (like /api/students)?
├── YES → TanStack Query hooks in hooks/
│         Page consumes useQuery / useMutation
│         Optional: saveCollection cache sync for KPI/reports still on localStorage
└── NO  → useLiveCollection + saveCollection (contacts, finance, …)
```

Reference: `hooks/useStudents.ts` + `pages/Students.tsx`.

## New page checklist

```
- [ ] Page in src/pages/ — lazy import in HostRoutes.tsx
- [ ] Nav in lib/navConfig.tsx + SYSTEM_MODULES in @mms/shared
- [ ] Three-tier tabs: useModuleTierTabs + ResponsiveAccordionTabs
- [ ] PageHeader actions unconditional (not gated on activeTab)
- [ ] ErrorBoundary on Operations/Analytics
- [ ] Copy via t() — mms-i18n.mdc
- [ ] Internal API via apiClient
```

Full module pattern: skill `mms-module-page`.

## Provider tree (do not break)

`App.tsx`: AuthProvider → QueryClientProvider → Router → BrandingPaletteProvider → TenantProvider → ContactConfigProvider

Never nest `ContactConfigProvider` on child pages.

## Large files — split pattern

| Concern | Location |
|---------|----------|
| Contact validation/schema | `lib/contactConfig/validationSchema.ts` |
| Contact profile metrics | `lib/contactConfig/profileMetrics.ts` |
| Widget types/colors | `components/reports/pinnedWidgets/types.ts` |
| Widget data utils | `components/reports/pinnedWidgets/widgetDataUtils.ts` |

Re-export from the original entry file for stable imports.

## Testing

- Env: `happy-dom` in `vitest.config.ts`
- Colocate `*.test.ts` next to source
- Mock `fetch` when testing hooks that call `apiClient`

## Rules

`mms-frontend.mdc`, `mms-query.mdc`, `mms-hooks.mdc`, `mms-ui-rendering.mdc`, `mms-a11y.mdc`

## Related skills

- `mms-module-page` — three-tier module layout
- `mms-data-sync` — localStorage / db.ts
- `mms-i18n` — via rule `mms-i18n.mdc`
- `mms-code-review` — PR checklist
