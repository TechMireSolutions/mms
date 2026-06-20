---
description: Contact module — CRM, forms, WhatsApp, sync
paths:
  - "apps/frontend/src/pages/Contacts.tsx"
  - "apps/frontend/src/hooks/useContacts.ts"
  - "apps/frontend/src/components/contacts/**"
  - "apps/backend/src/routes/contacts.ts"
  - "apps/backend/src/services/whatsApp*.ts"
  - "contact.md"
---

# MMS Contacts Module

**Authoritative rules:** this file for CRM UI/API. **Person identity policy** (link ids, hydrate/strip across all modules): `mms-contact-link.md`. `contact.md` is a blueprint — update it when architecture changes (several paths there are stale).

## File map

| Area | Path |
|------|------|
| Page | `pages/Contacts.tsx` |
| Query hooks | `hooks/useContacts.ts` (`useContacts`, `useContactMutations`, `useContactsCollection`) |
| Config | `lib/ContactConfigContext.tsx` + `lib/contactConfig/*` (provider in `App.tsx` only) |
| Field store | `lib/contactFieldsStore.ts` |
| Types | `@mms/shared/contactTypes.ts` |
| Forms | `components/contacts/form/*Tab.tsx`, `FormPrimitives.tsx` |
| Backend | `routes/contacts.ts`, `validation/contactSchemas.ts`, `services/whatsApp*.ts` |

## Data layer

Server-first via TanStack Query (`mms-query.md`):

- **Read:** `useContactsCollection()` (Query + localStorage fallback for offline/KPI sync)
- **Write:** `useContactMutations()` only — do not parallel `saveCollection` in page handlers
- `fetchContacts` calls `saveCollection('contacts', …)` inside `queryFn` for dashboard widgets still on `useLiveCollection`

## Work-tier views

List (`ContactsTable`) | Kanban (`ContactKanban` by lifecycle stage).

Lazy-load: `DuplicateDetection`, `WhatsAppPanel`, `ContactSyncPanel`.

## Data model

`Contact` from `@mms/shared` — nested `phones[]`, `emails[]`, `addresses[]`, `relationships[]`, plus dynamic custom keys.

## Security

- WhatsApp checks server-side only — no client-side credential storage (`mms-security.md`)
- Imported CSV/VCF: validate columns; reject formula-injection cells in spreadsheet exports (`mms-reports.md`)

## Phones & WhatsApp

- E.164 on save
- `whatsappStatus`: `REGISTERED` | `NOT_REGISTERED` | `FAILED` | `PENDING` — backend only
- No manual WhatsApp toggles in `PhoneTab`
- UI reads `GET /api/contacts/:id/whatsapp-status`

## Avatar & health

- `ContactAvatar` + `AvatarCropper` — `getInitials`, `getAvatarColor` from shared
- `calculateProfileHealth` — driven by required fields in registry

## Import/export

`ContactSyncPanel` — CSV/VCF; validate imported columns against field registry.

## Copy / i18n

- **Legacy:** `uiStrings` from `useContactConfig()` — ~24 Contacts files; migrate incrementally
- **New copy:** add `contacts.*` keys to `appTranslations` and use `t()` — **do not extend `uiStrings`** (`mms-i18n.md`)
- Field labels: registry `label` today; prefer `labelKey: AppTranslationKey` when adding fields (`mms-fields.md`)

## Images

`AvatarCropper` and file uploads: `optimizeImage` / `canvasToOptimizedDataUrl` from `@mms/shared` (`mms-frontend.md`).

## Forms

`ContactForm` uses **`FormModal`** + `SubTabBar` — `mms-ui-forms.md`. Tab bodies use `FormPrimitives` + `useSortedFields`.

## Do not reintroduce

- `DynamicField.tsx`, `TabCustomFields.tsx` (use `FormPrimitives`)
- Nested `ContactConfigProvider`
- Second `DraggableFieldList` variant
