---
name: mms-form-architecture
description: Implements static FormModal forms with shared Zod DTOs, React 19 defaults, decimal-as-string money, tenant RLS saves, and authenticated multipart uploads. Use when building or auditing create/edit forms, FormModal tabs, DatePicker/TimePicker/DateTimePicker/phone fields, or upload flows. Do NOT use for table/card directory views (use mms-module-work), multi-tier module tabs (use mms-module-page), or accessibility audits (use mms-a11y-smoke).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-26
---

# MMS Form Architecture Skill

**Rule (norms SSOT):** `mms-form-architecture.mdc` · `mms-core.mdc` · `mms-ui-ux-design.mdc` §4, §8 · `mms-performance.mdc` §2.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

## Accounting forms

Advisory: use [ledger controls](../mms-finance-accounting/references/ledger-controls.md) for exact amount boundaries, posting/replay behavior, and server-owned fields. Distinguish Save draft, Post, Reverse, Reconcile, and Close; a generic form submit is not authority for each transition.

Keep decimal input lossless until validated against the actual shared contract; do not parse formatted currency text with parseFloat. Preserve an idempotency identity across retry, await server confirmation, and surface period/account/conflict errors without discarding the draft. Client totals are a preview; the server validates the posted journal. Posted records expose correction actions rather than in-place financial edits.

## Anti-Patterns & Banned Operations

- ❌ **No RSC Server Actions**: MMS writes use client-side `apiClient` / `apiContract` with cookie authentication. Client `useActionState` is allowed under the owning rule when it preserves Query invalidation and the shared form contract.
- ❌ **NEVER use `forwardRef` in newly authored components**: React 19 supports `ref` directly as a component prop.
- ❌ **NEVER block paste on inputs**: Banning paste on password, OTP, or 2FA fields is strictly forbidden (WCAG 2.2 3.3.8).
- ❌ **NEVER display premature validation errors**: Avoid showing red errors on clean, untouched fields while the user types; validate on blur or submit attempt.
- ❌ **NEVER accept client soft-delete fields**: Strip `deletedAt`, `deletedBy`, `deletionReason` on create/update schemas.
- ❌ **NEVER assign soft-deleted foreign keys**: Enforce active foreign key guarding (`deleted_at IS NULL`).
- ❌ **NEVER buffer uploads into memory**: Stream files directly using Fastify `@fastify/multipart`.

## Form contract and draft lifecycle

Use `FormModalProps` in `apps/frontend/src/components/ui/FormModal.tsx`: `open`, `onSave`, `saving`, `saveDisabled`, and `error`. There are no `isOpen`, `isSubmitting`, or `onSubmit` props. `examples/TemplateFormModal.tsx` points at the shared shell instead of inventing a domain DTO.

Advisory implementation checklist:
1. Import the actual shared write schema; validate before mutation and map errors with existing helpers. Do not cast a partial draft into a write DTO or swallow rejection.
2. Define an edit-session identity. Reset draft/errors when opening a different record; preserve dirty input during background refetch and on save failure. Do not continuously overwrite the draft from Query data.
3. Await the mutation; retain input and show localized error on failure. Decide explicitly whether tabs save: `saveOnTabChange` defaults to true, so set it false for create/draft flows that should save only on explicit submission.
4. Use shared controls with names, labels, stable IDs, `aria-invalid` and connected error descriptions. For number/date inputs normalize null domain values to empty strings.
5. Keep focus on the invalid field (activate its tab first), guard accidental closure while saving, and return focus on close. Verify these behaviors; passing a prop is not proof.

## UI/UX Pro Max Form Intelligence

Advisory: query UI/UX Pro Max before authoring complex forms to align with proven UX guidelines:
```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<form-topic>" --domain ux
```
- **Error Recovery & Prevention**: Validate on blur or submit attempt; highlight invalid fields with clear, actionable copy without punitively clearing valid entries.
- **Input Sizing & Affordances**: Pair form controls with `inputMode`, `enterKeyHint`, and semantic `autoComplete` attributes.
- **Label & Helper Hierarchy**: Form labels are compact, non-duplicative, and paired with `useId()` and `aria-describedby` helper texts.

## Verification Checklist

```
- [ ] FormModal with React 19 ref-as-prop and useId() accessibility pairs
- [ ] Virtual keyboard hints provided (inputMode, enterKeyHint, autoComplete)
- [ ] Paste strictly enabled on all fields including OTP/passwords (WCAG 2.2 3.3.8)
- [ ] Non-punitive validation UX (validate on blur or submit attempt; text-wrap: pretty)
- [ ] Form UX guidelines verified (python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<topic>" --domain ux)
- [ ] Touch targets meet 44×44px floor (min-h-11 min-w-11)
- [ ] Dialog layout works at narrow widths; container queries/subgrid only when useful (advisory)
- [ ] No Server Actions or form action= posts
- [ ] Shared Zod write schema validates inputs strictly (.strict())
- [ ] Dates validated with isoDateSchema / isoDateOrEmptySchema
- [ ] Active foreign keys verified (deleted_at IS NULL)
- [ ] Focus-return restored to opener on dialog close
- [ ] Run: pnpm typecheck && cd apps/frontend && pnpm lint
```
