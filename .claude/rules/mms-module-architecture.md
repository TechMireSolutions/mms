---
description: Universal module architecture — contract, tiers, command centre, Work/Reports/Setup behaviour (source globle1.md)
paths:
  - "apps/frontend/src/pages/**/*.tsx"
  - "apps/frontend/src/components/**"
  - "packages/shared/src/settingsTypes.ts"
  - "packages/shared/src/*ModuleContract.ts"
  - "globle1.md"
  - "globle2.md"
---

# MMS Universal Module Architecture

Human-readable sources:

| Doc | Sections |
|-----|----------|
| [`globle1.md`](../../globle1.md) | §1–§4 foundation + Work + Reports |
| [`globle2.md`](../../globle2.md) | §5–§7 Setup + §8–§14 cross-cutting (detailed) |

**Scope:** Every standard directory-based feature module (`Students`, `Contacts`, `Finance`, …). **Exception:** `/` Dashboard — cross-module command centre; does not use the three-tier shell (`mms-module-isolation.md`).

**Reference implementation:** **Contacts** — richest alignment with `globle1.md`. Copy patterns before inventing module-specific structure.

**Canonical split:**

| Concern | Owner rule / skill |
|---------|-------------------|
| File layout | `mms-structure.md` |
| Tier **shell** (accordion, ids) | `mms-ui-tabs.md` |
| Tier **content scope** | `mms-module-isolation.md` |
| Command centre + Work tier (§2–§3) | `mms-module-work.md`, skill `mms-module-work` |
| **Setup tab** (§5–§7) | `mms-module-setup.md`, skill `mms-module-setup` |
| Fields/tabs registry (§6 detail) | `mms-fields.md`, skill `mms-fields-registry` |
| Module preferences (§7 detail) | `mms-config.md` |
| Cross-cutting (§8–§14 detail) | `mms-module-crosscutting.md` |
| Background jobs (§8 detail) | `mms-background-jobs.md`, skill `mms-background-jobs` |
| Reports implementation | `mms-reports.md` |
| RBAC | `mms-rbac.md` + `mms-security.md` |
| Data/offline/sync | `mms-data-layer.md` + `mms-query.md` |
| New module workflow | skill `mms-module-page` |
| Contacts CRM detail | `mms-contacts.md`, skill `mms-contacts` |

---

## 1. Global system foundation (globle1 §1)

### 1.1 Universal module contract (required for new modules; Contacts shipped)

Each module must have a **single contract** in `@mms/shared` defining: `moduleId`, entity type, collection/REST keys, tier ids, permissions map, Work directory views, bulk actions, integrity tools, setup sub-tabs, export thresholds, soft-delete policy, searchable fields, and merge/export constants where applicable.

| Layer | Contacts (reference) | Other modules |
|-------|---------------------|---------------|
| Contract | `contactsModuleContract.ts` → `CONTACTS_MODULE_CONTRACT` | Add `{module}ModuleContract.ts` when touching module |
| Hooks | `useContacts.ts` reads contract paths/keys | Mirror in `use{Module}.ts` |
| UI | Page + hooks must not hardcode collection names or tier ids | Import contract constants |

All UI, API, exports, and Setup must follow the contract — no ad-hoc field lists in pages.

### 1.2 Role-based access control (required now)

- **UI:** `can('module.action')` — omit forbidden controls; **never rely on hiding alone** (`mms-rbac.md`).
- **API:** `authenticateTenant` + `rbacService` / collection guards on every mutation.
- **Levels:** module · record · field · column · action · report · export · setup — implement incrementally; **always** enforce on API.

**Contacts reference:** `contactFieldAccess.ts`, `contactColumnAccess.ts`, `useVisibleContactFields`, `useReadOnlyContactFieldKeys`.

### 1.3 Audit logging

**Target (§1.3):** create/update/delete/restore/merge/export/bulk/setup — who/when/what/before/after; protected from edit.

**Contacts:** `recordAudit` on REST create/update/soft-delete/bulk-delete; client `export-audit`, `merge-audit`, `setup-audit` routes.

**Global gap:** most modules and some Setup saves still unaudited — extend when touching writes (`mms-security.md`).

