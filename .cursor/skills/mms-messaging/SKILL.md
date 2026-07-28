---
name: mms-messaging
description: SMS/WhatsApp campaigns, MessageComposer, templates, message logs, and /api/messaging REST. Use when modifying MessagingPage, MessageComposer, messaging templates/campaigns/logs, MessagingVariableTokensBar, or backend messaging routes/repositories.
---

# MMS Messaging Workflow

**Rules:** `mms-messaging.mdc`, `mms-module-architecture.mdc` §7, `mms-auth-security.mdc`, `mms-data-layer.mdc`.

## Layout

| Area | Path |
|------|------|
| Page shell | `apps/frontend/src/tenant/features/messaging/MessagingPage.tsx` |
| Work / Reports / Setup | feature panels under `messaging/` |
| Composer | `components/ui/MessageComposer.tsx` + tokens bar |
| Hooks | `useMessageTemplates`, `useMessageLogs`, `useMessagingMetrics`, `useMessagingMutations` |
| Shared | `MESSAGING_MODULE_MANIFEST`, `messagingSchemas`, `MessagingRecipient` |
| Backend | `routes/tenant/messaging.ts`, `messagingRepository.ts` |

## Workflow

1. Recipients via `toMessagingRecipient` / `MessagingRecipient` — never contacts schemas inside composer.
2. Data via Query + `/api/messaging` only — no raw `fetch`, no localStorage-primary.
3. Bulk template/log writes upsert (`bulkSave`); never `replaceForWorkspace` on normal PUT.
4. Clear-logs: soft-archive (`deletedAt`) of active view — intentional variant, not Work trash.
5. Personalization: allowlisted tokens only; plain text bodies; sequential WhatsApp delay; SMS device fallback.
6. BE: `authenticateTenant` + RLS; force session `userId`; strip client `deletedAt`; no SQL in errors.
7. §7 UX: `useModulePermissions`, omit forbidden CTAs, `canEditSetup`, `ErrorState`, Cmd/Ctrl+N, `mutateAsync`, `t()`.

## Checklist

```
- [ ] useModulePermissions(MESSAGING_MODULE_MANIFEST)
- [ ] No raw fetch('/api/...')
- [ ] Upsert template/log saves — no accidental wipe
- [ ] Clear-logs soft-archive semantics preserved
- [ ] Token allowlist; no HTML injection in templates
- [ ] ErrorState + retry; Cmd/Ctrl+N when canWrite
- [ ] Copy via t() (en/ar/ur/fa)
- [ ] BE: authenticateTenant + RLS; no client authz userId
```

## Done

`pnpm typecheck` · `cd apps/frontend && pnpm lint` · messaging tests if touched — `mms-completion-review.mdc`.
