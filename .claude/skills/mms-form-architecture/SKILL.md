---
name: mms-form-architecture
description: Implements static FormModal forms with shared Zod DTOs, React 19 defaults, decimal-as-string money, tenant RLS saves, and zero-trust S3 uploads. Use when building or auditing create/edit forms, FormModal tabs, DatePicker/phone fields, or upload flows.
---

# MMS Form Architecture Skill

**Rule:** `mms-form-architecture.md` — static FormModal forms (not dynamic layout engines / blueprints).

## Workflow

1. Use `FormModal` for create/edit/builders; raw `Modal` only for confirm/preview.
2. Bind inputs via design-system primitives + `formStyles` (`Input`, `Textarea`, `Checkbox`, `FormSelect`, `DatePicker`).
3. Validate with the same Zod schema from `@mms/shared` that BE `parseRequest` uses.
4. Initialize fields: strings `""`, numbers/dates `null`, lists `[]` (React 19 uncontrolled→controlled safety).
5. Money/decimals as **strings** — no float math.
6. Phones: single `type="tel"`; parse with `parsePhoneNumber` on blur.
7. Persist via REST mutations (`mutateAsync`); tenant writes use RLS `SET LOCAL` — `mms-data-layer.md`.
8. S3: presigned upload + backend `HEAD` before metadata save.

## Checklist

```
- [ ] FormModal (not ad-hoc dialog) for entity forms
- [ ] Shared Zod DTO — no forked FE/BE shapes
- [ ] Primitives + DatePicker; no raw <input type="date">
- [ ] name + id on every control (useId fallback)
- [ ] Logical CSS for RTL
- [ ] Mobile-usable: `FORM_INPUT` / controls `min-h-11`; FormModal tab chrome may switch at `md` (intentional vs module `lg` — `mms-ui-ux-design.md` §7)
- [ ] Inline validation; focus first invalid tab
- [ ] No dynamic form compiler / blueprint engine
```

## Do Not

- Reintroduce blueprint/`compileZodFromBlueprint` engines
- Dual-write Query + `saveCollection` on save
- Hardcoded labels — use `t()` / `labelKey`

## Done

`mms-completion-review.md` — typecheck + FE lint. Related: `mms-fields-registry`, `mms-ui-ux-design.md`, `mms-settings-i18n.md`.
