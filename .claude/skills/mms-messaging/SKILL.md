---
name: mms-messaging
description: Dynamic messaging module capability. Manages SMS and WhatsApp campaign composition, personalization rules, template presets, and sent log histories. Use when modifying MessagingPage, message history records, or the generic MessageComposer component.
---

# MMS Messaging Workflow

**Rules:** `mms-messaging.md`, `mms-module-architecture.md` §7, `MESSAGING_MODULE_MANIFEST`.

## Components Layout

1. **`MessagingPage.tsx`**: Work (compose / history), Reports (charts / metrics), Setup (templates) with command metrics.
2. **`MessageComposer.tsx`**: Universal modal — recipients, personalization tokens, channel, templates, logging.
3. **`useMessageComposerState.ts`**: Shared open/close + channel target across feature modules.
4. **Hooks**: `useMessageTemplates`, `useMessageLogs`, `useMessagingMetrics`, `useMessagingMutations` (Query + REST).

---

## Core Operations

### Universal Connection Across Modules
Contactable modules connect via `useMessageComposerState` + `toMessagingRecipient` / `MessagingRecipient` from `@mms/shared`.

### Personalization Logic
Placeholders inside templates must be parsed and substituted on the client (shared helpers / composer).

### Data authority
- Templates and logs: TanStack Query against `/api/messaging` — upsert bulk writes; do not expand localStorage-first as primary.
- **Clear logs**: soft-archive (`deletedAt`) then replace active view — intentional; not Contacts-style trash UI.
- Mutations: `mutateAsync`; Setup gated by `canEditSetup`; Work/Reports use `ErrorState` + Cmd/Ctrl+N for new campaign.

### Campaign Triggers
- **SMS**: `openDeviceSmsComposer(phone, body)` fallback.
- **WhatsApp**: sequential tab openers with delay.
- **Email**: `mailto:` with subject & personalized body.

## Checklist

```
- [ ] useModulePermissions(MESSAGING_MODULE_MANIFEST)
- [ ] No raw fetch('/api/...')
- [ ] Upsert template/log saves — no accidental wipe
- [ ] Clear-logs soft-archive semantics preserved unless product changes
- [ ] ErrorState + retry; Cmd/Ctrl+N when canWrite
- [ ] Copy via t() (en/ar/ur/fa)
```
