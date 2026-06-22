---
description: Contact module — CRM, forms, WhatsApp, sync; globle.md reference implementation
paths:
  - "apps/frontend/src/pages/Contacts.tsx"
  - "apps/frontend/src/hooks/useContacts*.ts"
  - "apps/frontend/src/components/contacts/**"
  - "apps/frontend/src/lib/contact*"
  - "apps/frontend/src/lib/contacts/**"
  - "apps/backend/src/routes/contacts.ts"
  - "apps/backend/src/services/contactService.ts"
  - "packages/shared/src/contact*.ts"
  - "packages/shared/src/contactsModuleContract.ts"
  - "packages/shared/src/contactsSearchUtils.ts"
  - "contact.md"
---

# MMS Contacts Module (CRM Reference Implementation)

## 1. Directory & Contract Standards

- **Contract**: Canonical configuration is defined in `CONTACTS_MODULE_CONTRACT` (`@mms/shared`). Component files, hooks, and sync services must import constants from this contract.
- **Copy & Localization**: All copy must use `t('contacts.*')` via `appTranslations`. Legacy `uiStrings` fields are banned and must be stripped prior to configuration persistence.
- **Provider Mounting**: `ContactConfigProvider` must only be mounted once in `App.tsx` (never wrap individual pages or panels).

---

## 2. Data & Operations

### 2.1 Server-Authoritative Flow
- **Read**: Fetch lists from `/api/contacts` using `useContactsCollection()`. Work page queries must exclude soft-deleted records.
- **Write**: CRUD, merges, and status changes are managed via `useContactMutations()` with automatic offline outbox queueing (`contactsSyncOutbox.ts`) and reconnection flush.
- **Conflict Review**: Conflicts must trigger the dynamic diff review panel (`ContactsSyncConflictPanel`) for manual field merging.

### 2.2 Soft Deletion & Audit Logs
- Standard deletes set `deletedAt`, `deletedBy`, and optional `deletionReason`.
- Admin users (`contacts.delete`) can toggle showing deleted contacts, restoring single/bulk records via `/api/contacts/:id/restore`.
- Every creation, modification, soft-delete, restore, and CSV export operation must stage an audit entry.

### 2.3 CRM Integrity Tools
- **Deduplication**: Match contacts on server and perform user-approved merges via `mergeContacts(keep, other)`. Plaintext phone fields must be E.164 formatted.
- **Dependency Guard**: Field deletions in Setup are guarded by `getContactFieldRemovalIssues()` to ensure no custom field is deleted if actively used in columns, rules, or contact records.

---

## 3. Work Directory UI & Aesthetics

### 3.1 Responsive Directory
- Renders as `ContactsTable` on desktop (`lg:block`) and a card-based grid layout `ContactCards` on mobile (`lg:hidden`).

### 3.2 Visual Design & Micro-Animations
- **Design Elements**: Cards use glassmorphism, soft hover translations, pulsating lifecycle dots for stages, and glowing borders on selected cards.
- **Interactive Badges**: Copy-to-clipboard phone and email buttons with success micro-animations.
- **Quick Action Bar**: Elastic slide-in buttons at the bottom of cards (Call, Emerald WhatsApp, Violet SMS).

---

## 4. REST API & Google Sync

- **API Authorization**: Enforce `canWriteContacts`, `canDeleteContacts`, or `canReadContacts` checks inside every `/api/contacts` route.
- **Google Sync**: OAuth credentials, auth exchange (`/exchange`), and run lifecycle (`/run`) are handled completely server-side. Access tokens must never be exposed to the client.
- **Exports**: Execute large exports asynchronously as background jobs via `/export/csv`, integrated directly into the global `BackgroundJobsTray`.

---

## 5. Banned Patterns (Do Not Reintroduce)
- Legacy `contactsData.ts` mock data or local array queries.
- Monolithic field-layout components (`DynamicField.tsx`, `TabCustomFields.tsx`).
- Inline/client-side 2FA verification or local CSV download loops.
- Module-local background job banner overlays (use the global tray instead).
- Second `DraggableFieldList` under `contacts/settings/`
