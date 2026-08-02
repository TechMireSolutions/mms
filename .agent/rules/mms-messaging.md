---
trigger: model_decision
---

# MMS Messaging & Campaign Specification

**Workflow skill:** `mms-messaging`.

Governs campaign composition, templates, and sent-history for the Messaging module and cross-module `MessageComposer`.

## 1. Boundaries

- Outbound campaigns use `MessageComposer` + `MessagingRecipient` / `toMessagingRecipient` from `@mms/shared`.
- Do not import contacts-specific schemas into messaging primitives.
- Cross-module entry: `useMessageComposerState` from feature pages.

## 2. Data layer (REST + Query)

- Templates, logs, metrics via TanStack Query (`useMessageTemplates`, `useMessageLogs`, `useMessagingMetrics` / `useMessagingMutations`) — not raw `fetch` or localStorage-first writes.
- Manifest: `MESSAGING_MODULE_MANIFEST` (`setupSubTabs: ['templates']`, `softDelete` metadata).
- Bulk writes upsert (`bulkSave`); do not wipe via `replaceForWorkspace` on normal save paths.
- **Log clear**: intentional soft-archive (`deletedAt`) of the active view — not a Contacts-style trash browser.
- BE: `authenticateTenant` + RLS/`withTenantTransaction`; force `userId` from session; strip client `deletedAt` on POST; never echo SQL to clients.
- Campaign/send POSTs: accept an **idempotency key** when the client may retry — `mms-api-interface.md` §6. Surface `429` / `Retry-After` via shared notify — `mms-auth-security.md`.

## 3. Personalization & openers

- Placeholders evaluate on the client; allowlist known tokens (e.g. `{name}`) — reject unknown tokens.
- Template/body content is plain text — no executable HTML.
- Batch WhatsApp opens: sequential with configurable delay; SMS: `openDeviceSmsComposer`.
- Do not log full message bodies at info level; keep recipient identifiers minimal.

## 4. Module page parity (§7)

- Work | Reports | Setup; `useModulePermissions(MESSAGING_MODULE_MANIFEST)` — omit forbidden CTAs; Setup read-only when `!canEditSetup`.
- Work/Reports: `ErrorState` + retry; Cmd/Ctrl+N for new campaign when `canWrite`.
- Copy via `t()` (en/ar/ur/fa).
