---
trigger: model_decision
---

# MMS UI, UX & Design System

Rules governing the strictly typed, component-driven, accessible UI/UX architecture of the Madrasa Management System (MMS).

## 1. Component & Design Token Constraints

### Primitive Component Enforcement
- **No Raw HTML Elements**: NEVER use raw UI tags (`<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, checkboxes) where design system primitives are available.
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
  - `ExportToolbar` (`@/components/ui/ExportToolbar`)
  - `SafeResponsiveContainer` (`@/components/ui/SafeResponsiveContainer`)
- Extend central primitives safely when custom variations are needed. Do not implement ad-hoc primitives in feature folders.

### Design Token Strictness
- **No Hardcoded Tailwind Values**: NEVER use hardcoded hex variables, static values, or arbitrary brackets (e.g. `bg-gray-100`, `text-blue-500`, `rounded-[2rem]`).
- **Use Semantic Design Tokens**: Use tokens mapped in `index.css` `@theme` (e.g., `text-foreground`, `text-primary`, `bg-background`, `bg-card`, `border-border`, `rounded-2xl`, `gap-3`).
- **Semantic Colors**: For success/warning/destructive affordances, use semantic tokens (e.g., `text-destructive`, `bg-destructive/10`, theme `--success`).
- **Glassmorphism**: Consistent card overlays use `backdrop-blur` and translucent borders.

---

## 2. Dialog Containment & Form Architecture (`FormModal`)

### Form Shell & Layout
- Layout repeatable entity forms using full-width single column flows (`COLLECTION_BODY`) inside `space-y-3` containers.
- Form inputs, selects, and textareas must share a standard sizing of `min-h-[44px]` (via the `INPUT` constant).

### Overlays & Scroll Controls
- **Stable Heights**: Tabbed forms must not shift height dynamically. Enforce fixed boundaries with `FormModal(tall)` (`h-[88vh] max-h-[700px]` with scrollable body `flex-1 overflow-y-auto`).
- **Scroll Containment**: Lock parent body scrolls using `useBodyScrollLock()` and apply `overscroll-contain` to scrollable modal boxes.

---

## 3. Tab Navigation & metrics

### Module Tier Accordion
Use `useModuleTierTabs()` to render exactly three tabs: `work` (operational list/drawer), `reports` (KPIs/charts), and `setup` (fields/prefs).
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
- **Focus & Trap**: Interactive components (modals, popovers, select dropdowns) must use Radix UI primitives integrated in central components.
- **Labels**: Button icons must declare `aria-label`. Associate labels with input IDs (`htmlFor` / `id`).
- **Color Contrast**: Primary texts on glass surfaces must meet WCAG AA contrast. Never convey status by color alone; always pair colors with text labels (`StatusBadge` + `t()`).
- **Name and ID attributes**: All input, select, textarea, date picker, and tag input elements must declare explicit `name` and `id` properties. If not supplied, components must fallback automatically to `React.useId()` and link label/assistive elements accordingly.

### RTL Support (`ar`, `ur`, `fa`)
- Retrieve current language direction from `useTranslation()`.
- Use CSS logical properties for layout (`text-start`, `ms-*`, `ps-*`, `border-s-*`) instead of hardcoded `left` or `right` values.

---

## 6. Performance & Bundle Optimization
- **Bundle Splitting**: Split massive external packages (such as Recharts charts library) into deferred chunks via Vite config to optimize initial page loading.
- **Lazy Loading**: Utilize React `lazy` and `<Suspense>` to load dashboard widgets, optional report panels, and non-immediate UI components dynamically.
- **De-prioritize Rendering**: Defer rendering of heavy non-critical layouts (e.g., job tray notifications, sidebar drawer menus) until the main window layout settles.
- **Layout Shift Safeguards**: Declare explicit width/height dimensions on images, placeholders, and charts to prevent container reflows and Cumulative Layout Shifts (CLS).
- **Observer De-registration**: Clean up ResizeObservers, event listeners, and timers in component unmount lifecycles to avoid performance leaks.
- **SEO Routing Safeguards**: Enforce search-engine crawler indexing bans (`noindex` headers/meta) on the application layout path root.
