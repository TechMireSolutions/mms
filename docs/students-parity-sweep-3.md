# Students parity sweep 3 — quick filters, restore-on-create, drawer polish

Audited Students vs Contacts (gold standard) across backend, Work tier, detail drawer, and Reports. Round 3 closes the remaining genuine gaps; Contacts-domain features (duplicates/merge/sync, activity timeline, files tab, AI summary, saved-report sharing) and the drawer SubTabBar restructure / `settingsSubTabs` capability stay out of scope.

## Backend

### 1. `/duplicate-check` typed error handling
`studentOperationRoutes.ts` POST `/duplicate-check` currently has no `try/catch`; DB errors fall through the default handler. Wrap in `try/catch → sendDatabaseError(reply, 'Failed to check student registration duplicate')` (Contacts parity).

### 2. Work-tier quick-filter presets (server-backed)
Contacts has preset filters (`all/whatsapp/syed/missingInfo/recent`) as a radio group at the top of the Filters menu, SQL-backed. Students has none. Add students-specific presets:

- **shared** `studentsListQuery.ts`:
  - `STUDENTS_QUICK_FILTERS = ['all', 'new', 'missingGr', 'active', 'graduated', 'transferred']`
  - `StudentsQuickFilter` type, `isStudentsQuickFilter()`, `STUDENTS_QUICK_FILTER_OPTIONS` (label keys)
  - `StudentsListQuery.quickFilter?: StudentsQuickFilter`; schema adds `quickFilter: z.enum(...).optional()`
- **4 packs**: `students.filtersAll`, `students.filtersNew`, `students.filtersMissingGr`, `students.filtersActive`, `students.filtersGraduated`, `students.filtersTransferred`
- **backend** `studentRepositoryList.ts buildListConditions`:
  - `new`: `COALESCE(registeredDate, createdAt) >= now() - interval '30 days'`
  - `missingGr`: `gr_number IS NULL OR trim(gr_number) = ''`
  - `active`/`graduated`/`transferred`: `statusExpr() = <preset>`
- **FE**:
  - `useStudentsDirectoryFilters.ts`: `quickFilter` state (default `all`); preset change clears `studentFilterStatus`; manual status toggle resets `quickFilter` to `all`; `activeFilterCount` includes presets
  - `StudentsFilterMenuButton.tsx`: quick-filter `ModuleFilterRadioGroup` at top (before status)
  - `useStudentsPageWorkQuery.ts` + `studentsListQueryBuilders.ts`: serialize `quickFilter` into URL, query key params, `sameStudentsListFilters`

### 3. Restore-on-create (soft-deleted re-registration)
Contacts `POST /` restores an archived row and returns 200; Students always 201 / 409. Students GR index is partial (active only), so an archived student's GR doesn't conflict — the natural re-registration key is `contactId`. Restore an archived student when a create arrives with a matching `contactId`:

- **repo**: `findSoftDeletedByContactId(tenant, contactId)` on `StudentsRepository` interface + adapter + SQL impl
- **use case** `createStudent`: if incoming has `contactId` and an archived row exists → restore it (clear `deletedAt`/`deletedBy`/`deletionReason`, preserve archived `id`/`createdAt`, merge incoming), return `{ record, restored: true }`; else insert and return `{ record, restored: false }`; throw `StudentRestoreConflictError` if restored GR collides with an active student
- **route**: `students.ts` sets `customPostRoute: true`; bespoke POST `/` in `studentOperationRoutes.ts` replicating RBAC + `parseRequest(studentRecordSchema)` + `executeDynamicValidation` + `createStudent` + audit + `sanitizeOneStudentForUser` + `201` created / `200` restored
- **audit**: restored creates log `student.restore` (Contacts parity)
- **tests**: archived-row restore path + active-GR conflict

## Detail drawer

### 4. Guardian cards — email action + unknown-contact fallback
Contacts network cards offer WhatsApp/SMS/email per linked contact plus an `unknownContact` fallback; Students guardian cards offer Call/WhatsApp/SMS only and silently drop nameless links.

- **shared**: `StudentContactRelationshipLink.email?: string`
- `useStudentDetailModel.graphLinks`: hydrate `email` from the linked contact via `getPrimaryEmail`
- `StudentDetailFieldsSection`: `openComposer` channel type gains `"email"`; pass `email`/`onEmail` to `GuardianContactCard`; render `unknownContact` fallback card when the link has no name (new key `students.detail.unknownContact` in 4 packs)
- `GuardianContactCard`: accept `email`/`onEmail`, forward to `EntityMessagingIconActions`

### 5. Drawer field grouping by `field.group`
Contacts groups detail fields by `field.group` into titled `DetailSection` cards; Students renders one flat list.

- `useStudentDetailModel.sortedEnabledFields`: thread `group` from `FieldDefinition` (fallback `students.detail.extendedProfiles`)
- `StudentDetailFieldsSection`: group fields by `group`, render a `DetailSection` + `Card` per group (reusing `DetailSectionTitle`/`Card`), preserving the gender/dob/registeredDate special rows, guardian relationship cards, and the empty-dash convention; skip groups with no visible fields
- **4 packs**: `students.detail.extendedProfiles`

## Verify
`pnpm typecheck`, FE + BE `pnpm lint`, scoped Vitest (backend student tests incl. new restore test; frontend query tests), 4-pack key parity (added keys), completion review.

## Deferred (documented)
- `PUT` audit field-diff (`summarizeStudentFieldChanges`) — needs before-state threading through `registerResourceRoutes`
- Dynamic duplicate-check schema from Setup custom fields (FE form sends fixed keys only)
- Contacts-domain features: duplicate pairs/merge/sync, activity timeline/add-note, files tab, AI summary, saved-report sharing, VCF export
- Drawer SubTabBar restructure + `settingsSubTabs` capability
