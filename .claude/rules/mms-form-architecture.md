---
description: Static FormModal architecture — Zod validation, React 19 defaults, decimal-as-string, collection-list save clears, RLS pointer, S3 uploads
paths:
  - "apps/frontend/src/components/ui/FormPrimitives.tsx"
  - "apps/frontend/src/components/ui/FormModal.tsx"
  - "apps/frontend/src/components/ui/DatePicker.tsx"
  - "apps/frontend/src/tenant/features/**/*Form*.tsx"
  - "apps/frontend/src/tenant/features/**/components/**"
  - "apps/frontend/src/tenant/features/**/hooks/use*Write*.ts"
  - "apps/frontend/src/tenant/features/**/hooks/use*Form*.ts"
  - "packages/shared/src/**/*Schema*.ts"
  - "packages/shared/src/contactFormNormalize.ts"
  - "packages/shared/src/contactItemNormalize.ts"
  - "packages/shared/src/contactSyncDiff.ts"
  - "apps/backend/src/db/schema.ts"
  - "apps/backend/src/routes/**/*.ts"
  - "apps/backend/src/services/contactServiceMutate.ts"
---

# MMS Form Architecture

Simple static forms with design-system primitives — not dynamic layout engines.

## 1. Structure & primitives

- Use `FormModal` for create/edit/builders; raw `Modal` only for confirm/preview.
- Inputs via central primitives (`Input`, `Textarea`, `Checkbox`, `FormSelect`, `DatePicker`, `EditableSelect`) + **`formStyles.ts` SSOT** — no ad-hoc input chrome.
- **Tabs / field grids:** layout follows the dialog `@container` (`@md:` / `@sm:`), not the viewport — see `mms-ui-ux-design.md` §7. Do not reintroduce viewport `md:` chrome flips inside `FormModal`.
- **Tabs:** one tab per persisted table when a record spans tables; workflow-only tabs OK when the saved payload stays explicit.
- Ban dynamic form compilers / visual schema generators on the FE.
- Option lists (gender, labels, platforms, relationships, countries/dials): tenant ContactConfig / module registries — not hardcoded `@mms/shared` `DEFAULT_*` as live form options.
- Stacked pickers need descending `z-index` so overlays are not clipped.
- Dates: `<DatePicker>` only — never raw `<input type="date">`.

## 2. State & React 19 defaults

- Prefer simple controlled state (or RHF + zodResolver for complex multi-step forms). Same Zod schema as BE DTOs from `@mms/shared`.
- Initialize fields to avoid uncontrolled→controlled warnings: strings `""`, numbers/dates `null`, lists `[]`.
- Every control needs `name` + `id` (fallback `useId()`).
- Phones: single `type="tel"` input; parse/normalize E.164 on blur/save via `parsePhoneNumber` + `normalizeToE164` from `@mms/shared`.

## 3. Collection list tabs (phones / emails / addresses / socials / relationships / custom_*)

- Pre-populate one empty row for UX; strip blank rows before save via `cleanContactDraft` (includes blank tenant `custom_*` tab rows).
- **Empty array is authoritative** — `phones: []` / `emails: []` / … means “clear all”, not “omit”.
- On edit save, merge with `mergeContactEditSavePayload` (or equivalent): draft collections + `syncContactScalarFields` must win over spreading the existing contact first (legacy scalars like `phone` / `email` / `line1` / `address` cannot resurrect deleted rows).
- When `relationshipContacts` is emptied, also clear legacy `relationships: []` on the save payload (`cleanContactDraft` / merge helper).
- Form open (`normalizeContactForEdit`): hydrate from legacy scalars only when the source **omitted** the collection array — never rebuild rows from scalars when the array is explicitly `[]`.
- Offline sync field picks (`mergeContactForSync`): apply `Array.isArray(source.phones|emails|addresses)` including empty arrays; clear matching scalars.
- Backend prepare must call `syncContactScalarFields` after phone normalize so emptied collections clear scalar mirrors — `mms-data-layer.md`.

## 4. Write vs read Zod schemas

- Prefer a **write** schema for POST/PUT (e.g. `contactWriteSchema`) that omits/strips server-owned fields such as soft-delete metadata.
- Use `z.preprocess` / `stripContactClientSoftDeleteFields` so `.passthrough()` cannot reintroduce stripped keys.
- Map Zod issues to field errors via shared `mapZodFormErrors` — do not fork per-form error mappers.
- Money/decimals as **strings** through input + validation — no IEEE 754 float math. Validate decimal length against precision.

## 5. RTL & errors

- Logical Tailwind (`start-0`, `border-e`, `ms-auto`) for RTL.
- Inline validation; multi-tab forms auto-focus the first invalid tab.
- User-facing validation copy via `t()` / `TranslatedFormMessage` — ban hardcoded English fallbacks.

## 6. Security pointers

- Tenant writes: transaction-scoped RLS — `mms-data-layer.md` (do not duplicate SET LOCAL recipes here).
- Soft-delete only via dedicated DELETE/restore routes — never from the create/edit form body.
- S3 uploads: presigned PUT + backend `HEAD` for `Content-Length` / `Content-Type` before persisting metadata.