### 1.4 Offline and online state (§1.4)

**Target:** offline banner, pending-sync queue, conflict detection + user review.

**Contacts (shipped):** `ContactsDataBanner`, `contactsSyncOutbox.ts`, `useContactsSyncOutbox`, `ContactsSyncConflictPanel` with per-field merge; auto-flush on reconnect; command-centre conflict metric.

Until conflict UI exists: do not silently overwrite concurrent edits. *(Contacts conflict panel shipped.)*

### 1.5 Universal soft deletion (§1.5)

**Target:** `deletedAt`, `deletedBy`, optional `deletionReason`; hidden from Work; policy for reports/exports/duplicates/search.

**Contacts (shipped):** soft delete + restore + bulk; contract defines inclusion rules; duplicates/search exclude deleted.

**Other modules:** still hard DELETE — migrate when adding REST CRUD.

### 1.6 Data integrity (required now)

- Required fields, formats, unique values, relationships — Zod + dynamic schema (`mms-fields.md`).
- Duplicate detection + **user-confirmed merge** (§2.2) — `DuplicateDetection.tsx`; `mergeContacts()` in `@mms/shared`.
- Title-case names, E.164 phones on save (`@mms/shared`).
- **Contacts §6.6:** `contactFieldDependencies.ts` blocks field removal when used in columns, duplicate detection, or contact data.

---

## 2. Module command centre (globle1 §2 — `PageHeader`)

Persistent **above** tier tabs on Work, Reports, and Setup.

| Element | Rule |
|---------|------|
| Title + icon | `PageHeader` + `t('nav.*')` |
| **Metrics (§2.1)** | Command-centre row: totals, filtered count, module KPIs — **permission-scoped counts only** |
| **Primary create (§2.4)** | `ActionButton` in `PageHeader.actions` — not gated on active tier |
| **Export (§2.3)** | Respects filters + RBAC + field visibility + soft-delete policy |
| **Integrity tools (§2.2)** | e.g. Duplicates — module-scoped dedup engine |
| Tier-specific actions | Inside tier content only |

**Contacts reference:** `ContactsCommandMetrics.tsx`, Add / Export / Duplicates in header; CSV via `exportContactsCsv.ts` (chunked when `rows > exportInlineMaxRows`).

---

## 3. Tab: Work — operational directory (globle1 §3)

Primary daily-use tier. **Banned here:** foreign-module KPI widgets, `ModuleReports`.

| Feature | Requirement | Contacts reference |
|---------|-------------|-------------------|
| Directory (§3.1) | Search, filter, sort, status, bulk select, row actions | `ContactsToolbar`, `ContactsTable` |
| Search/filters (§3.2) | Approved searchable keys; permission-aware | `contactsSearchUtils.ts`, contract `searchableFieldKeys` |
| Responsive views (§3.3) | Table desktop; **card layout mobile** | `ContactCards.tsx` (`md:hidden`) |
| Column prefs (§3.4) | Per-user layout where permitted | `GET/PUT /api/contacts/column-prefs` + `columnPrefsStorage.ts` |
| Detail drawer (§3.5) | In-place view; registry tabs/fields; field RBAC | `ContactDetailDrawer.tsx` |
| Bulk bar (§3.6) | WhatsApp, SMS, export, delete — permission-aware; **partial failure reporting** | `Contacts.tsx` selection bar; bulk delete API |
| Templates (§3.7) | Reusable message/export presets | WhatsApp/SMS templates in contact prefs |
| Page orchestration | Thin page; state in hook | `useContactsPageState.ts`, `useContactsPageActions.ts` |
| Lazy heavy UI | Duplicates, messaging, sync, large forms | `React.lazy` in `Contacts.tsx` |

Wrap Work tree in `ErrorBoundary` (`mms-observability.md`).

---

## 4. Tab: Reports — analytics engine (globle1 §4)

Same permission boundary as Work — no restricted records via charts/drill-down/export.

