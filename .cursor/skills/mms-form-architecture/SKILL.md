---
name: mms-form-architecture
description: Implements static FormModal forms with shared Zod DTOs, React 19 defaults, decimal-as-string money, tenant RLS saves, and authenticated multipart uploads. Use when building or auditing create/edit forms, FormModal tabs, DatePicker/TimePicker/DateTimePicker/phone fields, or upload flows.
---

# MMS Form Architecture Skill

**Rule (norms SSOT):** `mms-form-architecture.mdc` — shell, Zod, collection clears, uploads.

Related: `mms-ui-ux-design.mdc` §7 (dialog `@container`), `mms-fields.mdc`, `mms-data-layer.mdc`, `mms-settings-i18n.mdc`.

## Workflow

1. `FormModal` for create/edit/builders; raw `Modal` for confirm/preview only.
2. Primitives + `formStyles` (`FORM_INPUT`, `FORM_ERROR`, `FORM_CARD`, `FORM_INPUT_BUILDER`); inline errors via `FieldErrorMessage`; shared Zod write schema via `parseRequest` / `mapZodFormErrors` (`.strict()` preferred).
3. Init fields safely; money as strings; phones via `parsePhoneNumber` + E.164. **Ban** Server Actions / `useActionState` / form `action=` for tenant writes.
4. Collection tabs: `cleanContactDraft` / `mergeContactEditSavePayload` — empty arrays clear scalars (rule §3).
5. Persist with `mutateAsync`; soft-delete only via DELETE/restore routes.
6. Uploads: authenticated multipart `/api/uploads/*` + `resolveApiUrl`; magic-byte + size + dimension/page caps; auth (or short-TTL) to read.
7. Tall FormModal: prefer `dvh`/`svh` + safe-area when touching chrome.
8. On close: **focus-return** to the control that opened the dialog.

## Checklist

```
- [ ] FormModal + tall/scroll rules from rule §1 (dvh/svh when touching)
- [ ] Focus-return to opener on close
- [ ] No Server Actions / useActionState for tenant writes
- [ ] Shared Zod write/read DTOs; soft-delete stripped on write
- [ ] formStyles + DatePicker / TimePicker / DateTimePicker; name + id on controls; field errors via `FieldErrorMessage` / `FORM_ERROR`
- [ ] Empty collection arrays persist; no scalar resurrection
- [ ] canWrite gates; no fire-and-forget mutate close
- [ ] Upload sniff + size + dimension/page caps
- [ ] No dynamic form compiler
- [ ] Copy via t() / labelKey
```

## Do Not

- Reintroduce blueprint/`compileZodFromBlueprint` engines
- Dual-write Query + `saveCollection` on save
- Accept client soft-delete fields on create/update
- Rebuild list rows from legacy scalars when arrays are `[]`
- Invent React Server Actions posts against the Fastify cookie API

## Done

`mms-completion-review.mdc` — typecheck + FE lint.
