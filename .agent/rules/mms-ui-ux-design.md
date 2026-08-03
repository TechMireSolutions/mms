---
trigger: model_decision
---

# MMS UI, UX & Design System

**Workflow skills:** primitives/shells → `mms-frontend` · axe/§7 verify → `mms-a11y-smoke` · FormModal chrome norms → `mms-form-architecture` (skill + rule).

Rules governing the strictly typed, component-driven, accessible UI/UX architecture of the Madrasa Management System (MMS).

## 1. Component & Design Token Constraints

### Primitive Component Enforcement
- **No raw control elements**: NEVER use raw UI tags (`<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, checkboxes) where design system primitives are available. This does **not** ban semantic landmarks (`<main>`, `<nav>`, `<section>`, `<header>`, `<footer>`).
- **Utilize Central Primitives**: Use:
  - `Button` (`@/components/ui/button`)
  - `Input` (`@/components/ui/input`)
  - `FormSelect` / `EditableSelect` (`@/components/ui/FormSelect` / `@/components/ui/FormPrimitives`)
  - `Textarea` (`@/components/ui/textarea`)
  - `Checkbox` (`@/components/ui/checkbox`)
  - `Switch` (`@/components/ui/switch`)
  - `FormModal` / `Modal` (`@/components/ui/FormModal`)
  - `DetailDrawerShell` (`@/components/ui/DetailDrawerShell`)
  - `DataTable` (`@/components/ui/DataTable`)
  - `StatCard` (`@/components/ui/StatCard`)
  - `ErrorState` (`@/components/ui/ErrorState`) — title + **hint** description + retry
  - `ExportToolbar` (`@/components/ui/ExportToolbar`)
  - `SafeResponsiveContainer` (`@/components/ui/SafeResponsiveContainer`)
- Extend central primitives safely when custom variations are needed. Do not implement ad-hoc primitives in feature folders.

### Detail drawers
- Use `DetailDrawerShell` for entity profiles (Contacts / Students / Teachers pattern).
- Soft-deleted rows: archive banner + Restore; hide Call / WhatsApp / SMS / Email (and other outbound messaging) — `mms-module-architecture.md` §3.
- Header Edit, close, and per-row icon actions must meet the `min-h-11` / `min-w-11` touch floor (do not ship bare `size="icon"` without it).
- Render all enabled registry/custom fields — no hard-coded key allowlists that drop Setup fields — `mms-fields.md`.

### Design Token Strictness
- **No Hardcoded Tailwind Values**: NEVER use hardcoded hex or one-off palette classes (e.g. `bg-gray-100`, `text-blue-500`, `rounded-[2rem]`).
- **Use Semantic Design Tokens**: Define tokens **only** in `index.css` `@theme` (Tailwind v4) — ban feature-level `@theme` / raw hex. Prefer CSS `@layer` for base/components/utilities. Keep FormModal `@container` queries.
- **Touch-target exception**: Design-system primitives may use approved sizes from `formStyles` / primitives (e.g. `min-h-11`, `min-w-11`) — do not invent new arbitrary values in feature code.
- **Semantic Colors**: For success/warning/destructive affordances, use semantic tokens (e.g., `text-destructive`, `bg-destructive/10`, theme `--success`).
- **Glass tokens**: Where glass surfaces already exist in the design system, reuse those tokens (`backdrop-blur`, translucent borders). Do **not** require glassmorphism on every card.

---

## 2. Dialogs & forms (pointer)

FormModal shell, tabs, tall height, scroll lock, Zod/save clears, focus trap, and focus-return → **`mms-form-architecture.md`**. This rule owns tokens, tabs chrome, a11y, and §7 responsive layout (including FormModal `@container` breakpoints).

---

## 3. Tab Navigation & metrics

### Module Tier Accordion
Use `useFilteredModuleTierTabs({ canViewSetup, canViewReports })` so forbidden tiers are omitted (`work` / `reports` / `setup`).
- Render only **enabled** tabs in the exact order defined in the registry.
- Retrieve tab icons/colors from the registry (no hardcoded Tailwind accents per-tab).

### Responsive Tab Layouts
- **Breakpoints**: Use `ResponsiveAccordionTabs` from `components/ui/ResponsiveAccordionTabs.tsx`.
  - `< lg`: Stacked section headings; tap expands the section contents.
  - `≥ lg`: Horizontal underline tabs for module tiers; sidebar + panels for Settings.
- **Pills & SubTabs**: Use `SubTabBar` for inner sub-tabs (like Setup -> Fields/Prefs). Do not build custom pill bars.
- **Command Metrics Grid**: Use `<ModuleCommandMetricsGrid />` (`components/ui/ModuleCommandMetricsGrid.tsx`) for rendering quick command metric strips with staggered entrance animations. Do not write custom inline grids or cards for metrics.
- **Module Page Shell**: Always wrap all top-level module pages, settings pages, and account profile pages inside `<ModulePageShell />` (`components/ui/ModulePageShell.tsx`) to unify page container margins, SEO metadata header rendering, and PageHeader layout configurations. Do not write duplicate page container wrapper markup or headers in module entrypoints.

---

## 4. Notifications & Feedback
- **Unified API**: All system notifications must call the `notify` helper (`lib/notify.ts`): `notify.success()`, `notify.error()`, `notify.warning()`. Direct `toast()` imports are forbidden.
- **Localization**: Localize all alert/toast messages utilizing the `t()` translation keys (`mms-settings-i18n.md`).

---

## 5. Accessibility & RTL Baseline

### WCAG Baseline
- **Focus & Trap**: Interactive components (modals, popovers, select dropdowns) must use Radix UI primitives integrated in central components. FormModal/drawer focus-return → `mms-form-architecture.md`.
- **Labels**: Button icons must declare `aria-label`. Associate labels with input IDs (`htmlFor` / `id`).
- **Color Contrast**: Primary texts on glass surfaces must meet WCAG AA contrast. Never convey status by color alone; always pair colors with text labels (`StatusBadge` + `t()`).
- **Name and ID attributes**: All input, select, textarea, date picker, and tag input elements must declare explicit `name` and `id` properties. If not supplied, components must fallback automatically to `React.useId()` and link label/assistive elements accordingly.
- **Motion**: Honor `prefers-reduced-motion` — reduce or disable non-essential Framer Motion on decorative transitions.
- **Pending loads**: Work directory / list Query pending states should expose `aria-busy` and a polite live region (or equivalent Status) so screen readers hear loading — not only a spinner.
- **View Transitions**: Default **off**. If enabled, only document navigations that do not fight Framer Motion; always honor `prefers-reduced-motion`.
- **Landmarks**: Prefer semantic `<main>` / `<nav>` / `<section>` / `<header>` / `<footer>` on app shell and module chrome; preserve skip-to-content where present.

### RTL Support (`ar`, `ur`, `fa`)
- Retrieve current language direction from `useTranslation()`.
- Use CSS logical properties for layout (`text-start`, `ms-*`, `ps-*`, `border-s-*`) instead of hardcoded `left` or `right` values.

---

## 6. Performance & Bundle Optimization
- **Bundle Splitting**: Split massive external packages (Recharts, xlsx, jspdf) into deferred chunks — keep Work-tier initial bundles lean.
- **Lazy Loading**: Utilize React `lazy` and `<Suspense>` for dashboards, report panels, and non-immediate UI. Let Vite handle `modulepreload` for lazy route chunks — do not hand-write preload for every page.

- **De-prioritize Rendering**: Prefer `startTransition` / deferred mount for heavy non-critical chrome (job tray, secondary drawers).
- **Layout Shift Safeguards**: Declare explicit width/height on images, placeholders, and charts to prevent CLS.
- **Long lists**: Prefer server pagination; when virtualizing dense Work tables, use `@tanstack/react-virtual` (or a named shared wrapper around it) — **ban** one-off virtualization libraries.
- **Observer De-registration**: Clean up ResizeObservers, event listeners, and timers on unmount.
- **SEO Routing Safeguards**: Enforce `noindex` on authenticated app layout paths.

---

## 7. Responsiveness & Layout

### Mobile-First Approach
- Write default (mobile) styles first; layer up with `min-width` Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`). Ban desktop-first `max-sm:` / `max-md:` / `max-lg:` for layout width.
- **Never hardcode fixed layout widths in pixels** (e.g., `w-[1200px]`). Use relative units (`%`, `rem`, `vw`, `max-w-*`, Grid, Flexbox) so content reflows naturally.
- Root containers must never exceed `100vw`; apply `max-w-full` and `box-sizing: border-box` (`box-border`) to prevent horizontal overflow.
- **Viewport units**: Prefer `dvh`/`svh` and `safe-area-inset-*` for shell/modals/full-height chrome over raw `vh` (iOS browser chrome/keyboard). FormModal tall height → `mms-form-architecture.md`.

