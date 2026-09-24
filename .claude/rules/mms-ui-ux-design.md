---
description: Consolidated UI component primitives, design tokens, navigation tabs, notifications, accessibility (RTL / WCAG), and mobile-first responsiveness (§4). FormModal norms → mms-form-architecture.
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

**Workflow skills:** primitives/shells → `mms-frontend` · axe/§4 verify → `mms-a11y-smoke` · FormModal norms → `mms-form-architecture`.

Enforces strictly typed, accessible UI/UX across **tenant workspaces and platform apex**. Platform must not fork UI primitives.

## 1. Central Primitives Enforcement

Raw HTML controls (`<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<dialog>`, checkboxes) and ad-hoc floating tooltips are strictly **banned** where design system primitives exist.

| Component | Source Path | Usage & Constraints |
|---|---|---|
| `Button` | `@/components/ui/button` | All action triggers; minimum 44×44px touch target (`min-h-11 min-w-11`). |
| `Input` / `LeadingIconInput` | `@/components/ui/input`, `LeadingIconInput` | Inputs with `name`, `id` (fallback `useId()`), `FORM_INPUT` (`min-h-11`). |
| `FormSelect` / `EditableSelect` | `@/components/ui/FormSelect`, `FormPrimitives` | Accessible dropdown selectors; no raw `<select>`. |
| `Textarea` / `Checkbox` / `Switch` | `@/components/ui/*` | Standard form primitives; never raw checkboxes/switches. |
| `FormModal` / `Modal` | `@/components/ui/FormModal` | Dialogs with top-layer placement, focus trap, container queries (`@container`), scroll lock, `dvh`/`svh` tall sizing, and `@starting-style` transitions. |
| `Popover` / `Tooltip` | `@/components/ui/popover`, `@/components/ui/tooltip` | Top-layer floating contextual overlays; no unanchored or clipping `overflow: hidden` absolute divs. |
| `DropdownMenu` | `@/components/ui/dropdown-menu` | Action and filter menus with keyboard navigation and focus-return. |
| `AppShell` | `@/components/common/AppShell` | Universal outer application frame unifying skip link, desktop/mobile navigation drawers, top header bar, and main content landmark across tenant and platform domains. |
| `DetailSheet` / `DetailDrawerShell` | `@/components/common/DetailSheet`, `@/components/ui/DetailDrawerShell` | Entity profile drawer with integrated archive banner, BiDi slide-over, container queries, and declarative SSOT entity descriptor attribute rendering. In trash: `WarningCallout` + Restore action; hide Edit/messaging. |
| `Table` | `@/components/ui/table` | shadcn table primitives with auto `overflow-x-auto`. Mandate `@tanstack/react-virtual` virtualization when rendered rows > 30 (`mms-performance.md`). |
| `DirectoryCard` / `DirectoryEntityCard` / `DirectoryCardsGrid` | `@/components/ui/DirectoryCard`, `@/components/ui/DirectoryEntityCard`, `@/components/ui/DirectoryCardsGrid` | Directory card primitives for mobile/tablet card views (`DirectoryCardsGrid` responsive grid wrapper; `DirectoryEntityCard` outer container; `DirectoryCard` compound slot wrapper with header/meta/pills/actions/footer); mandatory CSS containment (`contain: content`, `content-visibility: auto`). |
| `DirectoryCardFooterActions` | `@/components/ui/DirectoryCardFooterActions` | Standardized card bottom-action cluster pairing View CTA (`contacts.actionViewShort`) + overflow `ModuleRowActionsMenu` (`DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS`, 44×44px touch targets). |
| `StatCard` / `ModuleCommandMetricsGrid`| `@/components/ui/*` | Single metric tiles (`StatCard`); command-centre/report KPI strips (`ModuleCommandMetricsGrid`). Enforces `statCardAccent.ts` tokens (`SEMANTIC_BG`, `SEMANTIC_TEXT`), `SectionLabel`, `trendTextClass()`, and `useReducedMotion()`. |
| `EmptyState` / `ErrorState` | `@/components/ui/*` | Directory empties (`title` required, `variant="dashed"`, `compact`); errors with retry + hint description. |
| `FieldErrorMessage` | `@/components/ui/FormField` | Inline field/panel errors (`FORM_ERROR` + AlertCircle); no forked error text lines. |
| `WarningCallout` | `@/components/ui/WarningCallout` | Drawer archived state & setup warnings; no ad-hoc amber callouts. |
| `BulkActionDock` / `BulkSelectionBar` | `@/components/common/BulkActionDock`, `@/components/ui/*` | Work multi-select dock with Escape hotkey integration and floating/inline placement (`BulkActionDock`) wrapping `BulkSelectionBar` with delete/restore/messaging children (`BulkSelectionActions`). |
| `QuickActionButton` | `@/components/ui/QuickActionButton` | Detail/card quick actions (Call, WhatsApp, SMS, Email). |
| `DetailSectionTitle` / `FormFooterChip` | `@/components/ui/*` | Section headings and form footer entity/badge/error chips. |
| `StatusBadge` | `@/components/ui/StatusBadge` | Status indicators paired with `t()` text labels (never color alone). |
| `ModuleFiltersMenuButton` | `@/components/ui/ModuleFiltersMenuButton` | Single Filters dropdown shell (`ModuleFilterDropdown` + checkbox/radio groups). |
| `ModuleTrashToggle` | `@/components/ui/ModuleTrashToggle` | Work directory trash mode toggle with `aria-pressed={showDeleted}`. Mount in toolbar (not in filter dropdown); preserve filters on toggle; hide Add/Create and Export in trash. |
| `ModuleScaffold` / `ModulePageShell` | `@/components/common/ModuleScaffold`, `@/components/ui/ModulePageShell` | Standard page container margins, SEO metadata header, slot-based architecture (`drawerOutlet`, `isBusy`), and unified layout across tenant modules and platform apex. |

