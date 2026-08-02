---
trigger: model_decision
---

# MMS Form Architecture

**Workflow skill:** `mms-form-architecture`. Shell a11y/focus-return verify → `mms-a11y-smoke`.

Simple static forms with design-system primitives — not dynamic layout engines. Responsive/a11y chrome around the dialog → `mms-ui-ux-design.md` §5/§7.

## 1. FormModal shell & primitives

- Use `FormModal` for create/edit/builders; raw `Modal` only for confirm/preview.
- Shell owns header, icon, subtitle, tabs, progress, focus trap, sizing, and mobile behavior.
- **Focus return**: On close, restore focus to the control that opened the dialog/drawer when practical.
- Layout repeatable entity forms using full-width single column flows (`COLLECTION_BODY`) inside `space-y-3` containers.
- Form inputs share `min-h-11` via `FORM_INPUT` in `formStyles.ts` SSOT — no ad-hoc input chrome.
- Inputs via central primitives (`Input`, `Textarea`, `Checkbox`, `FormSelect`, `DatePicker`, `EditableSelect`).
- **Stable Heights**: Tabbed forms use `<FormModal tall>` (`h-[88vh] max-h-[43.75rem]` with scrollable body `flex-1 overflow-y-auto`).
- **Scroll Containment**: `useBodyScrollLock()` + `overscroll-contain` on scrollable modal boxes.
- **Tabs / field grids:** layout follows the dialog `@container` (`@md:` / `@sm:`), not the viewport — `mms-ui-ux-design.md` §7.
- Long forms split major tasks into purposeful `FormModal` tabs; preserve form state across tab switches.
- **Tabs:** one tab per persisted table when a record spans tables; workflow-only tabs OK when the saved payload stays explicit. Visible tabs follow Setup enablement SSOT — `mms-fields.md`.
- **Enabled fields must render**: if validation can require a registry/custom field, the form must show a control (and the drawer a read row). Ban hard-coded key allowlists.
- Ban dynamic form compilers / visual schema generators on the FE.
- Option lists: tenant ContactConfig / module registries — not hardcoded `@mms/shared` `DEFAULT_*` as live form options.
- Stacked pickers need descending `z-index` so overlays are not clipped.
- Dates: `<DatePicker>` only — never raw `<input type="date">`.
- Gate create/edit entry and save CTAs with `canWrite` — do not toast success / close when the mutation never ran.

## 2. State & React 19 defaults

- Prefer simple controlled state (or RHF + zodResolver for complex multi-step forms). Same Zod schema as BE DTOs from `@mms/shared`.
- Initialize fields to avoid uncontrolled→controlled warnings: strings `""`, numbers/dates `null`, lists `[]`.
- Every control needs `name` + `id` (fallback `useId()`).
- Phones: single `type="tel"` input; parse/normalize E.164 on blur/save via `parsePhoneNumber` + `normalizeToE164` from `@mms/shared`.

## 3. Collection list tabs (phones / emails / addresses / socials / relationships / custom_*)

- Pre-populate one empty row for UX; strip blank rows before save via `cleanContactDraft` (includes blank tenant `custom_*` tab rows).
- **Empty array is authoritative** — `phones: []` / `emails: []` / … means “clear all”, not “omit”.
- On edit save, merge with `mergeContactEditSavePayload` (or equivalent): draft collections + `syncContactScalarFields` must win over spreading the existing contact first.
- When `relationshipContacts` is emptied, also clear legacy `relationships: []` on the save payload.
- Form open (`normalizeContactForEdit`): hydrate from legacy scalars only when the source **omitted** the collection array — never rebuild rows from scalars when the array is explicitly `[]`.
- Offline sync field picks (`mergeContactForSync`): apply `Array.isArray(source.phones|emails|addresses)` including empty arrays; clear matching scalars.
- Backend prepare must call `syncContactScalarFields` after phone normalize — `mms-data-layer.md`.

## 4. Write vs read Zod schemas

- Prefer a **write** schema for POST/PUT that omits/strips server-owned fields such as soft-delete metadata.
- Prefer Zod `.strict()` on write DTOs (or explicit `.strip()` with documented exceptions) — unknown keys must not persist — `mms-api-interface.md`.
- Use `z.preprocess` / `stripContactClientSoftDeleteFields` so `.passthrough()` cannot reintroduce stripped keys.
- Map Zod issues via shared `mapZodFormErrors` — prefer a shared Zod `errorMap` / issue-code → `t()` mapping in `@mms/shared` (also used by `parseRequest` messages); ban per-form string switches on `ZodIssue.code`.
- Money/decimals as **strings** through input + validation — no IEEE 754 float math.
- **Loaded edit records**: Avoid flash of empty defaults — hydrate from Query (`placeholderData` / settled data) or a Suspense boundary; never optimistic-empty overwrite of a server row.

## 5. RTL & errors

- Logical Tailwind (`start-0`, `border-e`, `ms-auto`) for RTL.
- Inline validation; multi-tab forms auto-focus the first invalid tab.
- User-facing validation copy via `t()` / `TranslatedFormMessage` — ban hardcoded English fallbacks.

## 6. Security pointers

- Tenant writes: transaction-scoped RLS — `mms-data-layer.md`.
- Soft-delete only via dedicated DELETE/restore routes — never from the create/edit form body.
- File uploads: authenticated multipart to `/api/uploads/image` or `/api/uploads/attachment` (local disk under `/uploads/…`); resolve returned URLs via `resolveApiUrl` — no S3/presign in tree.
- Local `/uploads/*`: require auth (or signed short-TTL) to read; sniff/allowlist MIME + size on write; do not invent public long-lived CDN URLs.
