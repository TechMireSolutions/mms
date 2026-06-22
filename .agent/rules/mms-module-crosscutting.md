---
trigger: model_decision
---

# MMS Module Cross-Cutting (globle2.md)

Human-readable source: [`globle2.md`](../../globle2.md) §8–§14. Foundation (§1–§4): [`globle1.md`](../../globle1.md). Setup (§5–§7): `mms-module-setup.md`.

Summary index in `mms-module-architecture.md` — this rule owns **implementation detail** for post-Setup behaviour.

---

## §8 Background jobs and queued processing

Detailed rule and workflow: `mms-background-jobs.md` and skill `mms-background-jobs`.

Operations that must not block the UI:

| Operation | Target | Contacts current |
|-----------|--------|-------------------|
| Large exports | Queued job + progress + download link | Server CSV job + tray; client chunk fallback for selection |
| Bulk messaging | Batch + progress | WhatsApp opens tabs sequentially (manual send) |
| Bulk updates | Batch + partial failure report | Bulk delete/restore API with counts |
| Data imports | Progress + error rows | Contact import via page actions |
| Dedup scans | Background for large sets | `POST /duplicates/scan` + tray; inline for small sets |
| Large reports | Background generate | Inline preview (20 rows) |
| Sync recovery | Outbox flush + conflict review | `contactsSyncOutbox` + `ContactsSyncConflictPanel` |

Users must see: status, progress, result, failure reason, download link where applicable. All jobs respect RBAC + audit.

**Gap:** multi-instance server job queue (Redis/worker).

---

## §9 Error handling and user feedback (required)

Inform users when:

| Event | Pattern |
|-------|---------|
| Validation error | Field/tab focus + `notify.error` + `t()` |
| Missing required field | Zod path → tab switch in forms |
| Permission denied | Omit control + API 403 + `t('errors.*')` |
| Record changed elsewhere | Sync conflict banner (Contacts) |
| Sync conflict | `ContactsSyncConflictPanel` + stacked banner (Contacts) |
| Bulk partial failure | `{ succeeded, failed }` from API + toast |
| Background job failure | Toast + retry action |
| Report load failure | Error boundary + empty state |
| Export failure | `contacts.exportFailed` + retry |

Errors must state **what**, **where**, and **next step**. No silent empty `catch` on user actions (`mms-completion-review.md`).

---

## §10 Performance and scalability

Define limits for: directory load, search, filter, custom fields, reports, exports, bulk ops, background jobs, offline sync, dedup scans.

| Rule | Detail |
|------|--------|
| Lazy-load | Heavy overlays (`React.lazy`), dynamic `import()` for xlsx/jspdf |
| Query cache | REST lists: `staleTime`; no `setInterval` polling |
| Widget data | Query cache first, localStorage fallback (`widgetDataUtils`) |
| Export | Chunk + yield for large sets (`downloadContactsCsvChunked`) |
| Search | Approved keys only (`contactsSearchUtils`) — avoid full-scan UI on 10k+ rows without pagination API |
| Summary vs full load | KPIs/reports use aggregates; cross-module pickers use batch resolve — do not fetch full collection when filtered count suffices |

**Gap:** server pagination on all module directories (Contacts Work + Reports off full list; Setup/sync/deleted archives still load full roster when needed).

---

## §11 Accessibility and responsive experience

Required across modules (`mms-a11y.md`):

- Keyboard navigation and visible focus
- Readable labels (`t()`, `aria-label`, `htmlFor`)
- WCAG contrast via design tokens
- Mobile layouts (`ContactCards` pattern for Work)
- Meaningful error messages (not colour-only)
- Localised text (`mms-i18n.md`)

Accessibility is core architecture — not optional polish.

---

## §12 Security and data protection

RBAC must hold on every bypass path:

| Surface | Must enforce |
|---------|--------------|
| Work directory | `can()` + API guards |
| Reports / charts | Same record set as Work |
| Exports | Filters + field visibility + soft-delete policy |
| Bulk actions | Per-action permission + eligible records only |
| Setup | Admin permissions; audit writes |
| Offline queue | Replay with same auth cookies |
| Audit logs | Protected from user edit |
| Sensitive fields | Field/column RBAC |
| Background jobs | Permission at enqueue + execute |
| Templates | Role-scoped where shared |

Users must not access restricted data via reports, filters, exports, search, mobile views, or jobs.

---

## §13 Module change management (non-Setup)

Beyond Setup-specific rules (`mms-module-setup.md`):

- REST schema changes: Zod + migration + backward-compatible reads
- Contract changes: update `@mms/shared` + hooks together
- Registry changes: cascade to forms, columns, reports in same PR

---

## §14 Universal behaviour principle

Modules share: navigation, creation, editing, search, filter, reporting, export, permissions, auditing, customisation, deletion, recovery, notifications, background processing.

Specialised business rules are allowed; violating tier placement, RBAC-only UI hiding, or cross-module Work imports is not — unless documented exception.

Skill: **`mms-module-page`**. Reference module: **Contacts**.
