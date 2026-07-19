# MMS Cursor Rules

Project rules for the Madrasa Management System. Cursor loads `.md` files from this directory automatically.

**Architecture rules:** `mms-module-architecture.md`, `mms-ops-infrastructure.md`, `mms-ui-ux-design.md`, `mms-data-layer.md`.

## Always Applied (6)

| Rule | Purpose |
|------|---------|
| `antigravity-global.md` | Agent cognition, output economy, security, TS/git standards |
| `mms-core.md` | Stack, boundaries, domain, edit discipline — **index only; details in scoped rules** |
| `mms-migration-status.md` | Target vs current gaps + recently resolved — do not regress |
| `mms-dependencies.md` | Latest stable Node, pnpm, and workspace dependency upgrades |
| `mms-dry.md` | DRY — single source of truth, extraction thresholds, duplication bans, `@mms/shared` exports |
| `mms-completion-review.md` | Self-review after code edits — verify, fix bugs, then mark done |

## Scoped Rules (13)

| Rule | Focus / Topic |
|------|---------------|
| `mms-ops-infrastructure.md` | Local dev setup, environment variables, Docker backend ports, health endpoints, Linux compatibility, and CI expectations |
| `mms-ui-ux-design.md` | Consolidated UI components, design tokens, forms (`FormModal`), navigation tabs, notifications, and accessibility (RTL / WCAG) |
| `mms-module-architecture.md` | Universal module contract schemas, three-tier tab layout, Work/Reports/Setup scopes, background jobs, and module lifecycle rules |
| `mms-data-layer.md` | PostgreSQL, Drizzle schema, migrations, database transactions, TanStack Query fetching, and deprecated localStorage caching |
| `mms-form-architecture.md` | Dynamic form blueprint schemas, branded IDs, RLS context, client state, file uploads |
| `mms-structure-naming.md` | Monorepo layout, colocation, file-size splits, naming (files, folders, symbols, routes, i18n keys), and UI-to-DB casing alignment |
| `mms-hooks.md` | Custom React hooks (live data, sorting, config contexts) |
| `mms-auth-security.md` | Auth, users, JWT session shapes, RBAC permissions, multi-tenant isolation, cookie policies, rate limits, and threat model |
| `mms-settings-i18n.md` | Settings hierarchy, settings persistence and preview, navigation groups, translations/locales (en/ar/ur/fa) |
| `mms-fields.md` | Field and tab registry |
| `mms-api-interface.md` | Vite SPA shell, routing, apiClient, providers, Fastify server API routes, and schema validation |
| `mms-reports.md` | Analytics implementation & exports |
| `mms-testing-observability.md` | Vitest, API tests, CI expectations, logging formats, healthchecks, ErrorBoundary, and error reporting |

## Skills (Workflows)

`.cursor/skills/` — task-discovered workflow guides. Index: [../skills/README.md](../skills/README.md). Overview: [../../AGENTS.md](../../AGENTS.md).

## Agent Mirrors

| Tool | Rules | Skills |
|------|-------|--------|
| **Antigravity** | `.agent/rules/*.md` | `.agent/skills/` |
| **Claude Code** | `.claude/rules/*.md` | `.claude/skills/` |
| **Cursor** | `.cursor/rules/*.md` (canonical for rule bodies) | `.cursor/skills/` |

**Sync policy:** rule bodies identical across all three; only frontmatter differs (Cursor: `globs` + `alwaysApply`; Antigravity: `trigger`; Claude: `paths` or always-on). Cross-references use `.md` in Cursor, `.md` elsewhere.

After editing standards:

```bash
bash .agent/scripts/sync-all.sh
```

## PR / Change Checklist

- [ ] `pnpm typecheck` && `pnpm test`
- [ ] Frontend lint if touched: `cd apps/frontend && pnpm lint`
- [ ] No new hardcoded labels/colours — see `mms-settings-i18n.md` (en/ar/ur/fa) + registries
- [ ] Module tiers respect isolation boundaries in `mms-module-architecture.md`
- [ ] Shared logic in `@mms/shared` if cross-app or 2+ modules
- [ ] No commit unless user requested
- [ ] Update **all mirrors** when changing standards: `bash .agent/scripts/sync-all.sh`
- [ ] Auth/write routes: `mms-auth-security.md`
- [ ] New UI: `mms-ui-ux-design.md` keyboard + labels
- [ ] New `@mms/shared` pure helpers: unit test per `mms-testing-observability.md`

## Removed / Merged (History)

| Removed | Merged into |
|---------|-------------|
| `mms-ai-editing.md` | `mms-core` + `antigravity-global` |
| `mms-ops.md`, `mms-production-ports.md`, `mms-linux-compatibility.md`, `mms-ci.md`, `saas-architecture.md` | `mms-ops-infrastructure.md` |
| `mms-ui-visual.md`, `mms-ui-rendering.md`, `mms-ui-tabs.md`, `mms-ui-forms.md`, `mms-a11y.md` | `mms-ui-ux-design.md` |
| `mms-module-work.md`, `mms-module-setup.md`, `mms-module-isolation.md`, `mms-module-crosscutting.md`, `mms-background-jobs.md` | `mms-module-architecture.md` |
| `mms-shared-dry.md` | `mms-dry.md` |
| `mms-database.md`, `mms-query.md` | `mms-data-layer.md` |
| `mms-structure.md`, `mms-naming.md` | `mms-structure-naming.md` |
| `mms-auth.md`, `mms-rbac.md`, `mms-tenant.md`, `mms-security.md` | `mms-auth-security.md` |
| `mms-config.md`, `mms-settings-navigation.md`, `mms-i18n.md` | `mms-settings-i18n.md` |
| `mms-frontend.md`, `mms-backend.md` | `mms-api-interface.md` |
| `mms-contacts.md`, `mms-contact-link.md` | Completely Deleted |
| `mms-testing.md`, `mms-observability.md` | `mms-testing-observability.md` |

## Verify in Cursor

**Settings → Rules** — six always-apply rules + 13 file-scoped rules when matching paths are open (**19 total**).
