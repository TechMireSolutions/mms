---
description: Registry-driven tabs, module tiers, PageHeader CTAs
paths:
  - "apps/frontend/src/pages/**/*.tsx"
  - "apps/frontend/src/components/ui/PageHeader.tsx"
---

# MMS Tab Navigation

## Registry-driven tabs

Render only **enabled** tabs in **order** from the tab registry:

```tsx
{enabledTabs.map((tab) => (
  <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
))}
```

- Icons: resolve Lucide component from registry `icon` key
- Colours: from registry `color` — no per-tab hardcoded Tailwind accents

## Module tiers (shell only)

Use `useModuleTierTabs()` — three ids: `work` | `reports` | `setup`. **Ids match UI tier names** — no legacy `operations` / `analytics` / `configuration`. No fourth top-level tier.

Labels and mobile accordion subtitles via `t('module.work')`, `t('module.reports')`, `t('module.setup')` and `module.workHint`, `module.reportsHint`, `module.setupHint` (`mms-i18n.md`).

| Tab id | English label | Purpose |
|--------|---------------|---------|
| `work` | Work | Daily tasks, lists, CRUD, workflows |
| `reports` | Reports | KPIs, charts, exports |
| `setup` | Setup | Fields, preferences, module settings (not global `/settings`) |

Persisted state and contact `pageTabs` keys use the same ids. Legacy ids are normalized on read via `normalizeModuleTierTabId` (`@mms/shared`).

**What goes inside each tier** → `mms-module-isolation.md` (canonical; do not duplicate here).

## PageHeader CTAs

```tsx
<PageHeader title="Contacts" actions={<ActionButton onClick={onAdd}>…</ActionButton>} />
```

- Primary page actions live in `PageHeader.actions` — not hidden behind `activeTab`.
- Tab-specific actions stay inside that tab’s content.

## Session persistence

Persist active module tab (and sub-tab where applicable) in session storage or user prefs — avoid reset on every route change.

## Extensibility

New tab = registry entry + content component. Do not rewrite shared tab shells per feature.

## Responsive mobile accordion (required)

All multi-tab shells use `ResponsiveAccordionTabs` from `components/ui/ResponsiveAccordionTabs.tsx`.

| Breakpoint | Behaviour |
|---|---|
| `< lg` (mobile/tablet) | Stacked section headings; tap expands **all tab content under that heading** |
| `≥ lg` (desktop) | Module pages: horizontal underline tabs; Settings: sidebar + panel |

```tsx
<ResponsiveAccordionTabs
  tabs={PAGE_TABS}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  hideWhenSingle
  panelIdPrefix="module-tab"
>
  {/* sub-tabs + AnimatePresence content */}
</ResponsiveAccordionTabs>
```

- URL-driven sections (Settings): pass `href` on each tab item; use `desktopLayout="sidebar"`.
- Setup / Work sub-tabs: prefer `SubTabBar` with `children` for nested mobile accordion.
- **Banned:** inline `flex border-b` tab bars on pages — use the shared component only.

## SubTabBar (Work / Reports / Setup inner tabs)

Use **`SubTabBar`** from `components/ui/SubTabBar.tsx` for inner tiers — not inline pill/`flex border-b` strips (`mms-migration-status.md`). Form modals use pill style via `FormModal` + `SubTabBar` (`mms-ui-forms.md`).

Tab labels from `t()` or registry `labelKey` — `mms-i18n.md`. Mobile accordion headings must be keyboard-activatable (`mms-a11y.md`).
