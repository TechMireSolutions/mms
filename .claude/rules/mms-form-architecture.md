---
description: Static FormModal architecture — Zod validation, React 19 defaults, decimal-as-string, RLS pointer, S3 uploads
paths:
  - "apps/frontend/src/components/ui/FormPrimitives.tsx"
  - "apps/frontend/src/components/ui/FormModal.tsx"
  - "apps/frontend/src/components/ui/DatePicker.tsx"
  - "apps/frontend/src/tenant/features/**/*Form*.tsx"
  - "apps/frontend/src/tenant/features/**/components/**"
  - "packages/shared/src/**/*Schema*.ts"
  - "apps/backend/src/db/schema.ts"
  - "apps/backend/src/routes/**/*.ts"
---

# MMS Form Architecture

Simple static forms with design-system primitives — not dynamic layout engines.

## 1. Structure & primitives

- Use `FormModal` for create/edit/builders; raw `Modal` only for confirm/preview.
- Inputs via central primitives (`Input`, `Textarea`, `Checkbox`, `FormSelect`, `DatePicker`) + `formStyles.ts` — no ad-hoc input chrome.
- **Tabs:** one tab per persisted table when a record spans tables; workflow-only tabs OK when the saved payload stays explicit.
- Ban dynamic form compilers / visual schema generators on the FE.
- Stacked pickers need descending `z-index` so overlays are not clipped.
- Dates: `<DatePicker>` only — never raw `<input type="date">`.

## 2. State & React 19 defaults

- Prefer simple controlled state (or RHF + zodResolver for complex multi-step forms). Same Zod schema as BE DTOs from `@mms/shared`.
- Initialize fields to avoid uncontrolled→controlled warnings: strings `""`, numbers/dates `null`, lists `[]`.
- Every control needs `name` + `id` (fallback `useId()`).
- Phones: single `type="tel"` input; parse E.164 on blur via `parsePhoneNumber`.
- List sections (phones/emails/…): pre-populate one empty row; strip blank rows before save.

## 3. Decimal / currency

Treat money as **strings** through input + validation — no IEEE 754 float math. Validate decimal length against precision.

## 4. RTL & errors

- Logical Tailwind (`start-0`, `border-e`, `ms-auto`) for RTL.
- Inline validation; multi-tab forms auto-focus the first invalid tab.

## 5. Security pointers

- Tenant writes: transaction-scoped RLS — `mms-data-layer.md` (do not duplicate SET LOCAL recipes here).
- S3 uploads: presigned PUT + backend `HEAD` for `Content-Length` / `Content-Type` before persisting metadata.
