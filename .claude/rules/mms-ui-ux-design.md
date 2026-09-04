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
| `ModulePageShell` | `@/components/ui/ModulePageShell` | Standard page container margins, SEO metadata header, and `PageHeader` layout. |

## 2. Design Tokens & Surface Styling

- **Semantic Tokens Only:** Define design tokens exclusively in `index.css` `@theme` (Tailwind v4). Zero raw hex colors, hardcoded typography brackets (`text-[10px]`, `text-[11px]`), or ad-hoc Tailwind bracket classes (`bg-gray-100`, `rounded-[2rem]`).
- **Micro-Typography Tokens:** Use `text-2xs` (10px / `0.625rem`) for compact badges/meta and `text-3xs` (11px / `0.6875rem`) for subheadings/pills. Never write arbitrary font-size bracket classes.
- **Touch Target Dimensions:** All interactive triggers, form inputs, buttons, and action icons must satisfy the `44×44px` touch floor via `min-h-11 min-w-11` (never `min-h-[44px]`).
- **Z-Index Layering Hierarchy:** Always use semantic z-index tokens (`z-modal: 50`, `z-modal-priority: 60`, `z-popover: 70`, `z-toast: 100`) rather than arbitrary `z-[100]`.
- **Surface Tokens (`formStyles.ts`):** `WORK_SURFACE` / `WORK_SURFACE_INNER` for directory/detail/report panels; `FORM_CARD` / `FORM_INPUT_BUILDER` for forms; `bg-sidebar/90` for overlay backdrops.
- **Rule of Three (Layout Sizes):** When a layout size appears ≥ 3 times, promote to `@theme` (`h-chart-sm|md|lg`, `max-w-toast`, `max-w-filter-sm`, `z-modal`, `z-toast`).
- **Notifications:** All user feedback via `notify.success()`, `notify.error()`, `notify.warning()` from `lib/notify.ts` with `t()` localized copy.

## 3. Accessibility (WCAG 2.1 AA) & RTL Standards

| Concern | Standard |
|---|---|
| **Focus & Keyboard** | Radix UI focus traps, `focus-visible:ring-2 focus-visible:ring-ring`, focus-return on modal/drawer close. |
| **A11y Labels & IDs** | `aria-label` on icon buttons; `htmlFor`/`id` on inputs (auto `useId()`); `aria-busy="true"` + `aria-live="polite"` on loading lists. |
| **Color Contrast** | WCAG 2.1 AA text contrast (≥ 4.5:1 normal, ≥ 3:1 large); always pair status colors with text labels (`StatusBadge` + `t()`). |
| **Reduced Motion** | Honor `prefers-reduced-motion` on Framer Motion transitions. |
| **RTL Layout** | CSS logical properties only (`text-start`, `ms-*`, `ps-*`, `border-s-*`, `inset-inline-start`). Flip directional arrows (`rtl:rotate-180`), preserve brand icons. |
| **Semantics** | Use semantic landmarks (`<main>`, `<nav>`, `<section>`, `<header>`, `<footer>`). |

## 4. §7 Mobile-First Responsiveness & Breakpoints

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
