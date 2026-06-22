---
trigger: model_decision
---

# MMS RBAC

Canonical for permissions. UI visibility → `mms-ui-visual.md`; auth JWT shape → `mms-auth.md`.

## Backend — `rbacService.ts`

| Function | Rule |
|----------|------|
| `canReadCollection` | `users` → `users.manage`; `contacts`/`students` → shared `*.read`; legacy collections → staff write roles |
| `canReadObject` | `email_integration` → **admin only**; other objects → staff write roles |
| `canWriteCollection` | `users` → **admin only**; others → admin, accountant, teacher, assistant_teacher |
| `canWriteObject` | `global_settings`, `branding`, `email_integration` → **admin only** |
| `canBulkSync` | **admin only** — `POST /api/db/sync` |
| `canDownloadBulkSync` | **admin only** — `GET /api/db/sync` |
| `/api/db/reset` | **admin only** (`canResetTenantData`) |
| `/api/students` POST/PUT/DELETE | `canWriteCollection(user, 'students')` |
| `/api/contacts` POST/PUT/DELETE | `canWriteCollection(user, 'contacts')` |
| `/api/email/*` | **admin only** (`canWriteObject(user, 'email_integration')`) |
| `GET /api/db/collections/:name` | `canReadCollection` |
| `GET /api/db/objects/:key` | `canReadObject` (server-only keys → `404`) |
| `GET /api/students`, `GET /api/contacts` | `canReadCollection` on list/count/status |

### Gaps (open)

| Route | Gap |
|-------|-----|
| Dedicated REST routes (future) | Add read/write checks mirroring collection rules |
| Legacy collection read matrix | Unmapped collections use staff write roles until per-module `*.read` in registry |

Apply `rbacService` on every **new** read, write, or destructive route.

## Backend enforcement pattern

```ts
fastify.addHook('preHandler', authenticateTenant);

fastify.post('/…', async (request, reply) => {
  const user = request.user as User;
  if (!canWriteCollection(user, 'students')) {
    return reply.status(403).send({ type: 'forbidden', message: '…' });
  }
  // …
});
```

Denied → `403` + `type: 'forbidden'` — never empty `200`.

## Frontend — `usePermissions()` (shipped)

```tsx
// ❌ Scattered role checks
{user.role === 'admin' && <Button>Delete</Button>}

// ✅ Central hook
{can('students.write') && <Button>Delete</Button>}
```

- Matrix: `packages/shared/src/permissions.ts` + `roleHasPermission`
- Hook: `apps/frontend/src/hooks/usePermissions.ts`
- Legacy `useViewerRole()` — migrate when touching a module
- Forbidden UI: **omit control** — not disabled placeholders (`mms-ui-visual.md`)
- Backend is authoritative; UI gates are additive only

### Migration hotspots (open)

Replace `role ===` / `disabled={role === '…'}` when touching these files:

| File | Pattern |
|------|---------|
| `pages/Dashboard.tsx` | Widget/category filtering by role |
| `components/dashboard/WelcomeBanner.tsx` | Greeting/badge branches |
| `components/reports/KPISummary.tsx` | Teacher/accountant KPI branches |
| `pages/Attendance.tsx` | Role banner + mixed `can()` |
| `components/attendance/MarkAttendance.tsx` | `disabled={role === 'accountant'}` |
| `components/attendance/AttendanceRecords.tsx` | Admin-only action |
| `lib/PageNotFound.tsx` | Admin-only link |

**Wired with `can()`:** `Enrollments.tsx`, `Attendance.tsx` (tier visibility), `Dashboard.tsx` (partial). Do not add new inline role strings.

## Permission strings

Dot-notation: `contacts.delete`, `students.write`, `users.manage`, `settings.branding.write`, etc.

Registry `permissions: string[]` on fields/tabs uses same vocabulary (`mms-fields.md`).

## Workspace roles

`DEFAULT_WORKSPACE_ROLES` in `@mms/shared/userTypes.ts` — JWT `User.role` is **singular** string, not `roles[]`.

Users module RBAC matrix: **Setup → Permissions** (`RolesPermissions.tsx`).

## Audit

`auditService` logs `users`, `global_settings`, `branding` writes (`mms-security.md`).

## Checklist

- [ ] New `/api/db/*` write calls `canWriteCollection` / `canWriteObject`
- [ ] New REST write calls appropriate `canWriteCollection` or resource-specific check
- [ ] New admin-only object keys added to `canWriteObject`
- [ ] UI gates use `can()` — not raw role strings
- [ ] Denied action returns `403` + stable `type`