### MMS Breakpoints
Adhere to these thresholds — they map to the Tailwind v4 tokens already defined in `index.css`:

| Alias | Range | Tailwind prefix |
|-------|-------|-----------------|
| Mobile default | < 640 px | (base) |
| Mobile large / tablet portrait | 640 – 768 px | `sm:` |
| Tablet landscape | 768 – 1024 px | `md:` |
| Laptop / small desktop | 1024 – 1280 px | `lg:` |
| Large desktop | > 1280 px | `xl:` |

### Navigation & Interactivity
- **Mobile nav**: Convert horizontal top-nav bars to hamburger menus, slide-out drawers, or bottom navigation on small screens.
  - **Tenant AppLayout** (`Sidebar` / `MobileSidebar` / TopBar): collapse below **`lg`** (< 1024 px) — sidebar needs the wider breakpoint; authenticated e2e asserts `Open navigation menu` when `viewport.width < 1024`.
  - **Platform console** (`PlatformPageShell`): horizontal nav at `md+`; bottom nav below **`md`** (< 768 px).
  - **Module / Setup sub-tabs** (`SubTabBar`, `ResponsiveAccordionTabs`): stacked / accordion below **`lg`**; pill or underline tabs at `lg+`.
  - **FormModal tabs**: layout follows the dialog `@container` (`@md:` / `@sm:`), not the viewport — half-desktop and full-desktop keep the same chrome while the panel stays `max-w-2xl`.
