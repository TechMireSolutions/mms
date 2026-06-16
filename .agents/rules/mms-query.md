---
trigger: model_decision
---

# MMS Data Fetching (TanStack Query)

## Choose the right layer

| Data | Pattern | Rule owner |
|------|---------|------------|
| Local collections (`mms_*` / sync API) | `useLiveCollection` + `saveCollection` | `mms-data-layer.md` |
| Dedicated REST endpoints | `useQuery` / `useMutation` + **`apiJson`** | this file |
| Cross-view refresh (local) | `local-database-update` event | `mms-data-layer.md` |

**Banned:** bare `fetch` in `useEffect` for server state; raw `fetch('/api/...')` in hooks — use `apiClient` (`mms-frontend.md`).

## Reference implementations

| Hook | Query key | Endpoint |
|------|-----------|----------|
| `useWorkspaceRegistry` | `['workspace', 'registry']` | `GET /api/workspace/registry` |
| `useStudents` | `['students', 'list']` | `GET /api/students` |
| `useStudentCount` | `STUDENT_COUNT_QUERY_KEY` | `GET /api/students/count` |
| `useStudentMutations` | invalidates students + count | `POST/PUT/DELETE /api/students` |
| `useContacts` | `CONTACTS_QUERY_KEY` | `GET /api/contacts` |
| `useContactMutations` | invalidates contacts list | `POST/PUT/DELETE /api/contacts` |

Auth/session: `AuthContext` — `/api/auth/me`, login, handoff (via `apiClient`).

## Query conventions

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/lib/apiClient';

export const STUDENTS_QUERY_KEY = ['students', 'list'] as const;

useQuery({
  queryKey: STUDENTS_QUERY_KEY,
  queryFn: () => apiJson<{ students: Student[] }>('/api/students').then(r => r.students),
  enabled: isAuthenticated,
  staleTime: 30_000,
});
```

- **Keys:** stable tuples — export as `const` from the hook file; document in JSDoc
- **Mutations:** `onSuccess` → `queryClient.invalidateQueries` for affected keys
- **Errors:** surface via `notify.error` with `t()` — no silent failure
- **Loading:** use `isPending` / `isFetching` — not parallel one-shot `useState` loaders

## Scope

- Existing module CRUD on `/api/db/collections/*` stays on `useLiveCollection` until migrated intentionally
- **New domain with backend resource routes:** Query-first — server is source of truth (`mms-data-layer.md` trajectory)
- **Hybrid migration:** after Query fetch, optionally `saveCollection` so legacy KPI/report views reading localStorage stay in sync (see `useStudents`)

## Checklist (new REST feature)

- [ ] `useQuery` or `useMutation` — not manual `useEffect` + `fetch`
- [ ] All requests through `apiFetch` / `apiJson`
- [ ] Query key exported as named constant
- [ ] DTO types from `@mms/shared` or colocated interface
- [ ] Invalidation on writes
- [ ] Page uses hook — not duplicate `useLiveCollection` for same entity
