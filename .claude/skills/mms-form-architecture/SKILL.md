---
name: mms-form-architecture
description: Implements static FormModal forms with shared Zod DTOs, React 19 defaults, decimal-as-string money, tenant RLS saves, and authenticated multipart uploads. Use when building or auditing create/edit forms, FormModal tabs, DatePicker/phone fields, or upload flows.
---

# MMS Form Architecture Skill

**Rule:** `mms-form-architecture.md` — static FormModal forms (not dynamic layout engines / blueprints).

## Workflow

1. Use `FormModal` for create/edit/builders; raw `Modal` only for confirm/preview.
2. Bind inputs via design-system primitives + `formStyles` (`Input`, `Textarea`, `Checkbox`, `FormSelect`, `DatePicker`).
3. Validate with the same Zod schema from `@mms/shared` that BE `parseRequest` uses — prefer **write** schemas that strip server-owned fields (soft-delete metadata).
4. Map Zod issues with shared `mapZodFormErrors`; chrome via `formStyles.ts`.
5. Initialize fields: strings `""`, numbers/dates `null`, lists `[]` (React 19 uncontrolled→controlled safety).
6. Money/decimals as **strings** — no float math.
7. Phones: single `type="tel"`; parse/normalize with `parsePhoneNumber` + `normalizeToE164`.
8. Collection tabs: `cleanContactDraft` before save; edit merge via `mergeContactEditSavePayload` so empty arrays clear legacy scalars (`mms-form-architecture.md` §3).
9. Persist via REST mutations (`mutateAsync`); tenant writes use RLS `SET LOCAL` — `mms-data-layer.md`.
10. Soft-delete only via DELETE/restore routes — never from the form body.
11. Uploads: authenticated multipart `/api/uploads/image|attachment` (local disk); resolve URLs via `resolveApiUrl` — no S3/presign.

## Checklist

```
- [ ] FormModal (not ad-hoc dialog) for entity forms
- [ ] Shared Zod write/read DTOs — no forked FE/BE shapes; soft-delete stripped on write
- [ ] formStyles + primitives + DatePicker; no raw <input type="date">
- [ ] mapZodFormErrors for field errors
- [ ] name + id on every control (useId fallback)
- [ ] Logical CSS for RTL
- [ ] Mobile-usable: `FORM_INPUT` / controls `min-h-11`; FormModal tab/field layout uses container `@md:` / `@sm:` (dialog width), not viewport `md:` — `mms-ui-ux-design.md` §7
- [ ] Inline validation; focus first invalid tab
- [ ] Contact (and similar) option dropdowns: config/registry lists + `EditableSelect` `onUpdateOptions` — ban runtime `DEFAULT_*` / `GENDERS` fallbacks in form tabs
- [ ] Collection deletes persist: empty arrays + scalar sync; no existing-contact spread resurrection
- [ ] No dynamic form compiler / blueprint engine
```

## Do Not

- Reintroduce blueprint/`compileZodFromBlueprint` engines
- Dual-write Query + `saveCollection` on save
- Accept client `deletedAt` / `deletedBy` / `deletionReason` on create/update
- Hardcoded labels — use `t()` / `labelKey`
- Rebuild phones/emails/addresses from legacy scalars when the collection array is explicitly `[]`
- Spread `editContact` / existing row over a cleared draft so stale `phone` / `email` / `line1` come back

## Done

`mms-completion-review.md` — typecheck + FE lint. Related: `mms-fields-registry`, `mms-ui-ux-design.md`, `mms-settings-i18n.md`.
