---
trigger: model_decision
---

# MMS Contact-First Person Policy

Every **person** (student, teacher, guardian, workspace user, card recipient, payment actor) exists in **`contacts`** first. Module records store **link ids only**; profile and actor **labels** hydrate on read and are **stripped on save**.

Entity names (session title, class name, denomination, obligation type) are **not** persons — `sessionId` / `classId` links are fine; do not duplicate person profile fields onto those rows.

## Link chains

| Role | Persist | Hydrate (display) | Picker |
|------|---------|-------------------|--------|
| Student / teacher profile | `contactId` | `name`, `email`, `phone`, `gender`, `dob`, … | `ContactPicker` |
| Auth-capable workspace user | `contactId` + **`loginEmail`** | `name`, `email` (contact), `phone` from contact | `ContactPicker` (admin link only) |
| Student on downstream rows | `studentId` | `studentName` | `RegistryPersonSelect` (`kind="student"`) |
| Teacher on session class | `teacherId` | `teacherName` | teacher select / `RegistryPersonSelect` (`kind="teacher"`) |
| Hasanat recipient (student) | `recipientStudentId` | `recipientName` | `RegistryPersonSelect` |
| Hasanat recipient (faculty) | `recipientTeacherId` | `recipientName` | `RegistryPersonSelect` |
| Workspace actor (issued / approved / received / added) | `*UserId` (e.g. `issuedByUserId`) | `issuedBy`, `approvedBy`, `receivedBy`, `addedBy` | `UserActorSelect` |
| Activity log actor | `userId` | `userName` | — (current auth user) |
| Parent on student | `fatherContactId` / `motherContactId` | `fatherName` / `motherName` | `ContactPicker` |

**Auth layer (users collection):** `loginEmail` + `emailVerifiedAt` are **auth fields** — never copied from contact on save. Login resolves `loginEmail`; JWT `email` mirrors it. Self-service sign-in email change: `/api/auth/login-email/*`. Contact email changes via profile or CRM do not affect login.

Downstream modules **must not** re-collect `name` / `email` / `phone` in forms when a link id exists.

## Owned profile fields (never persist when link present)

From `packages/shared/src/contactLinkPolicy.ts` — `CONTACT_PROFILE_FIELDS`:

`name`, `phone`, `email`, `gender`, `dob`, `city`, `firstName`, `lastName`

Parent name copies strip when `fatherContactId` / `motherContactId` is set.

## Implementation map

| Layer | Owner |
|-------|--------|
| Strip / hydrate primitives | `contactLinkPolicy.ts` |
| Collection-specific normalize/hydrate | `linkedCollectionUtils.ts`, `studentUtils.ts`, `teacherUtils.ts` |
| FE collection switch | `apps/frontend/src/lib/contactLink/collectionSync.ts` |
| FE save/read gate | `db.ts` → `LINK_MANAGED_COLLECTIONS` + `normalizeLinkedCollection` / `hydrateLinkedCollection` |
| Backend data migration | `006_normalize_contact_linked_collections.ts`, `007_normalize_actor_user_links.ts` |

### Link-managed collections (extend list when adding person-linked data)

`students`, `teachers`, `users`, `enrollments`, `attendance_records`, `finance_invoices`, `finance_payments`, `sessions`, `user_activity_logs`, `hasanat_distributions`, `hasanat_redemptions`, `hasanat_batches`, `hasanat_payouts`, `assessment_results`, `exam_results`

New collection with a person reference → add to `LINK_MANAGED_COLLECTIONS`, `collectionSync.ts` normalize/hydrate cases, and a backend migration if legacy rows may contain copied names.

## Write path (required)

```ts
// ✅ Save link ids only; runtime may carry hydrated labels until saveCollection normalizes
onSave({
  studentId: student.id,
  issuedByUserId: authUser.id,
  contactId: contact.id,
});

// ❌ Free-text person name on persist
onSave({ studentName: 'Ahmed', issuedBy: 'Qari Yusuf' });
```

```tsx
// ✅ Pickers
<ContactPicker value={contactId} onChange={setContactId} contacts={contacts} />
<RegistryPersonSelect kind="student" value={studentId} onChange={setStudentId} />
<UserActorSelect value={issuedByUserId} onChange={setIssuedByUserId} label={t('hasanat.fieldIssuedBy')} />
```

## Read path (required)

- Lists, details, reports: use hydrated fields from `getCollection` / `useLiveCollection` (already hydrated).
- If a label is optional after normalize, resolve from registry: `students.find(s => s.id === studentId)?.name`.
- Analytics may build display names in memory — **do not** write them back to storage.

## REST / Query hooks

Server-first hooks (`useStudents`, `useTeachers`, `useContacts`): after API mutate, rely on `getCollection` hydration or explicit registry lookup — do not send profile fields on PUT/POST bodies.

## Anti-patterns

```tsx
// ❌ Editable name/email on user edit when contactId exists
<Input {...register('name')} />

// ❌ Recipient full-name text input on hasanat distribute
<input value={recipientName} onChange={...} />

// ❌ Activity log persists actor display name
{ userId, userName: actor.name, ... }

// ❌ New collection with studentName and no studentId normalize
saveCollection('my_module', [{ studentName: '...' }]);
```

## Module checklist (new or touched feature)

1. Person in UI? → `ContactPicker` or `RegistryPersonSelect` or `UserActorSelect`.
2. Save shape uses `*Id` fields only.
3. Collection added to `LINK_MANAGED_COLLECTIONS` + `collectionSync` if stored in document store.
4. Shared types: hydrated labels optional (`studentName?`, `issuedBy?`).
5. `pnpm typecheck` after changes.

## Related rules

- Contacts CRM: `mms-contacts.md`
- `db.ts` / sync: `mms-data-layer.md`
- Forms: `mms-ui-forms.md`
- Fields registry virtual ids (e.g. `recipientName` field id with picker UI): `mms-fields.md`
