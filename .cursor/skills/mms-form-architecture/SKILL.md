---
name: mms-form-architecture
description: Implements static FormModal forms with shared Zod DTOs, React 19 defaults, decimal-as-string money, tenant RLS saves, and zero-trust S3 uploads. Use when building or auditing create/edit forms, FormModal tabs, DatePicker/phone fields, or upload flows.
---

# MMS Form Architecture Skill

**Rule:** `mms-form-architecture.mdc` — static FormModal forms (not dynamic layout engines / blueprints).

## Workflow

1. Use `FormModal` for create/edit/builders; raw `Modal` only for confirm/preview.
2. Bind inputs via design-system primitives + `formStyles` (`Input`, `Textarea`, `Checkbox`, `FormSelect`, `DatePicker`).
3. Validate with the same Zod schema from `@mms/shared` that BE `parseRequest` uses — prefer **write** schemas that strip server-owned fields (soft-delete metadata).
4. Map Zod issues with shared `mapZodFormErrors`; chrome via `formStyles.ts`.
5. Initialize fields: strings `""`, numbers/dates `null`, lists `[]` (React 19 uncontrolled→controlled safety).
6. Money/decimals as **strings** — no float math.
7. Phones: single `type="tel"`; parse/normalize with `parsePhoneNumber` + `normalizeToE164`.
8. Persist via REST mutations (`mutateAsync`); tenant writes use RLS `SET LOCAL` — `mms-data-layer.mdc`.
9. Soft-delete only via DELETE/restore routes — never from the form body.
10. S3: presigned upload + backend `HEAD` before metadata save.

## Checklist

```
- [ ] FormModal (not ad-hoc dialog) for entity forms
- [ ] Shared Zod write/read DTOs — no forked FE/BE shapes; soft-delete stripped on write
- [ ] formStyles + primitives + DatePicker; no raw <input type="date">
- [ ] mapZodFormErrors for field errors
- [ ] name + id on every control (useId fallback)
- [ ] Logical CSS for RTL
- [ ] Mobile-usable: `FORM_INPUT` / controls `min-h-11`; FormModal tab chrome may switch at `md` (intentional vs module `lg` — `mms-ui-ux-design.mdc` §7)
- [ ] Inline validation; focus first invalid tab
- [ ] No dynamic form compiler / blueprint engine
```

## Do Not

- Reintroduce blueprint/`compileZodFromBlueprint` engines
- Dual-write Query + `saveCollection` on save
- Accept client `deletedAt` / `deletedBy` / `deletionReason` on create/update
- Hardcoded labels — use `t()` / `labelKey`

## Done

`mms-completion-review.mdc` — typecheck + FE lint. Related: `mms-fields-registry`, `mms-ui-ux-design.mdc`, `mms-settings-i18n.mdc`.
