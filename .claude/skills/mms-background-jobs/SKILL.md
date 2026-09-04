---
name: mms-background-jobs
description: Implements or reviews MMS background jobs and queued processing — large exports, imports, bulk ops, dedup scans, progress UI, artifacts. Use when adding or changing background processing, export downloads, job tray UX, or queued sync recovery.
---

# MMS Background Jobs Workflow

Source: `mms-module-architecture.md` §5. Rules: `mms-module-architecture.md`, `mms-auth-security.md`, `mms-performance.md` §2 (Zero Memory Buffering & Streaming Background Workers).

Use this skill when adding or changing background processing, export/download artifacts, bulk operation progress, job tray UX, or queued sync recovery.

## Reference Files

- Backend routes: `apps/backend/src/routes/backgroundJobs.ts`
- Worker registry: `apps/backend/src/services/backgroundJobWorkerService.ts`
- Runners: `apps/backend/src/services/backgroundJobRunnerService.ts`
- Artifacts: `apps/backend/src/services/exportArtifactService.ts`
- Frontend API/store: `apps/frontend/src/lib/backgroundJobs/`
- Tray: `apps/frontend/src/components/ui/BackgroundJobsTray.tsx`
- Hook: `apps/frontend/src/hooks/useBackgroundJobs.ts`

## Workflow

1. Decide whether the work is inline or queued. Queue it when it is large, slow, retryable, or needs progress.
2. Add an authenticated tenant route to enqueue the job. Check RBAC before creating the job.
3. Register a runner with a stable `{moduleId}:{kind}` key.
4. Run the job in tenant context and re-apply permission/visibility/soft-delete rules while generating results. Bind tenant + user; propagate trace context via `AsyncLocalStorage` (`AsyncContextFrame`); use explicit resource management (`using` / `await using`) for stream/file handlers; prefer an idempotency key when retries are likely (`mms-api-interface.md` §6).
5. Enqueue the job to **BullMQ** (via Redis 7+) for background execution. Wait for completion via WebSocket or polling.
   - **Headless BiDi Document Engine**: For BiDi documents (Urdu Nastaliq, Arabic, Farsi), use the headless **Typst** compiler with native HarfBuzz text shaping. The pipeline: Fastify API -> BullMQ Queue -> Typst Worker (`.typ` templates) -> Redis PubSub -> S3/MinIO.
   - **Heavy Exports**: Use ExcelJS stream pipes.
   - **Messaging**: Use a dedicated WhatsApp/SMS gateway.
6. Store job state and artifacts scoped by tenant and user (e.g., S3 URLs).
7. Update progress, complete with a clear label, or fail with an actionable reason.
8. Surface status in `BackgroundJobsTray` and provide download/result links only for owned artifacts.
9. Audit sensitive queued work such as export, bulk delete/restore, import, merge, messaging, and sync recovery. Emitting structured logs to `stdout` (via Pino).

## Job Checklist

```
- [ ] Enqueue route uses authenticateTenant
- [ ] RBAC checked before enqueue
- [ ] Runner key is registered exactly once
- [ ] Tenant context is preserved while executing
- [ ] Stored state/artifact is tenant + user scoped
- [ ] Progress/result/failure are user-visible
- [ ] Download requires current user ownership
- [ ] Export respects field visibility and soft-delete policy
- [ ] Sensitive job is audited
- [ ] Datasets exceeding interactive threshold (>500 rows) offloaded to background worker jobs with streaming pipelines
- [ ] Jobs use BullMQ + Redis 7+ for durable queuing
- [ ] Tests cover success, forbidden, and failure paths
```

## Do Not

- Trust client-upserted job records for privileged work.
- Use queued jobs to bypass field, report, export, or soft-delete rules.
- Leave failed jobs invisible.
- Store long-lived artifacts without expiry.
- Bypass BullMQ for heavy report generation; do not block Fastify event loop.

Related skills: `mms-module-work`, `mms-module-page`, `mms-reports-export`, `mms-backend-security`.
