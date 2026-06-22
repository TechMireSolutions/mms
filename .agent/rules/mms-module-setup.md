---
trigger: model_decision
---

# MMS Module Setup (globle2.md)

Human-readable source: [`globle2.md`](../../globle2.md) §5–§7 (Setup) and §13 (change management). Shell placement: `mms-module-architecture.md` · Work/Reports: `globle1.md`.

**Scope:** Module **Setup** tier only — not `/settings`. **Reference:** `ContactsSettingsPanel.tsx`, `ContactSyncPanel.tsx`, `contact_field_config`, `contact_prefs`.

**Canonical split:**

| globle2 § | Topic | Owner |
|-----------|--------|-------|
| 5 | Setup tab gate + audit | This rule |
| 6.1–6.6 | Fields, tabs, form structure | `mms-fields.md` + this rule |
| 7.1–7.4 | Preferences & business rules | `mms-config.md` + this rule |
| 13 | Setup change management | This rule + `mms-security.md` |

Skill: **`mms-module-setup`**.

---

## §5 Setup tab — administrative configuration

| Requirement | Implementation |
|-------------|----------------|
| Admin-only | `can('configuration.view')` / `can('settings.global.write')` or module-specific setup permission in contract |
| Not under `/settings` | Fields + Preferences live in module Setup sub-tabs (`mms-settings-navigation.md`) |
| Changes cascade | Field/tab/prefs edits affect Work, Reports, command centre, forms, filters, exports, validation |
| **All Setup changes audited** | Contacts: `POST /api/contacts/setup-audit` via `logSetupAudit` on save — extend per module |

Register Setup sub-tabs in `{Module}ModuleContract.setupSubTabs` (e.g. Contacts: `fields` \| `preferences` \| `sync`).

Use `SubTabBar` inside Setup tier (`mms-ui-tabs.md`). Copy via `t()` — no Setup `uiStrings` editors.

---

## §6 Setup area 1 — fields, tabs, form structure

Detail also in `mms-fields.md`. Skill: `mms-fields-registry`.

### §6.1 Predefined tabs and fields

- Core design in `INITIAL_FIELD_SEED` / module seed — **cannot be permanently removed** by normal admins.
- Hide/disable allowed; historical data preserved.
- **Contacts:** `isContactSeedFieldKey()` in `contactFieldDependencies.ts` blocks delete in Setup UI.
- Restricted editing for critical fields (e.g. phone `number`, email `address` unique flags).

### §6.2 Custom tabs and fields

Every custom field must define:

| Property | Where |
|----------|--------|
| Label | Registry `label` or `labelKey` |
| Type | Registry `type` — rendered via `FormPrimitives` |
| Tab location | Registry tab key |
| Visibility | `enabled` on field + tab |
| Permissions | `permissions[]` on field/tab |
| Validation | Zod via `buildCustomFieldSchema` / module equivalent |
| Reporting/filter eligibility | Column registry + searchable keys when approved |

**UI:** `CustomFieldsBuilder` + `ContactDraggableFieldList` (contacts) / `DraggableFieldList` (generic).

### §6.3 Tab ordering and visibility — cascade (required)

When a tab or field is hidden/disabled, apply consistently across:

- Creation forms (`FormModal` + registry tabs)
- Detail drawers
- Edit views
- Reports (`CustomReportBuilder`, module reports)
- Exports (`exportContactsCsv`, report export)
- Work filters and search
- Mobile card/table views

**Contacts:** `useVisibleContactFields`, `canViewContactTab`, `canViewContactColumn`, `enabledTabIds` in `ContactConfigContext`.

### §6.4 Field assignment logic

- Every field belongs to exactly one tab.
- Reorder via `DraggableFieldList`; move between tabs only when business rules allow.
- Moving must **not erase** stored values on entity documents.
- Warn before structural changes when field is required, hidden, restricted, or used in reports — **Contacts:** `getContactFieldRemovalIssues()` before delete.

### §6.5 Required field logic

- `required` flag on registry field — enforced on create, edit, import, relevant bulk ops.
- Validation must focus user on the tab/field (`ContactForm` + Zod paths).
- **Do not** mark required if existing records would become invalid without a migration/correction process.

### §6.6 Field archiving and deletion

| Policy | Detail |
|--------|--------|
| Prefer archive over delete | Hide/disable field; preserve data on records |
| Permanent delete | Only when no dependencies |
| Dependency checks (required) | Before remove: existing records, reports, filters, exports, templates, column registry, duplicate detection, dashboards |

**Contacts (shipped):** `getContactFieldRemovalIssues()` — blocks delete for seed fields, enabled columns, duplicate-detection prefs, contact data count.

**Platform gap:** formal archive workflow (vs hide + delete guard); tab-level dependency checks; saved-report field references.

---

## §7 Setup area 2 — preferences and business rules

Detail also in `mms-config.md`. Module prefs object key in contract (e.g. `contact_prefs`).

### §7.1 Smart defaults

- Field `defaultValue` in registry; module prefs for locale defaults (`defaultCountry`, `defaultCity`, …).
- Apply on create, import, templates — user may override unless workflow forbids.
- **Contacts:** `prefsStorage.ts`, `ContactConfigContext.updatePrefs`, form init from registry defaults.

### §7.2 Visual categorisation

- Status/stage/tag colours from prefs or semantic tokens — not inline hex maps.
- Must appear consistently: directory, drawer, reports, dashboards, mobile, exports where applicable.
- **Never colour-only** — pair with text labels (`StatusBadge`, `t()`).
- **Contacts:** lifecycle stage colours in prefs.

### §7.3 Workflow and status rules

- Valid statuses/stages, allowed transitions, required fields before transition, permission per transition.

- **Gap:** explicit transition matrix, locked closed records, transition notifications.

### §7.4 Notification rules

Notify on: create, assignment, status change, duplicate warning, failed sync, export complete, bulk completion, report thresholds — respecting RBAC.

**Contacts (partial):** `notify` on export/import/merge/save errors; sync banner for offline/conflicts. **Gap:** configurable notification prefs per module.

---

## §13 Module change management (Setup)

When admins change fields, tabs, workflows, defaults, or visual rules:

| Requirement | Contacts | Target |
|-------------|----------|--------|
| Record change | `setup-audit` route | All modules + `audit_log` |
| Identify actor | JWT user on audit payload | Same |
| Show what changed | Summary string on save | Diff detail |
| Protect existing data | Dependency checks before delete | Archive workflow |
| Warn dependencies | `getContactFieldRemovalIssues` toasts | Tab + report checks |
| Safe cascade | Config reload via `ContactConfigContext` | All surfaces |
| Rollback | — | Versioned config snapshots |

Setup saves must use explicit Save + audit — not silent auto-save of structural config unless designed and audited.

---

## Setup checklist (new module)

```
- [ ] setupSubTabs in {Module}ModuleContract
- [ ] SubTabBar: Fields + Preferences (+ extras)
- [ ] Fields panel: CustomFieldsBuilder + DraggableFieldList pattern
- [ ] Prefs panel: draft + preview where Work UI affected
- [ ] can() gate on Setup tier visibility
- [ ] setup-audit or audit_log on save
- [ ] get*FieldRemovalIssues() before field/tab delete
- [ ] Visibility cascade wired (form, drawer, table, reports, export)
- [ ] t() for all Setup copy
```

Open gaps → **`mms-migration-status.md`**.
