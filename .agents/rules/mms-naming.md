---
trigger: model_decision
---

# Naming Policy

Names are **semantic**, **consistent**, and **grep-friendly**. Prefer clarity over brevity.

## Files & folders

| Kind | Convention | Example |
|------|------------|---------|
| React page | `PascalCase.tsx` | `Students.tsx`, `AccountProfile.tsx` |
| React component | `PascalCase.tsx` | `StudentForm.tsx`, `PageHeader.tsx` |
| Custom hook file | `use` + `PascalCase.ts` | `useStudents.ts`, `useModuleTierTabs.ts` |
| shadcn / Radix primitive | `kebab-case.tsx` | `dropdown-menu.tsx` (generator default — do not rename) |
| FE module folder | `camelCase` or single lowercase word | `contacts/`, `questionBank/`, `reports/` |
| BE route file | `camelCase.ts` | `platformAuth.ts`, `contacts.ts` |
| BE service | `{domain}Service.ts` or `{domain}/{name}Service.ts` | `studentService.ts`, `auth/userService.ts` |
| Zod schemas | `{resource}Schemas.ts` | `contactSchemas.ts` |
| Shared pure util | `camelCase.ts` | `tenantUtils.ts`, `formatDate.ts` |
| Migration (data) | `NNN_snake_description.ts` | `008_backfill_login_email.ts` |
| Migration (DDL) | Drizzle generated names | `0001_auth_artifacts.sql` |
| Scripts | `kebab-case.sh` | `sync-skills.sh`, `deploy-on-server.sh` |
| Tests | same base + `.test.ts(x)` | `rbacService.test.ts`, `hooks.test.ts` |

**New folders:** lowercase single word when possible; `camelCase` for multi-word feature names — match the nearest sibling module.

## Symbols (TypeScript)

| Kind | Convention | Example |
|------|------------|---------|
| Component | `PascalCase` | `function StudentForm()` |
| Hook | `use` + `PascalCase` | `useStudents()` |
| Function / method | `camelCase` verb-first | `parsePhoneNumber`, `buildApp` |
| Constant | `SCREAMING_SNAKE` if truly constant | `DEFAULT_GLOBAL_SETTINGS` |
| Type / interface | `PascalCase` — no `I` prefix | `Contact`, `StudentCreateInput` |
| Enum members | `PascalCase` or `SCREAMING_SNAKE` — match surrounding type | |
| React context | `{Name}Context`, `{Name}Provider` | `AuthContext`, `AuthProvider` |
| Zod schema | `{name}Schema` | `contactCreateSchema` |
| Route plugin | `*Routes` or domain noun | `registerStudentRoutes` |

## Routes & API paths

- URL segments: **kebab-case** — `/api/students`, `/api/platform/workspaces`
- JSON fields: **camelCase** — matches TS (`firstName`, `loginEmail`)
- Collection keys: **snake_case** — matches DB JSON store (`contact_roles`, `global_settings`)

## i18n & registry keys

- Translation keys: **dot-separated** lowercase — `students.actions.add` (`mms-i18n.md`)
- Field/tab ids: **snake_case** stable ids — `labelKey` for display (`mms-fields.md`)
- Permission strings: **dot notation** — `students.write` (`mms-rbac.md`)

## Banned patterns

| Avoid | Use instead |
|-------|-------------|
| `persona`, `Persona` | Removed domain — fix if found |
| `data`, `info`, `helper`, `util` as sole name | Specific noun: `contactFieldUtils` |
| `tmp`, `old`, `new`, `copy` suffixes | Delete or rename on touch |
| Abbreviations except common (`id`, `url`, `api`, `rbac`) | Full words |
| Default exports except lazy `pages/` | Named exports for components/hooks/utils |

## Renames

When renaming for consistency: update imports, route registries, tests, and `@mms/shared` re-exports in the **same change** — no dual-name aliases left behind.