| Feature | Requirement | Contacts |
|---------|-------------|----------|
| KPI row | `KPISummary(category)` — module category only | Shipped |
| Module reports | `ModuleReports` + `ContactReport` | Shipped |
| Query builder (§4.1) | Visual filter/group/summary; i18n field labels | `CustomReportBuilder` + `contactsReportFields.ts` for contacts source |
| Visualisation (§4.2) | Recharts; semantic colours | Shipped |
| Drill-down (§4.3) | Chart segment → filtered Work view | `contactsWorkDrillDown.ts` + `ContactReport` — **Contacts only** |
| Saved reports (§4.4) | Save logic not snapshot; rerun on open | `ContactsSavedReports` + `/api/contacts/saved-reports` — **Contacts only** |
| Export | Print / Excel / PDF | `ReportExportBar` |

Details: `mms-reports.md`, skill `mms-reports-export`.

---

## 5–7. Tab: Setup (globle2 §5–§7)

**Detail:** `mms-module-setup.md` · Skill: `mms-module-setup`

Summary: admin-gated Setup tier; Fields + Preferences sub-tabs; all changes audited; field dependency checks before delete; prefs cascade to Work/Reports.

**Contacts reference:** `ContactsSettingsPanel`, `ContactSyncPanel`, `setup-audit`, `contactFieldDependencies.ts`.

---

## 8–14. Cross-cutting behaviour (globle2 §8–§14)

**Detail:** `mms-module-crosscutting.md`

Summary below — see that rule for implementation tables and Contacts status.

### §8 Background jobs (target)

Large export, bulk messaging, import, dedup scan, heavy reports → queued job + progress + audit.

**Contacts (shipped):** server `POST /export/csv` + `POST /duplicates/scan`; global `BackgroundJobsTray`; client chunked fallback for selection exports. **Gap:** multi-instance Redis/worker queue.

### §9 Error handling (required)

- Validation → field/tab focus + `notify.error` + `t()`.
- Permission → stable API `type` → `t('errors.*')`.
- Bulk partial failure → report counts + failed ids (`useContactsPageActions` pattern).
- No silent `catch` on user-initiated actions.

### §10 Performance

- Lazy-load heavy overlays; dynamic `import()` for export libs.
- Query `staleTime` for REST lists; no polling loops.
- Dashboard widgets: prefer Query cache (`widgetDataUtils` reads `CONTACTS_QUERY_KEY` first).

### §11 Accessibility & responsive

Keyboard, `aria-label`, 44×44 targets, RTL logical props, non-colour-only status — `mms-a11y.md`.

### §12 Security

Reports, exports, bulk, setup, offline queue, and background jobs must re-check RBAC — same as Work tab.

### §13 Change management (target)

Setup changes: audit, dependency warnings, safe cascade. **Contacts:** field-delete dependency checks + setup audit. Rollback where feasible — platform gap.

### §14 Universal behaviour principle

Users who learn one module should transfer skills to another. Specialised business rules are allowed; **violating tier placement, RBAC-only UI hiding, or cross-module Work imports is not** unless documented as an approved exception.

Open implementation gaps → **`mms-migration-status.md`**.

---

## New module checklist

```
- [ ] {Module}ModuleContract in @mms/shared (mirror contactsModuleContract.ts)
- [ ] pages/{Module}.tsx — thin orchestrator + use{Module}PageState hook
- [ ] PageHeader command centre (ContactsCommandMetrics pattern)
- [ ] useModuleTierTabs + ResponsiveAccordionTabs (work | reports | setup)
- [ ] Work: directory + search/filter/sort + detail drawer + bulk bar + FormModal
- [ ] Reports: KPISummary(moduleCategory) + ModuleReports — reports tier only
- [ ] Setup: SubTabBar → Fields + Preferences (+ contract setupSubTabs)
- [ ] can() gates; API RBAC on writes; field/tab RBAC when registry-driven
- [ ] Soft delete policy in contract when REST CRUD exists
- [ ] Data: Query-first if REST exists; else useLiveCollection
- [ ] ErrorBoundary on Work + Reports
- [ ] i18n via t(); no new uiStrings keys
```

Skills: **`mms-module-page`**, **`mms-module-work`**. References: **`Contacts.tsx`** (globle1 reference), `Students.tsx` (REST minimal), `Finance.tsx` (legacy collection).
