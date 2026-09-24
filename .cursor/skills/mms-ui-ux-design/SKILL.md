---
name: mms-ui-ux-design
description: Covers the Master Module Scaffold Layout, Tailwind CSS v4 BiDi Design Tokens, and Directional Class Refactoring Guide. Use when designing UI/UX components, enforcing logical CSS properties for BiDi layouts, or adhering to the layout contract. Do NOT use for form field validation and form modals (use mms-form-architecture) or accessibility axe testing (use mms-a11y-smoke).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-15
---

# MMS UI/UX Design System & BiDi Layout Contract

**Rules (norms SSOT):** `mms-ui-ux-design.mdc` · `mms-structure-naming.mdc` · `mms-performance.mdc`

Use this skill when designing UI/UX components, enforcing logical CSS properties for BiDi layouts, or adhering to the master layout contract.

## Anti-Patterns & Banned Operations

- ❌ **NEVER use physical directional classes**: Banned: `pl-*`, `pr-*`, `ml-*`, `mr-*`, `left-*`, `right-*`, `text-left`, `text-right`, `border-l-*`, `border-r-*`. Use BiDi logical properties exclusively (`ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`, `text-start`, `text-end`, `border-s-*`, `border-e-*`). Reference `.agent/skills/mms-ui-ux-design/references/bidi-tokens.md`; validate via `node .agent/skills/mms-ui-ux-design/scripts/check-bidi-classes.mjs`.
- ❌ **NEVER use ad-hoc hex colors or raw Tailwind palette**: Banned: `text-red-500`, `bg-blue-600`. Use semantic tokens (`var(--text-destructive)`, `var(--primary)`, `StatusBadge`, `semanticTone`).
- ❌ **NEVER unvirtualize lists > 30 items**: Long table and card lists must use `@tanstack/react-virtual`.
- ❌ **NEVER hardcode English copy**: Render all labels, tooltips, and messages through `t('key')`.

## 1. Master Module Scaffold Layout

The standard module scaffolding requires a strict three-tier page structure with integrated commands:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Breadcrumb: Academics > Students > Directory                                         │
│  PageHeader: [Icon] Students Management   [Badge: 1,240 Enrolled]   [ + Enroll Student] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Tabs: [ 💼 Work (Directory) ]      [ 📊 Reports & Analytics ]      [ ⚙️ Setup & Fields ] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  FilterToolbar:                                                                        │
│  [ 🔍 Search name, roll no (/) ]  [ Grade: All ▾ ]  [ Status: Active ▾ ]  [ ⊞ Table|Card ]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  Dynamic Slot:                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Table Header (Sticky)                                                           │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │ Virtualized Row Items (TanStack Virtual)                                         │  │
│  │ - Row 1: Muhammad Zaid | Roll #104 | Hifz Year 2 | Active Status                 │  │
│  │ - Row 2: Ibrahim Khalil | Roll #105 | Nazira Year 1 | Active Status              │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Dock: [ 3 Students Selected ]  [ Assign Section ]  [ Print Cards ]  [ Deselect (Esc) ] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Tailwind CSS v4 BiDi Design Tokens

MMS uses strict `@theme` variables for cross-language design purity:

```css
/* apps/frontend/src/index.css */
@theme {
  --font-sans: 'Geist', 'Inter', system-ui, sans-serif;
  --font-arabic: 'Readex Pro', 'Cairo', system-ui;
  --font-urdu: 'Noto Nastaliq Urdu', 'Gulzar', serif;
  --font-persian: 'Vazirmatn', system-ui;

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}

:root {
  --bg-app: oklch(0.98 0.005 240);
  --bg-surface: oklch(1.0 0 0);
  --bg-subtle: oklch(0.96 0.01 240);
  --border-subtle: oklch(0.90 0.01 240);
  --border-strong: oklch(0.80 0.02 240);

  --text-primary: oklch(0.15 0.02 240);
  --text-secondary: oklch(0.45 0.02 240);
  --text-muted: oklch(0.65 0.01 240);

  --primary: oklch(0.45 0.15 155); /* Emerald Corporate */
  --primary-foreground: oklch(0.98 0 0);
}
```

### Direction-Aware Typography Overrides
Ensure these rules apply globally to adapt font families and text rendering automatically based on the language script:
```css
[dir="rtl"] {
  font-family: var(--font-arabic);
  letter-spacing: 0em;
}

[dir="rtl"][lang="ur"] {
  font-family: var(--font-urdu);
  line-height: 2.2;
}

[dir="rtl"][lang="fa"] {
  font-family: var(--font-persian);
}
```

## 3. Directional Class Refactoring Guide

Enforce logical CSS properties across all shared UI primitives. **The physical→logical class mapping is owned by the rule — see `mms-ui-ux-design.mdc` §2** (`pl-*`→`ps-*`, `ml-*`→`ms-*`, `left-*`→`inset-inline-start-*`, `text-left`→`text-start`, `border-l-*`→`border-s-*`). Do not re-author the table here; it drifted the last time it was duplicated.

The enforcement is mechanical: `mms-bidi/no-physical-directional-classes` (ESLint, error level) inspects JSX `className` in `.tsx` files. Class tokens held in `.ts` files (e.g. `formStyles.ts`) are outside its reach — check those by eye.

## 4. Modern 2026 UI/UX Reference

For deep-dive implementation details on modern 2026 capabilities (Top-layer `@starting-style`, CSS Anchor positioning, CSS Subgrid, CSS Container Queries, and WCAG 2.2 AA criteria), consult `.agent/skills/mms-ui-ux-design/references/modern-ui-ux-2026.md`.

## Checklist

```
- [ ] Module follows the 3-tier structure (Work, Reports, Setup)
- [ ] No physical spacing classes are used (e.g., used `ps-` instead of `pl-`)
- [ ] No physical positioning classes are used (e.g., used `inset-inline-start-` instead of `left-`)
- [ ] Typography follows language-aware overrides (Geist vs Readex Pro vs Noto Nastaliq Urdu)
- [ ] Headings use `text-wrap: balance` and body/alerts use `text-wrap: pretty`
- [ ] Mixed-script user content uses `dir="auto"` or `unicode-bidi: plaintext`
- [ ] Card and dialog sub-layouts use `@container` queries and CSS Subgrid
- [ ] Interactive touch targets meet the 44×44px floor (`min-h-11 min-w-11`)
- [ ] Sticky headers/docks apply `scroll-padding` to prevent obscuring focused elements (WCAG 2.2 2.4.11)
- [ ] Dragging interactions provide keyboard-accessible single-pointer alternatives (WCAG 2.2 2.5.7)
- [ ] Auth and input fields strictly preserve pasteability (WCAG 2.2 3.3.8)
- [ ] E2E tests include testing the UI on both LTR (English) and RTL (Urdu/Arabic) modes
- [ ] Tables, lists, and card feeds > 30 items use `@tanstack/react-virtual` virtualization — `mms-performance.mdc`
- [ ] Images and charts have explicit width/height dimensions for CLS = 0 — `mms-performance.mdc`
```

## Done
UI matches BiDi Visual Assertion test criteria and successfully renders with zero layout shifts on Nastaliq fonts.
