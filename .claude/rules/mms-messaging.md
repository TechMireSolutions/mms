---
description: Unified SMS/WhatsApp campaign composition, templates, and message history specifications.
paths:
  - "apps/frontend/src/tenant/features/messaging/**"
  - "apps/frontend/src/components/ui/MessageComposer.tsx"
  - "apps/frontend/src/hooks/useMessaging.ts"
  - "packages/shared/src/messagingModuleManifest.ts"
---

# MMS Messaging & Campaign Specification

Governs campaign composition, templates, and sent-history for the Messaging module and cross-module `MessageComposer`.

---

## 1. Modular Boundaries & Decoupled Architecture
- All outbound campaigns use the decoupled `MessageComposer` component with the shared `MessagingRecipient` / `toMessagingRecipient` shapes from `@mms/shared`.
- Do not import contacts-specific schemas into messaging primitives — keep a clean recipient interface.
- Cross-module entry: `useMessageComposerState` from feature pages (Students, Contacts, Users, etc.).

## 2. Data layer (REST + Query)
- Templates, logs, and metrics load via TanStack Query hooks (`useMessageTemplates`, `useMessageLogs`, `useMessagingMetrics` / `useMessagingMutations`) — not raw `fetch` or expanding localStorage-first writes.
- Manifest: `MESSAGING_MODULE_MANIFEST` (`setupSubTabs: ['templates']`, `softDelete` metadata, channel/category helpers).
- Bulk template/log writes must upsert (`bulkSave`); do not wipe via `replaceForWorkspace` on normal save paths.
- **Log clear**: intentional soft-archive (`deletedAt`) then replace of the active view — document in contract; not a Contacts-style trash browser.

## 3. Personalization & Safe Openers
- Personalization placeholders (e.g. `{name}`) evaluate on the client.
- Batch WhatsApp opens must be sequential with configurable delay to avoid popup blockers.
- SMS falls back to `openDeviceSmsComposer`.

## 4. Module page parity
- Three tiers: Work | Reports | Setup (`mms-module-architecture.md` §7).
- `useModulePermissions(MESSAGING_MODULE_MANIFEST)` — omit forbidden CTAs; Setup read-only when `!canEditSetup`.
- Work/Reports: `ErrorState` + retry on query failure; Cmd/Ctrl+N for new campaign when `canWrite`.
- Copy via `t()` (en/ar/ur/fa) — no hardcoded channel/status labels.
