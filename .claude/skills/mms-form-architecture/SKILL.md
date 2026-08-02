---
name: mms-form-architecture
description: Implements static FormModal forms with shared Zod DTOs, React 19 defaults, decimal-as-string money, tenant RLS saves, and authenticated multipart uploads. Use when building or auditing create/edit forms, FormModal tabs, DatePicker/phone fields, or upload flows.
---

# MMS Form Architecture Skill

**Rule (norms SSOT):** `mms-form-architecture.md` — shell, Zod, collection clears, uploads.

Related: `mms-ui-ux-design.md` §7 (dialog `@container`), `mms-fields.md`, `mms-data-layer.md`, `mms-settings-i18n.md`.

## Workflow

1. `FormModal` for create/edit/builders; raw `Modal` for confirm/preview only.
2. Primitives + `formStyles`; shared Zod write schema via `parseRequest` / `mapZodFormErrors` (`.strict()` preferred).
3. Init fields safely; money as strings; phones via `parsePhoneNumber` + E.164.
4. Collection tabs: `cleanContactDraft` / `mergeContactEditSavePayload` — empty arrays clear scalars (rule §3).
5. Persist with `mutateAsync`; soft-delete only via DELETE/restore routes.
6. Uploads: authenticated multipart `/api/uploads/*` + `resolveApiUrl`; auth (or short-TTL) to read.
7. On close: **focus-return** to the control that opened the dialog.

## Checklist

```
- [ ] FormModal + tall/scroll rules from rule §1
- [ ] Focus-return to opener on close
- [ ] Shared Zod write/read DTOs; soft-delete stripped on write
- [ ] formStyles + DatePicker; name + id on controls
- [ ] Empty collection arrays persist; no scalar resurrection
- [ ] canWrite gates; no fire-and-forget mutate close
- [ ] No dynamic form compiler
- [ ] Copy via t() / labelKey
```

## Do Not

- Reintroduce blueprint/`compileZodFromBlueprint` engines
- Dual-write Query + `saveCollection` on save
- Accept client soft-delete fields on create/update
- Rebuild list rows from legacy scalars when arrays are `[]`

## Done

`mms-completion-review.md` — typecheck + FE lint.
