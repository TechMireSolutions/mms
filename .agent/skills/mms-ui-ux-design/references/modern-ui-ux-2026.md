# Modern 2026 UI/UX Architectural Patterns

**Rules SSOT:** `mms-ui-ux-design.md` · `mms-form-architecture.md` · `mms-performance.md`

This reference provides implementation patterns for modern 2026 web capabilities adopted in MMS across tenant and platform interfaces.

---

## 1. Top-Layer Overlays & `@starting-style` Animations

Modal dialogs (`FormModal`), drawers (`DetailDrawerShell`), and contextual flyouts use the browser's top layer to avoid z-index collisions and parent stacking context issues.

### Top-Layer Transition Pattern

```css
/* apps/frontend/src/index.css */
@layer components {
  /* Smooth dialog & drawer entrance without JS height-tracking hacks */
  dialog[open],
  [popover]:popover-open {
    opacity: 1;
    transform: scale(1);
    transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                overlay 0.2s allow-discrete,
                display 0.2s allow-discrete;
  }

  @starting-style {
    dialog[open],
    [popover]:popover-open {
      opacity: 0;
      transform: scale(0.96);
    }
  }

  dialog::backdrop {
    background-color: rgb(0 0 0 / 0.5);
    backdrop-filter: blur(4px);
    transition: display 0.2s allow-discrete,
                overlay 0.2s allow-discrete,
                background-color 0.2s ease-out;
  }

  @starting-style {
    dialog[open]::backdrop {
      background-color: rgb(0 0 0 / 0);
    }
  }
}
```

---

## 2. CSS Container Queries (`@container`)

Modular UI components must adapt to their immediate container's available width rather than the viewport.

### Directory Cards & Form Modals

```css
/* Card container query definition */
.directory-card-wrapper {
  container-type: inline-size;
  container-name: directory-card;
}

/* Internal layout adjustments based on card container width */
@container directory-card (min-width: 320px) {
  .card-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container directory-card (min-width: 480px) {
  .card-meta-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

In Tailwind v4, use `@container` on parent cards and container query modifiers (`@sm:`, `@md:`) on child elements.

---

## 3. CSS Subgrid for Visual Alignment

When directory cards or form sections render in a CSS grid, sibling items often have mismatched content lengths (e.g. differing badge counts or multi-line titles). Use CSS Subgrid to align children across rows:

```css
/* Aligns card header, body metadata, and footer across grid items */
.directory-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-auto-rows: auto;
}

.directory-entity-card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
}
```

---

## 4. Perceptually Uniform Color & High-Contrast Mode

### OKLCH Color Space & Native Tinting

MMS defines primary palette coordinates in `oklch()` to prevent perceptual brightness shifts when switching hues:

```css
/* Color mixing for hover/active states without opacity class chains */
.interactive-surface {
  background-color: var(--card);
  transition: background-color 0.15s ease-out;
}

.interactive-surface:hover {
  background-color: color-mix(in srgb, var(--primary) 12%, var(--card));
}
```

### Windows High Contrast (`forced-colors: active`)

Ensure custom boundaries, icons, and focus rings remain fully visible:

```css
@media (forced-colors: active) {
  .status-badge,
  .button-outline,
  .directory-card {
    border: 1px solid CanvasText;
  }
  
  :focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
```

---

## 5. WCAG 2.2 AA Verification Matrix

| Criterion | Requirement | MMS Implementation |
|---|---|---|
| **2.4.11 Focus Appearance** | Minimum 2px ring, ≥ 3:1 contrast against adjacent surface. Non-obscured by floating bars. | `focus-visible:ring-2 focus-visible:ring-ring` + `scroll-padding-top` on scrollable containers. |
| **2.5.8 Target Size (Minimum)** | Interactive target floor of at least 24×24px, with 44×44px on mobile viewports. | `min-h-11 min-w-11` (44×44px) on buttons, icon buttons, inputs, links (`DirectoryCardFooterActions`). |
| **2.5.7 Dragging Movements** | Any drag interaction must have a single-pointer accessible alternative. | Column customizer and widget reordering provide Move Up / Move Down buttons alongside drag handles. |
| **3.3.7 Redundant Entry** | Information entered previously must not be re-requested in the same user session. | Enrollment wizard and contact linking prefill existing parent/student data automatically. |
| **3.3.8 Accessible Authentication** | Do not block paste on password, OTP, or 2FA entry fields. | Strict ban on `onPaste={(e) => e.preventDefault()}` on all authentication and input components. |
