---
trigger: model_decision
description: Static FormModal architecture — shell chrome, Zod validation, React 19 defaults, decimal-as-string, collection-list save clears, RLS pointer, local multipart uploads. Applies to tenant and platform forms.
---

# MMS Form Architecture

**Workflow skill:** `mms-form-architecture`. Shell a11y/focus-return verify → `mms-a11y-smoke`.

Simple static forms with design-system primitives — not dynamic layout engines. Responsive/a11y chrome → `mms-ui-ux-design.md` §3/§4.

## 1. FormModal shell & primitives

- Use `FormModal` for create/edit/builders; raw `Modal` only for confirm/preview. Shell owns header, icon, subtitle, tabs, progress, focus trap, and sizing. Restore focus to opening trigger on close.
- Layout repeatable entity forms with full-width single column flows (`COLLECTION_BODY`) inside `space-y-3`.
- Shared inputs use `min-h-11` via `FORM_INPUT` in `formStyles.ts`. Form cards use `FORM_CARD`; builder inputs use `FORM_INPUT_BUILDER`. Inline errors use `FieldErrorMessage` + `FORM_ERROR`.
- Input primitives: `Input`, `Textarea`, `Checkbox`, `FormSelect`, `DatePicker`, `TimePicker`, `DateTimePicker`, `EditableSelect`. Currency: text `inputMode="decimal"` (never `type="number"`). Phone: `type="tel"` + E.164. Calendar is Gregorian only; Hijri/lunar display-only.
- Tabbed forms use `<FormModal tall>` (`max-h-[43.75rem]` + `flex-1 overflow-y-auto`). Use `dvh`/`svh` (+ safe area) over `vh`. `useBodyScrollLock()` + `overscroll-contain` on scrollable modal boxes.
- Container queries (`@container`) drive responsive form layouts. Multi-column form sections leverage CSS Subgrid for aligned label-input pairings.
- One tab per persisted table when records span tables. Preserve form state across tab switches. Enabled registry fields must render (ban hard-coded allowlists). Ban client-side dynamic form compilers.
- Gate create/edit entry and save CTAs with `canWrite`. Stacked pickers need descending `z-index`.

## 2. State & React 19 defaults

- Controlled state (or RHF + zodResolver for complex multi-step forms) validated against `@mms/shared` Zod schemas.
- **RSC Actions Ban**: RSC `"use server"` actions and native `action=` POST submissions are banned. Vite SPA communicates with Fastify REST via `apiClient` and TanStack Query mutations (`useMutation`).
- Initialize fields to prevent uncontrolled→controlled warnings (`""` for strings, `[]` for arrays). Every control requires `name` + `id` (`useId()` fallback + `<label htmlFor={id}>`).
- Semantic mobile hints: Currency (`inputMode="decimal"`), Phone (`type="tel"`, `inputMode="tel"`, `autoComplete="tel"`), OTP (`inputMode="numeric"`, `autoComplete="one-time-code"`), Email (`type="email"`, `autoCapitalize="none"`), Names (`given-name`/`family-name`), and `enterKeyHint` (`next`/`done`).
- **WCAG 2.2 AA**: Never block copy-paste on OTP, 2FA, or password fields (`onPaste` prevention strictly banned).
- React 19 native `ref` prop on custom controls (`forwardRef` is banned). Phones parse/normalize to E.164 on blur/save via `parsePhoneNumber` + `normalizeToE164`.

## 3. Collection list tabs (phones / emails / addresses / socials / relationships / custom_*)

- Pre-populate one empty row; strip blanks before save via `cleanContactDraft`. Empty array is authoritative (`[]` means "clear all", not "omit").
- On edit save, merge via `mergeContactEditSavePayload`: draft collections + `syncContactScalarFields` win over spreading existing contact. Clear legacy `relationships: []` when `relationshipContacts` is emptied.
- Normalization on edit open (`normalizeContactForEdit`): hydrate from legacy scalars only if array omitted; never rebuild from scalars when array is `[]`.
- Offline sync (`mergeContactForSync`): apply `Array.isArray(source.field)` including empty arrays; clear matching scalars. Backend prepare calls `syncContactScalarFields` after phone normalize.

### 3.1 Contact-linked module writes (Students & Faculty)

- When `contactId` exists, strip `CONTACT_PROFILE_FIELDS` and guardian triad dual-writes (`normalizeContactLinkedRecord`). Do not duplicate person profile on module domain table.
- Edit forms may show hydrated contact fields; save payload links by ID (Contacts owns person data). Soft-delete and module fields (status, GR) remain on student row.

## 4. Write vs read Zod schemas

- Write schemas (POST/PUT) omit server-owned fields (`deletedAt`, `deletedBy`, `deletionReason`). Soft-delete/restore exclusively via dedicated endpoints (`mms-soft-delete`).
- Enforce Zod `.strict()` (or explicit `.strip()`) on write DTOs. Unit tests in `@mms/shared` must verify write schemas drop lifecycle delete keys.
- **Active Foreign Key Guarding**: Validators and forms assigning foreign keys (`contactId`, `sessionId`, `facultyId`) must verify referenced entities are active (`deleted_at IS NULL`) to prevent dangling references (`mms-data-layer.md` §6).
- Map Zod issues via shared `mapZodFormErrors` / `errorMap` in `@mms/shared` to `t()` keys. Ban per-form issue switches.
- Money/decimals stored and validated as strings (no float math). E.164 phones: `/^\+[1-9]\d{1,14}$/`. Date: `YYYY-MM-DD`. Datetime: ISO 8601 with offset.
- Prevent flash of empty defaults on edit: hydrate from TanStack Query `placeholderData`/settled data or Suspense.

## 5. RTL & errors

- Use logical Tailwind (`start-0`, `border-e`, `ms-auto`).
- Non-punitive validation: show inline errors on `onBlur` or post-submission (`isSubmitted`), not during initial keystrokes. Use `:user-invalid`/`:user-valid` styling.
- Error messages and descriptions use `text-wrap: pretty`. Multi-tab forms auto-focus the first invalid tab and field on submit failure. All user-facing error copy via `t()`.

## 6. Security pointers

- Tenant writes: transaction-scoped RLS (`mms-data-layer.md`). Platform writes: `authenticatePlatform` + `platformUserCan` capability checks (`mms-auth-security.md`).
- File uploads: authenticated multipart to `/api/uploads/image` or `/attachment` (local disk storage resolved via `resolveApiUrl`). Enforce magic-byte sniff, MIME allowlist, and size/dimension limits (`mms-auth-security.md`).

## 7. FormModal vs DetailSheet Boundary

- **FormModal owns write mutations**: create, edit, builder workflows, and data modifications with shared Zod validation.
- **DetailSheet owns read-only inspection**: attribute inspection, soft-delete archive banners, contact quick-actions, and audit metadata via `EntityDescriptor<T>` registries (`mms-ui-ux-design.md` §6). Never embed edit forms in DetailSheet.