## 2. Design Tokens & Surface Styling

- **Semantic Tokens Only:** Define design tokens exclusively in `index.css` `@theme` (Tailwind v4) using perceptually uniform `oklch()` color coordinates. Zero raw hex colors, hardcoded typography brackets (`text-[10px]`, `text-[11px]`), or ad-hoc Tailwind bracket classes (`bg-gray-100`, `rounded-[2rem]`). Physical print styles (A4/PDF) and default template geometries are quarantined in `lib/printTemplateStyles.ts`. Three further exemptions, all documented at the call site: (a) theme-preview swatches that must render a *fixed* palette regardless of the active theme (`ThemeModeSelector` light/dark miniatures); (b) canvas/diagram surfaces that must resolve CSS vars to concrete colors — reference tokens via `hsl(var(--primary, <channels>))` fallback syntax (`CANVAS_ACCENT` in `templateEditorUtils.ts`) or a `readThemeColor(varName, fallback)` helper (`ErdMermaidDiagram`), never a bare hex alone; (c) user-content color normalization (`normalizeHexColor`).
- **Micro-Typography Tokens:** Use `text-2xs` (10px / `0.625rem`) for compact badges/meta and `text-3xs` (11px / `0.6875rem`) for subheadings/pills. Never write arbitrary font-size bracket classes.
- **Touch Target Dimensions:** All interactive triggers, form inputs, buttons, and action icons must satisfy the `44×44px` touch floor via `min-h-11 min-w-11` (never `min-h-[44px]`).
- **Z-Index Layering Hierarchy:** Always use semantic z-index tokens (`z-modal: 50`, `z-modal-priority: 60`, `z-popover: 70`, `z-toast: 100`) rather than arbitrary `z-[100]`.
- **Surface Tokens (`formStyles.ts`):** `WORK_SURFACE` / `WORK_SURFACE_INNER` for directory/detail/report panels; `FORM_CARD` / `FORM_INPUT_BUILDER` for forms; `bg-sidebar/90` for overlay backdrops.
- **Card Insets & Spacing Hygiene:** Never apply ad-hoc child-level inline offsets (`ms-0.5`, `ms-1`, `ps-1`, `ms-2`) to card elements, headers, metadata tiles, or icon containers. Alignment is governed strictly by outer card primitives (`DirectoryEntityCard`, `StatCard`, `SectionCard`) via `CARD_STRIPE_INSET` and standard padding (`p-4` / `px-5 py-4`). Child row spacing must rely on standard flex/grid gap tokens (`gap-2`, `gap-3`). Motion animations must honor `useReducedMotion()`.
- **Modern CSS Primitives & Subgrid:** Multi-section forms (`FormModal`) and directory card metadata grids (`DirectoryCardMetaGrid`) must leverage CSS Subgrid (`grid-template-rows: subgrid` / `grid-template-columns: subgrid`) to ensure seamless alignment across nested child rows and variable-length text.
- **CSS Container Queries (`@container`):** Modular components (cards, drawers, modals, widgets) must adapt their internal layouts using container queries (`@container`, `cqi`) rather than viewport width (`sm:`, `md:`, `lg:`), allowing identical components to render flawlessly in split-views, drawers, and full-width grids.
- **Native Color Mixing & High Contrast:** Prefer CSS `color-mix(in srgb, var(--primary) 20%, transparent)` for surface tints, hover overlays, and accent backgrounds rather than fragile opacity class chains. Ensure all interactive borders and focus rings remain visible under `forced-colors: active` and `prefers-contrast: more`.
- **Rule of Three (Layout Sizes):** When a layout size appears ≥ 3 times, promote to `@theme` (`h-chart-sm|md|lg`, `max-w-toast`, `max-w-filter-sm`, `z-modal`, `z-toast`).
- **Notifications:** All user feedback via `notify.success()`, `notify.error()`, `notify.warning()` from `lib/notify.ts` with `t()` localized copy.

