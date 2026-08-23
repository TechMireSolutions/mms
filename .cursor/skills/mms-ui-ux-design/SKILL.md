---
name: mms-ui-ux-design
description: Covers the Master Module Scaffold Layout, Tailwind CSS v4 BiDi Design Tokens, and Directional Class Refactoring Guide. Use this skill when designing UI/UX components, enforcing logical CSS properties for BiDi layouts, or adhering to the layout contract.
---

# MMS UI/UX Design System & BiDi Layout Contract

**Rules (norms SSOT):** `mms-ui-ux-design.mdc` · `mms-structure-naming.mdc`

Use this skill when designing UI/UX components, enforcing logical CSS properties for BiDi layouts, or adhering to the master layout contract.

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
  --font-farsi: 'Vazirmatn', system-ui;

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
  font-family: var(--font-farsi);
}
```

## 3. Directional Class Refactoring Guide

Enforce logical CSS properties across all shared UI primitives. **Do not use physical classes** (`pl-`, `pr-`, `left-`, `right-`).

| Physical Class (Forbidden) | Logical Class (Required) | Behavior |
| --- | --- | --- |
| `pl-4`, `pr-2` | `ps-4`, `pe-2` | Inset padding aligns to start/end based on reading direction. |
| `ml-auto`, `mr-2` | `ms-auto`, `me-2` | Margins shift appropriately between LTR and RTL. |
| `left-0`, `right-4` | `inset-inline-start-0`, `inset-inline-end-4` | Positions absolute and fixed elements relative to current script. |
| `text-left`, `text-right` | `text-start`, `text-end` | Text aligns to reading start/end boundary. |
| `border-l-2`, `border-r-0` | `border-s-2`, `border-e-0` | Accent borders attach to logical start side. |

## Checklist

```
- [ ] Module follows the 3-tier structure (Work, Reports, Setup)
- [ ] No physical spacing classes are used (e.g., used `ps-` instead of `pl-`)
- [ ] No physical positioning classes are used (e.g., used `inset-inline-start-` instead of `left-`)
- [ ] Typography follows language-aware overrides (Geist vs Readex Pro vs Noto Nastaliq Urdu)
- [ ] E2E tests include testing the UI on both LTR (English) and RTL (Urdu/Arabic) modes
```

## Done
UI matches BiDi Visual Assertion test criteria and successfully renders with zero layout shifts on Nastaliq fonts.
