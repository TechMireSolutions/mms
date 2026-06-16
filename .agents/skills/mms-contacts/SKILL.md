---
name: mms-contacts
description: Implements Contact module features — forms, Kanban, WhatsApp status, field registry, ContactConfigContext, backend /api/contacts REST. Use when editing contacts, CRM, phone numbers, avatars, duplicate detection, or contact settings.
---

# MMS Contacts Workflow

## Key files

| Area | Path |
|------|------|
| Page | `apps/frontend/src/pages/Contacts.tsx` |
| Query hooks | `apps/frontend/src/hooks/useContacts.ts` |
| Types | `packages/shared/src/contactTypes.ts` |
| Config context | `apps/frontend/src/lib/ContactConfigContext.tsx` |
| Field store | `apps/frontend/src/lib/contactFieldsStore.ts` |
| Form primitives | `apps/frontend/src/components/contacts/form/FormPrimitives.tsx` |
| Backend REST | `apps/backend/src/routes/contacts.ts` |
| Zod validation | `apps/backend/src/validation/contactSchemas.ts` |
| WhatsApp | `apps/backend/src/services/whatsApp*.ts` |

## Backend API (`/api/contacts`)

All routes require `authenticateTenant`. Mutations require `canWriteCollection(user, 'contacts')`.

| Route | Auth | Notes |
|-------|------|-------|
| `GET /` | Tenant JWT | List contacts |
| `GET /count` | Tenant JWT | Count |
| `POST /` | Write RBAC | E.164 normalize, title-case, persist, WhatsApp enqueue |
| `PUT /:id` | Write RBAC | Update + WhatsApp side effects |
| `DELETE /:id` | Write RBAC | Remove from collection |
| `GET /:id/whatsapp-status` | Tenant JWT | Status + UI indicator metadata |

Data access: `dbSyncService.fetchCollection` / `persistCollection` (tenant-scoped automatically).

Tests must use tenant host: `headers: { host: 'demo.localhost' }`.

## Workflow: add form field

1. Add to field registry in `@mms/shared` or `contact_field_config` object
2. Render via `FormPrimitives` + `useSortedFields` — not new `DynamicField`
3. If new tab needed: tab registry entry + `*Tab.tsx` content component
4. Persist custom field values on `Contact` JSON document

## Workflow: phone / WhatsApp

1. Normalize E.164 with `parsePhoneNumber` (`@mms/shared`) on save
2. Backend `POST` / `PUT /api/contacts` triggers verification via `handleContactSaveOrUpdate`
3. UI reads `GET /api/contacts/:id/whatsapp-status`
4. **Never** add manual WhatsApp toggle in `PhoneTab`

## Provider rule

`ContactConfigProvider` mounts **only** in `App.tsx`. Remove nesting from Contacts/Settings when touching those files.

## Frontend data layer

| Read | Write |
|------|-------|
| `useContactsCollection()` or `useContacts()` | `useContactMutations()` (`upsertContact`, `updateContact`, `deleteContact`) |

`fetchContacts` syncs to localStorage via `saveCollection` for dashboard KPI widgets. Do not add parallel `saveCollection` writes in page handlers.

## i18n debt

New copy → `t('contacts.*')` in `appTranslations`. Legacy `uiStrings` (~24 files) — do not add new keys; migrate when touching.

## Do not reintroduce

`DynamicField.tsx`, `TabCustomFields.tsx`, second `DraggableFieldList` under `contacts/settings/`

## Rules

`.cursor/rules/mms-contacts.mdc`, `mms-backend.mdc`, `mms-rbac.mdc`

## Related skills

`mms-backend-api`, `mms-data-sync`
