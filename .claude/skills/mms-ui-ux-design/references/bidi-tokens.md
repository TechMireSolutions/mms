# MMS BiDi Layout Tokens & Directional Refactoring Reference

**Rules SSOT:** `mms-ui-ux-design.md` · `mms-structure-naming.md`

## Physical vs Logical Class Mapping

| Physical Property (BANNED ❌) | BiDi Logical Property (REQUIRED ✅) |
|---|---|
| `pl-*`, `pr-*` | `ps-*`, `pe-*` (padding-inline-start / end) |
| `ml-*`, `mr-*` | `ms-*`, `me-*` (margin-inline-start / end) |
| `left-*`, `right-*` | `start-*`, `end-*` (inset-inline-start / end) |
| `text-left`, `text-right` | `text-start`, `text-end` |
| `border-l-*`, `border-r-*` | `border-s-*`, `border-e-*` |
| `rounded-l-*`, `rounded-r-*` | `rounded-s-*`, `rounded-e-*` |
| `scroll-pl-*`, `scroll-pr-*` | `scroll-ps-*`, `scroll-pe-*` |

## Directional Icons & Mirroring
- Directional icons (arrows, chevrons, back/forward) must use `rtl:rotate-180` or the `<DirectionalIcon>` wrapper.
- Symmetrical icons (search, user, settings, calendar) must NOT be rotated.

## Font Stacks by Locale
- **Arabic / Persian**: `font-[family-name:var(--font-arabic)]` / `Cairo` / `Amiri`
- **Urdu**: `font-[family-name:var(--font-urdu)]` / `Noto Nastaliq Urdu` with increased line-height multiplier (`leading-relaxed` / `leading-loose`) to prevent diacritic clipping.
