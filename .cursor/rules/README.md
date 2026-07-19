# MMS Cursor Rules

Project rules for the Madrasa Management System. Cursor loads `.mdc` files from this directory automatically.

**Architecture rules:** `mms-module-architecture.mdc`, `mms-ops-infrastructure.mdc`, `mms-ui-ux-design.mdc`, `mms-data-layer.mdc`.

## Always Applied (6)

| Rule | Purpose |
|------|---------|
| `antigravity-global.mdc` | Agent cognition, output economy, security, TS/git standards |
| `mms-core.mdc` | Stack, boundaries, domain, edit discipline — **index only; details in scoped rules** |
| `mms-migration-status.mdc` | Target vs current gaps + recently resolved — do not regress |
| `mms-dependencies.mdc` | Latest stable Node, pnpm, and workspace dependency upgrades |
| `mms-dry.mdc` | DRY — single source of truth, extraction thresholds, duplication bans, `@mms/shared` exports |
| `mms-completion-review.mdc` | Self-review after code edits — verify, fix bugs, then mark done |

## Scoped Rules (13)

| Rule | Focus / Topic |
|------|---------------|
| `mms-ops-infrastructure.mdc` | Local dev setup, environment variables, Docker backend ports, health endpoints, Linux compatibility, and CI expectations |
| `mms-ui-ux-design.mdc` | Consolidated UI components, design tokens, forms (`FormModal`), navigation tabs, notifications, and accessibility (RTL / WCAG) |
| `mms-module-architecture.mdc` | Universal module contract schemas, three-tier tab layout, Work/Reports/Setup scopes, background jobs, and module lifecycle rules |
| `mms-data-layer.mdc` | PostgreSQL, Drizzle schema, migrations, database transactions, TanStack Query fetching, and deprecated localStorage caching |
| `mms-form-architecture.mdc` | Dynamic form blueprint schemas, branded IDs, RLS context, client state, file uploads |
| `mms-structure-naming.mdc` | Monorepo layout, colocation, file-size splits, naming (files, folders, symbols, routes, i18n keys), and UI-to-DB casing alignment |
| `mms-hooks.mdc` | Custom React hooks (live data, sorting, config contexts) |
| `mms-auth-security.mdc` | Auth, users, JWT session shapes, RBAC permissions, multi-tenant isolation, cookie policies, rate limits, and threat model |
| `mms-settings-i18n.mdc` | Settings hierarchy, settings persistence and preview, navigation groups, translations/locales (en/ar/ur/fa) |
| `mms-fields.mdc` | Field and tab registry |
| `mms-api-interface.mdc` | Vite SPA shell, routing, apiClient, providers, Fastify server API routes, and schema validation |
| `mms-reports.mdc` | Analytics implementation & exports |
| `mms-testing-observability.mdc` | Vitest, API tests, CI expectations, logging formats, healthchecks, ErrorBoundary, and error reporting |

## Skills (Workflows)

`.cursor/skills/` — task-discovered workflow guides. Index: [../skills/README.md](../skills/README.md). Overview: [../../AGENTS.md](../../AGENTS.md).

## Agent Mirrors

| Tool | Rules | Skills |
|------|-------|--------|
| **Antigravity** | `.agent/rules/*.md` | `.agent/skills/` |
| **Claude Code** | `.claude/rules/*.md` | `.claude/skills/` |
| **Cursor** | `.cursor/rules/*.mdc` (canonical for rule bodies) | `.cursor/skills/` |

**Sync policy:** rule bodies identical across all three; only frontmatter differs (Cursor: `globs` + `alwaysApply`; Antigravity: `trigger`; Claude: `paths` or always-on). Cross-references use `.mdc` in Cursor, `.md` elsewhere.

After editing standards:

```bash
bash .agent/scripts/sync-all.sh
```

## PR / Change Checklist

- [ ] `pnpm typecheck` && `pnpm test`
- [ ] Frontend lint if touched: `cd apps/frontend && pnpm lint`
- [ ] No new hardcoded labels/colours — see `mms-settings-i18n.mdc` (en/ar/ur/fa) + registries
- [ ] Module tiers respect isolation boundaries in `mms-module-architecture.mdc`
- [ ] Shared logic in `@mms/shared` if cross-app or 2+ modules
- [ ] No commit unless user requested
- [ ] Update **all mirrors** when changing standards: `bash .agent/scripts/sync-all.sh`
- [ ] Auth/write routes: `mms-auth-security.mdc`
- [ ] New UI: `mms-ui-ux-design.mdc` keyboard + labels
- [ ] New `@mms/shared` pure helpers: unit test per `mms-testing-observability.mdc`

## Removed / Merged (History)

| Removed | Merged into |
|---------|-------------|
| `mms-ai-editing.mdc` | `mms-core` + `antigravity-global` |
| `mms-ops.mdc`, `mms-production-ports.mdc`, `mms-linux-compatibility.mdc`, `mms-ci.mdc`, `saas-architecture.mdc` | `mms-ops-infrastructure.mdc` |
| `mms-ui-visual.mdc`, `mms-ui-rendering.mdc`, `mms-ui-tabs.mdc`, `mms-ui-forms.mdc`, `mms-a11y.mdc` | `mms-ui-ux-design.mdc` |
| `mms-module-work.mdc`, `mms-module-setup.mdc`, `mms-module-isolation.mdc`, `mms-module-crosscutting.mdc`, `mms-background-jobs.mdc` | `mms-module-architecture.mdc` |
| `mms-shared-dry.mdc` | `mms-dry.mdc` |
| `mms-database.mdc`, `mms-query.mdc` | `mms-data-layer.mdc` |
| `mms-structure.mdc`, `mms-naming.mdc` | `mms-structure-naming.mdc` |
| `mms-auth.mdc`, `mms-rbac.mdc`, `mms-tenant.mdc`, `mms-security.mdc` | `mms-auth-security.mdc` |
| `mms-config.mdc`, `mms-settings-navigation.mdc`, `mms-i18n.mdc` | `mms-settings-i18n.mdc` |
| `mms-frontend.mdc`, `mms-backend.mdc` | `mms-api-interface.mdc` |
| `mms-contacts.mdc`, `mms-contact-link.mdc` | Completely Deleted |
| `mms-testing.mdc`, `mms-observability.mdc` | `mms-testing-observability.mdc` |

## Verify in Cursor

**Settings → Rules** — six always-apply rules + 13 file-scoped rules when matching paths are open (**19 total**).
