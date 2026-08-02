---
name: mms-messaging
description: SMS/WhatsApp campaigns, MessageComposer, templates, message logs, and /api/messaging REST. Use when modifying MessagingPage, MessageComposer, messaging templates/campaigns/logs, MessagingVariableTokensBar, or backend messaging routes/repositories.
---

# MMS Messaging Workflow

**Rule (norms SSOT):** `mms-messaging.md`. Also `mms-module-architecture.md` §7, `mms-auth-security.md`, `mms-data-layer.md`.

## Layout (entry points)

| Area | Path |
|------|------|
| Page | `apps/frontend/src/tenant/features/messaging/MessagingPage.tsx` |
| Composer | `components/ui/MessageComposer.tsx` + tokens bar |
| Hooks | `useMessageTemplates`, `useMessageLogs`, `useMessagingMetrics`, `useMessagingMutations` |
| Shared | `MESSAGING_MODULE_MANIFEST`, `messagingSchemas`, `MessagingRecipient` |
| Backend | `routes/tenant/messaging.ts` (+ `messaging/**`), `messagingRepository.ts`, `services/messaging*.ts` |

## Workflow

1. Recipients via `MessagingRecipient` / `toMessagingRecipient` — never contacts schemas in composer.
2. Query + `/api/messaging` only.
3. Bulk template/log writes upsert; clear-logs soft-archive (intentional §7 variant).
4. Allowlisted tokens; plain text; BE forces session `userId`, strips client `deletedAt`.
5. §7 UX: permissions, `ErrorState`, Cmd/Ctrl+N, `mutateAsync`, `t()`.
6. Campaign/send POSTs: idempotency key when the client may retry; surface `429` / `Retry-After` via `notify` — `mms-api-interface.md` / `mms-auth-security.md`.

## Checklist

```
- [ ] useModulePermissions(MESSAGING_MODULE_MANIFEST)
- [ ] No raw fetch('/api/...')
- [ ] Upsert saves; clear-logs soft-archive preserved
- [ ] Send path idempotency + 429 backoff
- [ ] Token allowlist; no HTML injection
- [ ] ErrorState + Cmd/Ctrl+N when canWrite
- [ ] BE: authenticateTenant + RLS; no client authz userId
```

## Done

`pnpm typecheck` · FE lint · messaging tests if touched — `mms-completion-review.md`.
