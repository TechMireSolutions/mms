---
name: mms-background-jobs
description: Implements or reviews MMS background jobs and queued processing from globle2.md section 8: large exports, imports, bulk operations, dedup scans, progress UI, download artifacts, tenant/user scoping, RBAC, and audit.
---

# MMS Background Jobs Workflow

Source: `globle2.md` section 8. Rules: `mms-background-jobs.mdc`, `mms-module-crosscutting.mdc`, `mms-security.mdc`, `mms-rbac.mdc`.

Use this skill when adding or changing background processing, export/download artifacts, bulk operation progress, job tray UX, or queued sync recovery.

## Reference Files

- Backend routes: `apps/backend/src/routes/backgroundJobs.ts`
- Worker registry: `apps/backend/src/services/backgroundJobWorkerService.ts`
- Runners: `apps/backend/src/services/backgroundJobRunners.ts`
- Artifacts: `apps/backend/src/services/exportArtifactService.ts`
- Frontend API/store: `apps/frontend/src/lib/backgroundJobs/`
- Tray: `apps/frontend/src/components/ui/BackgroundJobsTray.tsx`
- Hook: `apps/frontend/src/hooks/useBackgroundJobs.ts`

## Workflow

1. Decide whether the work is inline or queued. Queue it when it is large, slow, retryable, or needs progress.
2. Add an authenticated tenant route to enqueue the job. Check RBAC before creating the job.
3. Register a runner with a stable `{moduleId}:{kind}` key.
4. Run the job in tenant context and re-apply permission/visibility/soft-delete rules while generating results.
5. Store job state and artifacts scoped by tenant and user.
6. Update progress, complete with a clear label, or fail with an actionable reason.
7. Surface status in `BackgroundJobsTray` and provide download/result links only for owned artifacts.
8. Audit sensitive queued work such as export, bulk delete/restore, import, merge, messaging, and sync recovery.

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
- [ ] Tests cover success, forbidden, and failure paths
```

## Do Not

- Trust client-upserted job records for privileged work.
- Use queued jobs to bypass field, report, export, or soft-delete rules.
- Leave failed jobs invisible.
- Store long-lived artifacts without expiry.
- Depend on the in-process runner for critical multi-instance production work without adding a durable queue.

Related skills: `mms-module-work`, `mms-module-page`, `mms-reports-export`, `mms-backend-security`.
