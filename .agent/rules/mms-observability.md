---
trigger: model_decision
---

# MMS Observability

## Backend logging

- Fastify logger via `LOG_LEVEL` env (`mms-ops.md`) — default `info` in prod
- **`onResponse` hook** (`app.ts`): log `statusCode`, method, url, tenant, `userId` on **4xx/5xx** only — no bodies
- **Never log**: passwords, JWTs, refresh tokens, OTP codes, full `passwordHash`, bulk collection payloads with PII

```ts
// ✅
request.log.warn({ err, userId, collection: name }, 'collection write failed');

// ❌
console.log('user login', { email, password, token });
```

WhatsApp/Puppeteer init failures may log to stderr — expected in dev without Chrome; do not fail server start.

## Health endpoints

| Route | Purpose | Status |
|-------|---------|--------|
| `GET /health` | Liveness — process up | **Implemented** |
| `GET /ready` | Readiness — `pingDatabase()` | **Implemented** — returns `503` if DB down |

- Vite proxies `/health` to backend in dev (`vite.config.js`)
- `AuthContext.checkAppState()` calls `/health` — keep fast, unauthenticated, non-blocking for UI
- Deploy workflow should curl `/ready` after PM2 restart (`mms-ops.md`)

## API errors

Stable JSON shape (`mms-backend.md`):

```json
{ "type": "validation_error", "message": "…" }
```

- `message` for dev/debug or generic display — user copy maps `type` → `t('errors.*')` (`mms-i18n.md`)
- Do not leak raw SQLite or database errors in production

## Frontend resilience

| Pattern | Rule |
|---------|------|
| Heavy module sections | `ErrorBoundary` (`mms-ui-rendering.md`) |
| API failures | `notify.error` with `t()` — no silent `catch` |
| Query errors | Surface `isError` from TanStack Query (`mms-query.md`) |
| Auth boot | Do not block entire app on `/health` — only initial `/api/auth/me` (`App.tsx`) |

## Client error reporting (target)

Sentry or equivalent — init in `main.tsx`, scrub tokens/PII from breadcrumbs.

## Metrics (target)

- Request duration per route prefix
- Failed login counter
- `/api/db/sync` payload size

## Checklist

- [ ] New route logs failures with context, not secrets
- [ ] User-visible failures use `notify.error` + translated copy
- [ ] Module heavy trees wrapped in `ErrorBoundary`
- [ ] Deploy verifies `/ready` after restart
