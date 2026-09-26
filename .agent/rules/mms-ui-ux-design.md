---
trigger: model_decision
description: Consolidated UI component primitives, design tokens, navigation tabs, notifications, accessibility (RTL / WCAG), and mobile-first responsiveness (§4). FormModal norms → mms-form-architecture.
---

# MMS UI, UX & Design System

**Workflow skills:** design intelligence → `ui-ux-pro-max` · primitives/shells → `mms-frontend` · axe/§4 verify → `mms-a11y-smoke` · FormModal norms → `mms-form-architecture`.

## 1. Central Primitives Enforcement

- **Banned Raw Controls:** Never emit raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<dialog>`, or native checkboxes/switches where design system primitives exist.
- **Sanctioned Primitives (`@/components/ui/*` & `@/components/common/*`):**
  - **Inputs & Controls:** `Button` (min 44×44px), `Input`, `LeadingIconInput`, `FormSelect`, `EditableSelect`, `Textarea`, `Checkbox`, `Switch`.
  - **Overlays & Drawers:** `FormModal` (portal shell), `DetailSheet` / `DetailDrawerShell` (drawer with archive banner and `WarningCallout`), `Popover`, `Tooltip`, `DropdownMenu`.
  - **Layout & Shells:** `AppShell` (universal frame), `ModulePageShell` / `ModuleScaffold` (page shell), `Table` (shadcn table; mandate `@tanstack/react-virtual` when rows > 30).
  - **Directory & Cards:** `DirectoryCardsGrid`, `DirectoryEntityCard`, `DirectoryCard`, `DirectoryCardFooterActions`, `StatCard`, `ModuleCommandMetricsGrid`, `BulkActionDock` / `BulkSelectionBar`, `ModuleTrashToggle` (`aria-pressed={showDeleted}`).
  - **Feedback & States:** `EmptyState`, `ErrorState`, `FieldErrorMessage`, `WarningCallout`, `StatusBadge` (pair with `t()`, never color alone), `notify.{success,error,warning}` from `lib/notify.ts`.

## 2. Design Tokens & Surface Styling

- **Semantic Tokens Only:** Use `index.css` theme mapping (`hsl(var(--primary))`; no standalone `oklch()`). Zero raw hex colors or arbitrary Tailwind brackets (`bg-gray-100`, `rounded-[2rem]`). Print styles quarantined in `lib/printTemplateStyles.ts`.
- **Micro-Typography & Sizing:** `text-2xs` (10px) for compact meta, `text-3xs` (11px) for pills. Semantic z-index: `z-modal` (50), `z-modal-priority` (60), `z-popover` (70), `z-toast` (100). Never write arbitrary font-size or z-index bracket classes (`z-[100]`).
- **Touch Target Floor:** Mandatory `min-h-11 min-w-11` (44×44px) on all interactive triggers, buttons, inputs, and action icons. Never use `min-h-[44px]`.
- **Surfaces & Insets:** Use `WORK_SURFACE` / `WORK_SURFACE_INNER` for panels, `FORM_CARD` for forms (`formStyles.ts`). Use `color-mix(in srgb, var(--primary) 20%, transparent)` for tints. Outer card primitives govern padding (`p-4` / `px-5 py-4`); no child-level inline offsets (`ms-1`). Honor `useReducedMotion()`.

## 3. Accessibility (WCAG 2.2 AA) & RTL Standards

- **Focus & Keyboard:** `focus-visible:ring-2 focus-visible:ring-ring`, focus-return on modal/drawer dismiss, `scroll-margin-top` / `scroll-padding` to prevent sticky headers from obscuring focused controls.
- **Inputs & Forms:** `useId()` for `id`/`htmlFor`, `aria-label` on icon buttons, never block paste on inputs (`onPaste` prevention banned). Provide single-pointer buttons (Move Up/Down) for draggable interactions.
- **BiDi Logical Properties Only:** Physical direction classes are strictly banned. Use logical equivalents: `ms-*`/`me-*` (not `ml`/`mr`), `ps-*`/`pe-*` (not `pl`/`pr`), `start-*`/`end-*` (not `left`/`right`), `text-start`/`text-end` (not `text-left`/`text-right`), `border-s-*`/`border-e-*`, `rounded-s-*`/`rounded-e-*`, and `rtl:rotate-180` for directional icons.
- **Typography:** `text-wrap: balance` on headings, `text-wrap: pretty` on copy. Urdu (`lang="ur"`) requires `line-height: 2.2` and `dir="auto"`.

## 4. Mobile-First Responsiveness & Breakpoints

- **Layout Bounds:** Zero horizontal overflow (`max-w-full`, `100vw` limit). No fixed pixel widths (`w-[1200px]`); use relative units. Wrap wide tables in `overflow-x-auto max-w-full`.
- **Mobile Viewports:** Prefer `dvh`/`svh` + `safe-area-inset-*` over raw `vh` for modals and sheets. Unknown tenant subdomains hard-redirect to `/tenant-not-found?subdomain=…`.
- **Breakpoints:** Mobile (<640px base: 1-col forms, card directories), Tablet (640–1024px `sm:`/`md:`: 2-col forms, directory table mode), Desktop (1024px+ `lg:`/`xl:`: AppLayout sidebar, horizontal tier tabs).
- **Container Queries & Zero CLS:** Use `@container` (`@md:`, `@sm:`) for component-width layouts. Explicit `aspect-ratio` or reserved dimensions on media and charts (CLS = 0).

## 5. Data Tables, Live Regions & Contrast Modes

- **Table Semantics:** Real `<table>` elements with `<th scope="col|row">` and `<caption>`. Styling `<div>` grids into tables is banned. Sort headers set `aria-sort="ascending|descending|none"`.
- **Virtualization:** All directories and tables rendering > 30 items must use virtual scrolling via `@tanstack/react-virtual` (`mms-performance.md`).
- **Live Regions:** Background progress, save confirmations, and filter result counts expose `aria-live="polite"` (`role="status"`); busy containers set `aria-busy="true"`.
- **Contrast & Reading Order:** Support `prefers-contrast` and `forced-colors`. DOM order must match RTL visual reading order; positive `tabindex` is banned.

## 6. Single Source of Truth (SSOT) Entity UI Registry

- **Declarative Descriptor:** Primary entities define descriptors via `createEntityDescriptor<T>()` (`@/components/common/entityRegistry`, `@/types/entityRegistry`).
- **Automatic Derivations:** Single schema drives `getTableColumns()`, `getCardFields()`, `formatFieldValue()`, and `getDrawerSections()`.
- **Zero Forking:** Directory views, cards, filter chips, and detail sheets must consume descriptors; never duplicate ad-hoc column lists or attribute layouts.

## 7. i18n-Resolved Descriptor Hook Pattern

- **Colocation & Resolution:** Every module provides a localized `use{Entity}EntityDescriptor()` hook invoking `useStaticEntityDescriptor` with an application translation key resolver.
- **Consumer Wiring:** Directory views (`ModuleWorkDirectoryShell`, `ModuleWorkTableHeader`, `DirectoryCardMetadata`, `DetailSheet`) consume the resolved hook result, never raw descriptor constants or inline translation maps.

## 8. UI/UX Pro Max Design Intelligence System

- **Mandatory Usage When Coding UI/UX**:
  - **Feature Modules & Pages**: Before creating or refactoring pages, views, cards, or dashboards, consult the UI/UX Pro Max engine (`python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<feature/domain keywords>" --design-system -p "MMS"`, skill `ui-ux-pro-max`). Use design dials: `--density 7-9` for compact administrative directories/tables, `--motion 2-4` for enterprise transitions.
  - **Component & Domain Search**: Query targeted domains before implementation: `--domain style` (79 styles; e.g. Bento Grid, Minimalist, Clean Corporate), `--domain ux` (119 UX guidelines for tables, forms, modals, error states), `--domain typography` (74 pairings), `--domain chart` (25 data visualization types for KPIs/reports), and `--domain color` (192 curated industry palettes).
  - **Stack Guidance**: Query `--stack react` or `--stack html-tailwind` for framework-specific patterns (table horizontal overflow wrappers, memoization hygiene, dialog portals, focus traps).
- **Mandatory Checks When Reviewing UI/UX**:
  - **Semantic Token Compliance**: Every color must map to semantic HSL CSS tokens in `index.css` (`hsl(var(--primary))`, `hsl(var(--secondary))`, `hsl(var(--card))`, `hsl(var(--muted))`, `hsl(var(--border))`, `hsl(var(--destructive))`). Raw hex (`#4F46E5`) and arbitrary Tailwind bracket colors (`bg-[#4F46E5]`, `text-[#000]`) are strictly banned.
  - **Strict BiDi Logical CSS**: Enforce zero physical direction classes. Must use `ps-*`/`pe-*`, `ms-*`/`me-*`, `start-*`/`end-*`, `text-start`/`text-end`, `border-s-*`/`border-e-*`, `rounded-s-*`/`rounded-e-*`, and `rtl:rotate-180` for directional chevrons/icons.
  - **Touch Target Floor**: All interactive controls (buttons, tabs, inputs, icon triggers) must meet the minimum 44×44px touch floor (`min-h-11 min-w-11`).
  - **Text Resilience & Reflow**: Headings use progressive `text-wrap: balance`; layouts must reflow without clipping across 375px, 768px, 1024px, and 1440px viewports (`mms-ui-ux-design.md` §4). Chip and tag collections must wrap or provide an accessible `+n` disclosure.
  - **Visual & State Polish**: Badges must never rely on color alone; always pair with localized text via `t()`. Micro-interactions must stay within 150–300ms ease-out and respect `prefers-reduced-motion`.
  - **Table Handling**: Tables must be wrapped with `overflow-x-auto max-w-full` or adopt responsive card layouts on narrow viewports (`--domain ux` table handling).
  - **Keyboard & Focus**: Visible focus rings (`focus-visible:ring-2 focus-visible:ring-ring`), no blocked paste, and focus return on dismiss.
- **Chart & Analytics Recommendations**: Query `--domain chart` for KPI grids, trend lines, and distribution visualizations (`mms-reports.md`).

## 9. Workflow & Output Speed Rules

- **Zero Output Bloat:** Emit surgical diffs or targeted snippets only. Never rewrite entire files unless creating a new file from scratch. Omit conversational greetings and post-code summaries.
- **Verification Gates:** Verify interactive controls with axe smoke (`e2e/tests/a11y-shell.spec.ts`, skill `mms-a11y-smoke`) for zero serious/critical violations. Spot-check 375 / 768 / 1024px viewports and RTL (`dir="rtl"`).