- **Touch targets**: Every interactive element (button, link, icon trigger) must have a minimum tap area of `44 × 44 px` — use `min-h-11 min-w-11` (or padding equivalents that preserve that floor). Prefer shared `Button` / `ActionButton` over raw `<button>` / `<a>`.
- **Wide tables**: Use shared `Table` (already wraps `overflow-x-auto`) or wrap bare `<table>` in `overflow-x-auto max-w-full`. Prefer card-row layouts at `< md` for dense Work directories.

### Typography & Visual Media
- **Fluid type**: Use `rem`/`em`/`clamp()` for font sizes — never hardcode `px` font sizes in feature **screen** UI. Prefer rem for layout size utilities too (`max-w-[26.25rem]`, not `max-w-[420px]`).
- **Print / paper previews** (exception): certificate, Q-paper, and invoice canvas may keep physical `px`/`mm` for print fidelity. Host them in `overflow-x-auto max-w-full` (or scale like `InvoiceTemplateEditor`) so in-app preview never causes page-level horizontal scroll.
- **Charts**: Recharts `tick={{ fontSize: N }}` and explicit chart heights for CLS are allowed — wrap charts in `SafeResponsiveContainer`.
- **Images & video**: Global `index.css` sets `img`/`video`/`svg { max-width: 100%; height: auto }`. Intrinsic `width`/`height` attributes for CLS (logos) remain allowed; do not remove them when adding `max-w-full`.

### Pre-Commit Verification
Before declaring any layout implementation complete, verify:
1. UI is correct at **375 px** (mobile), **768 px** (tablet), and **1440 px** (desktop).
2. No text overlaps or clips at edge viewport widths.
3. Form controls, buttons, and inputs remain touch-friendly at small viewports.
4. RTL (`dir="rtl"`) does not introduce page-level horizontal overflow — logical CSS (`ps`/`pe`/`ms`/`me`/`start`/`end`/`text-start`).
5. Automated smoke (CI separate steps — `pnpm test:e2e tests/…`; **do not** insert a bare `--` before the path):
   - Public / unauthenticated: `e2e/tests/responsive-shell.spec.ts` (overflow + touch targets + RTL at 375 / 768 / 1440; apex + tenant login).
   - Authenticated tenant: `e2e/tests/responsive-authenticated.spec.ts` (dashboard overflow/RTL, AppLayout hamburger `< lg`, Work-route sweep with table scroll wrappers + touch targets).
   - Shared helpers: `e2e/helpers/responsive.ts`, `e2e/helpers/tenantBootstrap.ts`.
   - **Coverage note**: current smoke does not deep-open Reports/Setup builders or assert platform `md` bottom nav — extend those specs when changing those surfaces (see `mms-migration-status.md`).

### Systemic enforcement (do not fork)
- Shell overflow / fluid width: `AppLayout`, `ModulePageShell`, `PlatformPageShell`, `index.css` (`box-sizing`, `#root` / `body` `overflow-x: hidden`, `img`/`video`/`svg` `max-width: 100%`).
- Touch targets: `Button` / `ActionButton` sizes use `min-h-11 min-w-11` (44px); modal/drawer closes and mobile nav chrome match.
- Toast chrome: toast provider/viewport use `pointer-events-none`; individual toasts keep `pointer-events-auto` so empty toast layers never block shell controls.
- Tables: shared `Table` wraps with `overflow-x-auto`; bare `<table>` inside cards must sit in `overflow-x-auto max-w-full`.
- Popovers: shared `PopoverContent` defaults to `w-[min(18rem,calc(100vw-1.5rem))]` so menus never exceed the viewport.
- Breakpoints: tenant shell + module tabs use mobile-default + `lg:`; platform chrome uses `md:`; FormModal in-dialog layout uses container `@md:` / `@sm:` — avoid `max-lg:` / `max-md:` for layout width.
- Auth e2e selectors: platform setup/sign-in and force-password-change keep **stable** field ids (`#platform-setup-email`, `#platform-email`, `#current-password`, …) — do not replace with `useId()` on those screens.
- Regression tests: `e2e/tests/responsive-shell.spec.ts`, `e2e/tests/responsive-authenticated.spec.ts`.

## 8. Missing / unknown tenant hosts

Routing, copy, and locale SSOT → **`mms-settings-i18n.md`**. UI must not render tenant chrome on unregistered hosts; hard-redirect off the bad host to apex `/tenant-not-found?subdomain=…`.
