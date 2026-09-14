---
description: Consolidated UI component primitives, design tokens, navigation tabs, notifications, accessibility (RTL / WCAG), and mobile-first responsiveness (§7). FormModal norms → mms-form-architecture.
paths:
  - "apps/frontend/src/components/**/*.tsx"
  - "apps/frontend/src/tenant/features/**/*.tsx"
  - "apps/frontend/src/platform/**/*.tsx"
  - "apps/frontend/src/tenant/pages/**/*.tsx"
  - "apps/frontend/src/tenant/components/**/*.tsx"
  - "apps/frontend/src/index.css"
  - "apps/frontend/src/tenant/hooks/useBranding.ts"
  - "apps/frontend/src/lib/notify.ts"
---

# MMS UI, UX & Design System

**Workflow skills:** primitives/shells → `mms-frontend` · axe/§7 verify → `mms-a11y-smoke` · FormModal norms → `mms-form-architecture`.

Enforces strictly typed, accessible UI/UX across **tenant workspaces and platform apex**. Platform must not fork UI primitives.

## 1. Central Primitives Enforcement

Raw HTML controls (`<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, checkboxes) are strictly **banned** where design system primitives exist.

| Component | Source Path | Usage & Constraints |
|---|---|---|
| `Button` | `@/components/ui/button` | All action triggers; minimum 44×44px touch target (`min-h-11 min-w-11`). |
| `Input` / `LeadingIconInput` | `@/components/ui/input`, `LeadingIconInput` | Inputs with `name`, `id` (fallback `useId()`), `FORM_INPUT` (`min-h-11`). |
| `FormSelect` / `EditableSelect` | `@/components/ui/FormSelect`, `FormPrimitives` | Accessible dropdown selectors; no raw `<select>`. |
| `Textarea` / `Checkbox` / `Switch` | `@/components/ui/*` | Standard form primitives; never raw checkboxes/switches. |
| `FormModal` / `Modal` | `@/components/ui/FormModal` | Dialogs with focus trap, container queries (`@container`), scroll lock, `dvh`/`svh` tall sizing. |
| `DetailDrawerShell` | `@/components/ui/DetailDrawerShell` | Entity profile drawer. In trash: `WarningCallout` + Restore action; hide Edit/messaging. |
| `Table` | `@/components/ui/table` | shadcn table primitives with auto `overflow-x-auto`. Mandate `@tanstack/react-virtual` virtualization when rendered rows > 30 (`mms-performance.md`). |
| `StatCard` / `ModuleCommandMetricsGrid`| `@/components/ui/*` | Single metric tiles (`StatCard`); command-centre/report KPI strips (`ModuleCommandMetricsGrid`). |
| `EmptyState` / `ErrorState` | `@/components/ui/*` | Directory empties (`title` required, `variant="dashed"`, `compact`); errors with retry + hint description. |
| `FieldErrorMessage` | `@/components/ui/FormField` | Inline field/panel errors (`FORM_ERROR` + AlertCircle); no forked error text lines. |
| `WarningCallout` | `@/components/ui/WarningCallout` | Drawer archived state & setup warnings; no ad-hoc amber callouts. |
| `BulkSelectionBar` / `BulkSelectionActions` | `@/components/ui/*` | Work multi-select bar (`floating` \| `inline`) with delete/restore/messaging children. |
| `QuickActionButton` | `@/components/ui/QuickActionButton` | Detail/card quick actions (Call, WhatsApp, SMS, Email). |
| `DetailSectionTitle` / `FormFooterChip` | `@/components/ui/*` | Section headings and form footer entity/badge/error chips. |
| `StatusBadge` | `@/components/ui/StatusBadge` | Status indicators paired with `t()` text labels (never color alone). |
| `ModuleFiltersMenuButton` | `@/components/ui/ModuleFiltersMenuButton` | Single Filters dropdown shell (`ModuleFilterDropdown` + checkbox/radio groups). |
| `ModuleTrashToggle` | `@/components/ui/ModuleTrashToggle` | Work directory trash mode toggle with `aria-pressed={showDeleted}`. Mount in toolbar (not in filter dropdown); preserve filters on toggle; hide Add/Create and Export in trash. |
| `ModulePageShell` | `@/components/ui/ModulePageShell` | Standard page container margins, SEO metadata header, and `PageHeader` layout. |

## 2. Design Tokens & Surface Styling

- **Semantic Tokens Only:** Define design tokens exclusively in `index.css` `@theme` (Tailwind v4). Zero raw hex colors, hardcoded typography brackets (`text-[10px]`, `text-[11px]`), or ad-hoc Tailwind bracket classes (`bg-gray-100`, `rounded-[2rem]`).
- **Micro-Typography Tokens:** Use `text-2xs` (10px / `0.625rem`) for compact badges/meta and `text-3xs` (11px / `0.6875rem`) for subheadings/pills. Never write arbitrary font-size bracket classes.
- **Touch Target Dimensions:** All interactive triggers, form inputs, buttons, and action icons must satisfy the `44×44px` touch floor via `min-h-11 min-w-11` (never `min-h-[44px]`).
- **Z-Index Layering Hierarchy:** Always use semantic z-index tokens (`z-modal: 50`, `z-modal-priority: 60`, `z-popover: 70`, `z-toast: 100`) rather than arbitrary `z-[100]`.
- **Surface Tokens (`formStyles.ts`):** `WORK_SURFACE` / `WORK_SURFACE_INNER` for directory/detail/report panels; `FORM_CARD` / `FORM_INPUT_BUILDER` for forms; `bg-sidebar/90` for overlay backdrops.
- **Modern CSS Primitives & Subgrid:** Multi-section forms (`FormModal`) and directory card metadata grids should leverage CSS Subgrid (`grid-template-rows: subgrid` / `grid-template-columns: subgrid`) to ensure seamless alignment across nested child components.
- **Native Color Mixing:** Prefer CSS `color-mix(in srgb, var(--primary) 20%, transparent)` for surface tints, hover overlays, and accent backgrounds rather than fragile opacity class chains.
- **Rule of Three (Layout Sizes):** When a layout size appears ≥ 3 times, promote to `@theme` (`h-chart-sm|md|lg`, `max-w-toast`, `max-w-filter-sm`, `z-modal`, `z-toast`).
- **Notifications:** All user feedback via `notify.success()`, `notify.error()`, `notify.warning()` from `lib/notify.ts` with `t()` localized copy.

## 3. Accessibility (WCAG 2.2 AA) & RTL Standards

| Concern | Standard |
|---|---|
| **Focus & Keyboard** | Radix UI focus traps, `focus-visible:ring-2 focus-visible:ring-ring`, focus-return on modal/drawer close. Apply `scroll-margin-top` / `scroll-padding` (WCAG 2.2 Focus Appearance 2.4.11) so sticky headers, toolbars, or floating bulk action bars never occlude focused interactive controls. |
| **A11y Labels & IDs** | `aria-label` on icon buttons; `htmlFor`/`id` on inputs (auto `useId()`); `aria-busy="true"` + `aria-live="polite"` on loading lists. |
| **Color Contrast** | WCAG 2.2 AA text contrast (≥ 4.5:1 normal, ≥ 3:1 large); always pair status colors with text labels (`StatusBadge` + `t()`). |
| **Reduced Motion** | Honor `prefers-reduced-motion` on Framer Motion transitions. |
| **React 19 Primitives** | Use native `ref` as prop on all custom UI primitives — `forwardRef` is deprecated and banned in newly authored components. |
| **RTL Layout** | CSS logical properties only (`text-start`, `ms-*`, `ps-*`, `border-s-*`, `inset-inline-start`). Flip directional arrows (`rtl:rotate-180`), preserve brand icons. |
| **Semantics** | Use semantic landmarks (`<main>`, `<nav>`, `<header>`, `<section>`, `<footer>`). |
| **Cognitive Ergonomics (WCAG 2.2)** | **Redundant Entry (3.3.7):** Avoid asking users to re-enter information previously entered in the same session; auto-prefill known contact/student data. **Accessible Authentication (3.3.8):** Never block paste on OTP/2FA or password inputs (`onPaste` prevention strictly forbidden). |

### BiDi Directional Class Replacement Matrix
Physical direction classes are strictly forbidden across both tenant and platform code:

| Banned Physical Class | Mandatory BiDi Logical Replacement | Purpose |
|---|---|---|
| `ml-*`, `mr-*` | `ms-*`, `me-*` | Margin inline start / end |
| `pl-*`, `pr-*` | `ps-*`, `pe-*` | Padding inline start / end |
| `left-*`, `right-*` | `start-*`, `end-*` / `inset-inline-start`, `inset-inline-end` | Absolute / relative offsets |
| `text-left`, `text-right` | `text-start`, `text-end` | Text alignment |
| `border-l-*`, `border-r-*` | `border-s-*`, `border-e-*` | Border inline start / end |
| `rounded-l-*`, `rounded-r-*` | `rounded-s-*`, `rounded-e-*` | Border corner rounding |


## 5. Data Tables, Live Regions & Contrast Modes

Accessibility work that stops at labels and touch targets still fails real assistive-technology users on the surfaces MMS uses most: dense tables and long-running background work.

1. **Tables carry structure, not just visuals:** every data table uses real `<table>` semantics with `<th scope="col">` (or `scope="row"` for row headers) and a `<caption>` (visually hidden is fine) naming the dataset. Styling a grid of `<div>`s into a table is banned.
2. **Sortable columns announce state:** the sorted column sets `aria-sort="ascending|descending|none"` on its header, and the control that changes sorting is a real button inside the header cell with an accessible name ("Sort by Name").
3. **Async work speaks:** background job progress (`BackgroundJobsTray`), save confirmations, and filter-result counts expose a polite live region (`aria-live="polite"` / `role="status"`), and busy containers set `aria-busy`. A spinner with no announcement is silent to a screen reader.
4. **State changes after an action are announced:** restore-from-trash, bulk delete counts, and inline validation must move focus or announce the change — otherwise the user cannot tell whether the action happened.
5. **Honour user contrast preferences:** support `prefers-contrast` and `forced-colors` (Windows high contrast) — decorative shadows/gradients must not carry meaning, focus indicators must remain visible, and status must never be encoded by colour alone (pair it with an icon or text).
6. **Focus order follows visual order** in RTL: verify tab order after the direction flips, and never rely on DOM order alone to convey sequence.
7. **Automated checks are a floor, not proof:** the axe smoke (`e2e/tests/a11y-shell.spec.ts`, skill `mms-a11y-smoke`) catches serious/critical violations only; announcements, focus movement, and table semantics need the manual checklist above.

## 4. Mobile-First Responsiveness & Breakpoints

| Breakpoint | Range | Prefix | Shell Layout Standards |
|---|---|---|---|
| **Mobile** | < 640 px | `(base)` | Default mobile-first layout; 1-column forms; bottom nav / hamburger; card directories. |
| **Tablet Portrait** | 640–768 px | `sm:` | 2-column form grids inside dialogs; condensed filters. |
| **Tablet Landscape**| 768–1024 px | `md:` | Platform horizontal nav (`md+`); directory table mode (`md+`). |
| **Desktop / Laptop** | 1024–1280 px | `lg:` | Tenant AppLayout sidebar (`lg+`); horizontal tier tabs (`lg+`). |
| **Large Desktop** | > 1280 px | `xl:` | Multi-column report analytics; wide table layouts. |

### Layout Rules
- **No Fixed Widths:** Never hardcode pixel widths (`w-[1200px]`). Use relative units (`%`, `rem`, `vw`, `max-w-*`).
- **Zero Horizontal Overflow:** Root containers must not exceed `100vw`; apply `max-w-full` and `box-border`.
- **Viewport Heights:** Prefer `dvh`/`svh` + `safe-area-inset-*` over raw `vh` for modals and full-height shells.
- **Touch Target Floor:** All buttons, triggers, and links must satisfy `min-h-11 min-w-11` (44×44px).
- **Wide Tables:** Wrap tables in `overflow-x-auto max-w-full`.
- **List & Table Virtualization:** All directories, tables, and feeds rendering more than 30 concurrent items MUST use virtual scrolling via `@tanstack/react-virtual` (reference: `ContactsListDesktopTable.tsx`) to keep DOM nodes bounded — `mms-performance.md`.
- **Container Queries:** FormModal tabs and inner grids follow dialog `@container` (`@md:`, `@sm:`), not viewport.
- **Unknown Hosts:** Hard redirect unknown tenant subdomains to apex `/tenant-not-found?subdomain=…` (`mms-settings-i18n.md`).