## 3. Accessibility (WCAG 2.2 AA) & RTL Standards

| Concern | Standard |
|---|---|
| **Focus & Keyboard** | Radix UI focus traps, `focus-visible:ring-2 focus-visible:ring-ring` with ≥ 3:1 contrast against adjacent surface, focus-return on modal/drawer close. Apply `scroll-margin-top` / `scroll-padding` (WCAG 2.2 Focus Appearance 2.4.11) so sticky headers, toolbars, or floating bulk action docks never occlude focused interactive controls. |
| **A11y Labels & IDs** | `aria-label` on icon buttons; `htmlFor`/`id` on inputs (auto `useId()`); `aria-busy="true"` + `aria-live="polite"` on loading lists and dynamic feeds. |
| **Color Contrast** | WCAG 2.2 AA text contrast (≥ 4.5:1 normal, ≥ 3:1 large); always pair status colors with text labels (`StatusBadge` + `t()`). |
| **Reduced Motion** | Honor `prefers-reduced-motion` on Framer Motion transitions and CSS keyframes. |
| **React 19 Primitives** | Use native `ref` as prop on all custom UI primitives — `forwardRef` is deprecated and banned in newly authored components. |
| **RTL Layout** | CSS logical properties only (`text-start`, `ms-*`, `ps-*`, `border-s-*`, `inset-inline-start`). Flip directional arrows (`rtl:rotate-180`), preserve brand icons. |
| **Semantics** | Use semantic landmarks (`<main>`, `<nav>`, `<header>`, `<section>`, `<footer>`). Real `<table>` elements with `<th scope="col|row">` and `<caption>`. |
| **Cognitive Ergonomics (WCAG 2.2)** | **Redundant Entry (3.3.7):** Avoid asking users to re-enter information previously entered in the same session; auto-prefill known contact/student data. **Accessible Authentication (3.3.8):** Never block paste on OTP/2FA or password inputs (`onPaste` prevention strictly forbidden). **Dragging Movements (2.5.7):** Any draggable interaction (column reordering, widget layout) must provide single-pointer keyboard-accessible alternatives (Move Up / Down buttons). |
| **Typography & Text Wrap (2026)** | Use `text-wrap: balance` on headings, card titles, and modal headers to avoid awkward wrap breaks. Use `text-wrap: pretty` on paragraphs, callouts, and error summaries to prevent orphan words. On Urdu Nastaliq text (`lang="ur"`), set `line-height: 2.2` and safe vertical padding to prevent diacritic clipping. Dynamic user data in mixed-script contexts must apply `dir="auto"` or `unicode-bidi: plaintext` to prevent inverted punctuation. |

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
| `scroll-pl-*`, `scroll-pr-*` | `scroll-ps-*`, `scroll-pe-*` | Scroll padding inline start / end |

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
- **Viewport Heights & Virtual Keyboard:** Prefer `dvh`/`svh` + `safe-area-inset-*` over raw `vh` for modals, bottom sheets, and full-height shells to prevent viewport jump when mobile virtual keyboards engage.
- **Touch Target Floor:** All buttons, triggers, and links must satisfy `min-h-11 min-w-11` (44×44px).
- **Wide Tables:** Wrap tables in `overflow-x-auto max-w-full`.
- **List & Table Virtualization:** All directories, tables, and feeds rendering more than 30 concurrent items MUST use virtual scrolling via `@tanstack/react-virtual` (reference: `ContactsListDesktopTable.tsx`) to keep DOM nodes bounded — `mms-performance.md`.
- **Container Queries:** FormModal tabs, detail drawer panels, and directory cards follow component `@container` (`@md:`, `@sm:`, `cqi`), not viewport breakpoints alone.
- **Zero Layout Shift (CLS = 0):** Media, charts, and image containers must specify explicit `aspect-ratio` (`aspect-video`, `aspect-square`, `aspect-[4/3]`) or reserved dimensions. Skeleton loaders must match exact final layout dimensions.
- **Unknown Hosts:** Hard redirect unknown tenant subdomains to apex `/tenant-not-found?subdomain=…` (`mms-settings-i18n.md`).

## 5. Data Tables, Live Regions & Contrast Modes

