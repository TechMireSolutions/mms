---
name: mms-fields-registry
description: Adds or changes field/tab registries, module Setup Fields UI, and field configuration per mms-fields.mdc. Use when working with custom fields, system tabs, field types, column registries, field delete guards, or useSortedFields. Do NOT use for core entity Drizzle database migrations (use mms-schema-migrate) or generic form modal layouts (use mms-form-architecture).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-24
---

# MMS Field & Tab Registry

**Rules (norms SSOT):** `mms-fields.mdc` · `mms-module-architecture.mdc` §4 · `mms-data-layer.mdc`.

## 1. Field & Tab Contracts

- **Field Schema**: `{ key, label, labelKey?, type, enabled, order, options, permissions, defaultValue, required?, unique? }`.
- **Tab Schema**: `{ key, label, labelKey?, icon, enabled, order, permissions, description, color, isSystem }`.
- **Metadata Rule**: `isSystem` is informative metadata only; never branch core rendering or domain behaviour on it.

## 2. Field Persistence Gate

Every new or modified field must complete the full architectural pipeline:
`@shared type → DEFAULT_* + merge → typed REST read → typed REST write → UI binding → seeds (if default)`
- **Lookups**: Typed lookup endpoints (e.g., `/api/contacts/lookups`) — never `saveCollection`.
- **Registry Configs**: Typed `{module}_field_configs` endpoints — never `saveObject`.
- **Custom Tabs**: Typed `/api/custom-tabs` — avoid dual-writing tab definitions into field configs.

## 3. Delete Guards & Dependencies

- **Dependency Pre-Check**: Before deleting a field or tab, check dependencies using `getContactFieldRemovalIssues()` or module equivalent.
- **Safety Blocks**: Prohibit deleting initial seed fields, active column registry keys, or fields actively referenced in duplicate detection or contact records.

## 4. UI Layout & Parity

- **Layout Hook**: Manage column visibility and width persistence using `useModuleColumnLayout`. Pass `isColumnVisible` down to table and card views.
- **Form & Drawer Parity**: Every enabled field in the registry must render a valid control in the FormModal and a corresponding read row in the detail drawer. Never drop unknown fields silently.

## 5. Verification

```bash
pnpm typecheck
cd apps/frontend && pnpm lint
```