Accessibility work that stops at labels and touch targets still fails real assistive-technology users on the surfaces MMS uses most: dense tables and long-running background work.

1. **Tables carry structure, not just visuals:** every data table uses real `<table>` semantics with `<th scope="col">` (or `scope="row"` for row headers) and a `<caption>` (visually hidden is fine) naming the dataset. Styling a grid of `<div>`s into a table is banned.
2. **Sortable columns announce state:** the sorted column sets `aria-sort="ascending|descending|none"` on its header, and the control that changes sorting is a real button inside the header cell with an accessible name ("Sort by Name").
3. **Async work speaks:** background job progress (`BackgroundJobsTray`), save confirmations, and filter-result counts expose a polite live region (`aria-live="polite"` / `role="status"`), and busy containers set `aria-busy`. A spinner with no announcement is silent to a screen reader.
4. **State changes after an action are announced:** restore-from-trash, bulk delete counts, and inline validation must move focus or announce the change — otherwise the user cannot tell whether the action happened.
5. **Honour user contrast preferences:** support `prefers-contrast` and `forced-colors` (Windows high contrast) — decorative shadows/gradients must not carry meaning, focus indicators must remain visible, and status must never be encoded by colour alone (pair it with an icon or text).
6. **Focus order follows visual order** in RTL: verify tab order after the direction flips, and never rely on DOM order alone to convey sequence.
7. **Automated checks are a floor, not proof:** the axe smoke (`e2e/tests/a11y-shell.spec.ts`, skill `mms-a11y-smoke`) catches serious/critical violations only; announcements, focus movement, and table semantics need the manual checklist above.

## 6. Single Source of Truth (SSOT) Entity UI Registry

All primary entities (contacts, students, faculty, sessions, finance, platform workspaces) provide a declarative entity descriptor via `createEntityDescriptor<T>()` (`@/components/common/entityRegistry`, `@/types/entityRegistry`).
- **Unified Schema:** Field definitions specify `key`, `label`, `type` (`text`, `badge`, `currency`, `date`, `status`, `link`, etc.), `tableOrder`, `cardSlot`, and `drawerSection`.
- **Automatic Derivations:**
  - Table columns and visibility defaults (`getTableColumns()`) feeding `ModuleColumnCustomizer`.
  - Directory card metadata grid tiles (`getCardFields()`) feeding `DirectoryCardMetadata`.
  - Filter chips labels and formatting (`formatFieldValue()`) feeding `FilterChips`.
  - Drawer attribute inspection sections and rows (`getDrawerSections()`) feeding `DetailSheet`.
- **Zero Forking:** Directory cards (`DirectoryCard` / `DirectoryEntityCard`), filter chips, and drawer viewers consume registered entity descriptors rather than repeating ad-hoc column lists, card field arrays, and drawer layouts.

## 7. i18n-Resolved Descriptor Hook Pattern

To ensure all table columns, filter chips, card metadata, and drawer attributes render localized text rather than raw translation keys, every module provides a dedicated `use{Entity}EntityDescriptor()` hook (e.g. `useStudentEntityDescriptor`, `useFacultyEntityDescriptor`, `usePlatformUserDescriptor`).

- **Colocation:** The hook lives adjacent to feature hooks in `tenant/features/{module}/hooks/` or `platform/hooks/`.
- **Implementation:** The hook invokes `useStaticEntityDescriptor(staticDescriptor, (key, fallback) => t(key) || fallback)` to produce an active, locale-resolved `EntityDescriptor<T>`.
- **Consumer Wiring:** Directory views (`ModuleWorkDirectoryShell`, `ModuleWorkTableHeader`, `DirectoryCardMetadata`, `DetailSheet`) consume the hook result rather than referencing the static descriptor directly or doing manual inline translation mappings.

## 8. Modern 2026 UI/UX Capabilities (Top-Layer, Anchors, Subgrid & Motion)

- **Top-Layer Entry/Exit Transitions:** Modals, sheets, and popovers must use `@starting-style` and `transition-behavior: allow-discrete` to smoothly animate opacity and transform without JS height-tracking hacks.
- **CSS Anchor Positioning:** Floating context menus, tooltips, and filter dropdowns leverage anchor positioning (`position-anchor`, `position-area`) where supported, preventing clipping by `overflow: hidden` parent shells.
- **CSS Subgrid Alignment:** Sibling directory cards in a grid and multi-column form sections use subgrid to align headers, meta badges, and action bars regardless of variable content heights.
- **Fluid & BiDi Typography:** All UI copy honors `text-wrap: balance` for headings and `text-wrap: pretty` for body paragraphs, with `dir="auto"` on dynamic user content to avoid script corruption.
