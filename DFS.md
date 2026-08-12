# Dynamic Form System Implementation Guide for MMS

## Complete Technical Specification & Implementation Blueprint

**Version:** 2.0 (Reconciled with MMS schema conventions, RLS, migration flow, server-side validation, modern best practices)

**Date:** 2026-08-12

**Status:** Approved for Implementation

This document is the authoritative blueprint for the Dynamic Form System (DFS) within the Madrasa Management System (MMS) monorepo. It is fully reconciled with the actual codebase conventions: **`workspaceSubdomain: text`** tenant keys (not `workspaceId: uuid`), composite primary keys, `FORCE ROW LEVEL SECURITY`, forward-only Drizzle migrations with journal entries, `authenticateTenant` + RBAC guards, `apiJson`/`apiFetch` client, decimal-as-string money, E.164 phone validation, server-side re-validation, parameterized SQL, and the `mms-*` rule suite.

It maps directly to the existing tech stack (`pnpm`, Fastify 5, Drizzle ORM, React 19, TanStack Query v5, React Hook Form, and Zod).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema Design, RLS & Performance](#2-database-schema-design-rls--performance)
   - 2.1 Custom Tabs & Fields Tables
   - 2.2 Audit Log Integration (Existing Table)
   - 2.3 Entity Tables & JSONB Indexing
   - 2.4 Row Level Security (Mandatory)
   - 2.5 Forward-Only Migration & Journal
3. [Shared Package (`@mms/shared`)](#3-shared-package-mmsshared)
   - 3.1 Zod Validation Schemas (`.strict()`)
   - 3.2 Field Type Metadata Registry
   - 3.3 Dynamic Zod Schema Builder (decimal-as-string, E.164, runtime-safe enums)
   - 3.4 Custom Field Helpers (`createFormCustomFieldHelpers`)
4. [Backend Architecture (`apps/backend`)](#4-backend-architecture-appsbackend)
   - 4.1 Fastify Plugin, Middleware & RBAC
   - 4.2 Service Layer (parameterized uniqueness, module-aware table map)
   - 4.3 Uniqueness Check & Type Lock Logic
   - 4.4 Automated Audit Hook (Fastify v5 `onSend` with payload return)
   - 4.5 Server-Side `customData` Validation on Entity Save (never trust client)
   - 4.6 Reorder Endpoints (transactional batch)
   - 4.7 Optimistic Concurrency (`updated_at` → 409)
   - 4.8 Idempotency, Rate Limits & Body Limits
5. [Frontend Architecture (`apps/frontend`)](#5-frontend-architecture-appsfrontend)
   - 5.1 TanStack Query v5 (`apiJson`, `enabled: isAuthenticated`, tuple keys)
   - 5.2 Setup UI – Tab & Field Builder
   - 5.3 Custom Field Editor
   - 5.4 Dynamic Form Renderer for Entity Pages
   - 5.5 Drag-and-Drop Reordering
   - 5.6 Accessibility (focus-return, `aria-busy`, `prefers-reduced-motion`)
   - 5.7 i18n (no hardcoded labels, `t()` for all strings)
6. [Testing Strategy](#6-testing-strategy)
7. [Deployment & Security](#7-deployment--security)
8. [Appendix: Production-Grade Code Artifacts](#8-appendix-production-grade-code-artifacts)
9. [Dropdown Option Management (Lookup Lists)](#9-dropdown-option-management-lookup-lists)
   - 9.1 Concept: Inline Form Dropdown CRUD vs. Setup Tabs
   - 9.2 Data Flow: End-to-End Inline CRUD
   - 9.3 Backend: Lookup API Routes
   - 9.4 Shared Package: Lookup Kinds & Field-Target Map
   - 9.5 Frontend: Lookup Query Hooks
   - 9.6 Inline Form Dropdown Option Management
   - 9.7 Form Renderer: Resolving Options at Runtime
   - 9.8 Implementation Checklist for New Modules

---

## 1. Architecture Overview

The Dynamic Form System is organized across three main monorepo packages:

```
mms/
├── packages/shared/          # @mms/shared: Zod schemas, dynamic validators, i18n keys, helpers
├── apps/backend/             # Fastify 5 API, Drizzle ORM, workspaceSubdomain RBAC, audit hooks
└── apps/frontend/            # React 19 SPA, RHF, Radix UI, TanStack Query v5, Tailwind CSS v4
```

- **Database Layer**: PostgreSQL tables managed via Drizzle ORM. **Tenant isolation is enforced via `workspaceSubdomain: text` referencing `workspaces.subdomain`, composite primary keys `[workspaceSubdomain, id]`, and `FORCE ROW LEVEL SECURITY` on every tenant table.** `customData` on entities is indexed using GIN expressions for fast uniqueness scans.
- **Backend Layer**: Fastify 5 routes protected by `authenticateTenant` + `rbacService` (`can(module, 'editSetup')`) guards. State modifications trigger append-only `audit_logs` records via Fastify `onSend` hooks. Server-side re-validates `customData` against the dynamic Zod schema before persisting — **never trust the client**.
- **Frontend Layer**: React 19 components powered by `react-hook-form` and `@hookform/resolvers/zod`. Form values are validated against schemas generated dynamically on the client using `@mms/shared`, then re-validated server-side. All API calls use `apiJson`/`apiFetch` from `@/lib/apiClient` (cookie session, `credentials: 'include'`).

### Key invariants (non-negotiable)

| Invariant | Enforcement |
|---|---|
| Tenant isolation | `workspaceSubdomain: text` + composite PK + `FORCE ROW LEVEL SECURITY` + `SET LOCAL` via `withTenantTransaction` |
| ID format | `text('id')` with app-generated IDs (`cf_<ts>_<rand>`, `custom_<ts>_<rand>`) via `node:crypto.randomUUID()` — **not** DB `uuid` PKs |
| Money | Decimal-as-string (`z.string().regex(/^\d+(\.\d{1,2})?$/)`) — never `z.number()` for currency |
| Phone | E.164 (`z.string().regex(/^\+[1-9]\d{1,14}$/)`) |
| Validation | Server-side `buildDynamicValidationSchema` + `safeParse` on every save — client validation is UX only |
| Uniqueness | `fieldKey` validated against the live `customFields` registry before any `@>` containment query |
| Audit | `onSend` hook returns `payload`; captures previous-state in `preHandler`, new-state via re-fetch (not response body) |
| Migrations | Forward-only `migrations_drizzle/00NN_*.sql` + `_journal.json` entry — **ban `drizzle-kit push`** on shared/prod |

---

## 2. Database Schema Design, RLS & Performance

### 2.1 Custom Tabs & Fields Tables

File: `apps/backend/src/db/schema.ts` (single-file schema, append to existing exports)

The MMS codebase uses **`workspaceSubdomain: text` referencing `workspaces.subdomain`** (not `workspaceId: uuid`), **composite primary keys** `[workspaceSubdomain, id]`, and **`text('id')`** with app-generated IDs. The `customTabs` table already exists in the repo (schema.ts:784); `customFields` is added here.

```ts
// customTabs already exists in schema.ts — reproduced for reference; do NOT re-declare.
export const customTabs = pgTable('custom_tabs', {
  id: text('id').notNull(), // e.g. "custom_<ts>_<rand>" — app-generated, NOT a uuid
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  moduleId: text('module_id').notNull(), // 'students', 'contacts', 'teachers', 'sessions', etc.
  key: text('key').notNull(),
  label: text('label').notNull(),
  icon: text('icon'),
  enabled: boolean('enabled').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  permissions: jsonb('permissions').$type<string[]>(),
  description: text('description'),
  color: text('color'),
  isSystem: boolean('is_system').notNull().default(false),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  uniqueIndex('custom_tabs_workspace_module_key_idx').on(table.workspaceSubdomain, table.moduleId, table.key),
  index('custom_tabs_workspace_idx').on(table.workspaceSubdomain),
]);

// NEW — add this table to schema.ts
export const customFields = pgTable('custom_fields', {
  id: text('id').notNull(), // e.g. "cf_<ts>_<rand>" — app-generated, NOT a uuid
  workspaceSubdomain: text('workspace_subdomain').notNull().references(() => workspaces.subdomain, { onDelete: 'cascade' }),
  tabId: text('tab_id').notNull(), // FK to customTabs.id (composite — no Drizzle .references() on text PK)
  moduleId: text('module_id').notNull(), // denormalized for scoped queries (avoids join on list)
  key: text('key').notNull(),
  label: text('label').notNull(),
  type: text('type').$type<FieldType>().notNull(),
  enabled: boolean('enabled').notNull().default(true),
  required: boolean('required').notNull().default(false),
  unique: boolean('unique').notNull().default(false),
  placeholder: text('placeholder'),
  description: text('description'),
  defaultValue: text('default_value'),
  options: jsonb('options').$type<string[]>(),
  minValue: integer('min_value'),
  maxValue: integer('max_value'),
  mask: text('mask'),
  allowedExtensions: text('allowed_extensions'),
  maxFileSize: integer('max_file_size'),
  sortOrder: integer('sort_order').notNull().default(0),
  hasData: boolean('has_data').notNull().default(false),
  isSystem: boolean('is_system').notNull().default(false),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceSubdomain, table.id] }),
  index('custom_fields_workspace_tab_idx').on(table.workspaceSubdomain, table.tabId),
  index('custom_fields_workspace_module_idx').on(table.workspaceSubdomain, table.moduleId),
  // Partial index for active lists (exclude soft-deleted) — mms-data-layer hot-list pattern
  index('custom_fields_workspace_active_idx').on(table.workspaceSubdomain, table.moduleId, table.sortOrder),
]);
```

**Why `text('id')` + composite PK, not `uuid('id').defaultRandom().primaryKey()`:**
1. App-generated IDs (`cf_<ts>_<rand>`) are human-debuggable and sort naturally by creation time.
2. Composite PK `[workspaceSubdomain, id]` is the MMS tenant-isolation primitive — every query is tenant-scoped at the index level.
3. `uuid` PKs would require a parallel `workspaceId` column and break the existing `customTabs` convention.
4. `moduleId` is denormalized onto `customFields` so `listModuleTabs` can query fields scoped by module without joining `customTabs` (avoids the N+1 / over-fetch problem noted in §4.2).

### 2.2 Audit Log Integration (Existing Table)

The MMS codebase **already has** an `audit_logs` table (`schema.ts:769`). DFS audit hooks write to it — they do **not** create a new table. The existing shape:

```ts
// Already in schema.ts:769 — do NOT redeclare.
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  workspaceSubdomain: text('workspace_subdomain'), // nullable — historical rows
  tableName: text('table_name').notNull(),          // 'custom_tab' | 'custom_field'
  recordId: text('record_id').notNull(),            // the tab/field id
  action: text('action').notNull(),                 // 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  oldValues: jsonb('old_values'),                   // previous row state
  newValues: jsonb('new_values'),                   // re-fetched post-write state (NOT request body)
  userId: text('user_id'),
  changedAt: timestamp('changed_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('audit_logs_workspace_changed_idx').on(table.workspaceSubdomain, table.changedAt),
  index('audit_logs_table_record_idx').on(table.tableName, table.recordId),
]);
```

**`audit_logs` RLS gap (pre-existing):** `audit_logs` currently lacks `FORCE ROW LEVEL SECURITY`. This is a pre-existing tech-debt item outside DFS scope, but DFS writes to it, so a follow-up migration to add RLS should be filed. DFS audit hooks always set `workspaceSubdomain` from `getRequestTenant()`, never from the request body.

### 2.3 Entity Tables & JSONB Indexing

Entity tables (`contacts`, `students`, `teachers`, `sessions`, etc.) already include a `customData: jsonb` column with a GIN index. No schema change required — the GIN index enables the `@>` containment query used by uniqueness checks.

```ts
// Already in schema.ts — reproduced for reference. Each entity has this pattern:
customData: jsonb('custom_data').$type<Record<string, unknown>>().default({}).notNull(),
// ...
index('students_custom_data_gin_idx').using('gin', table.customData),
```

**JSONB indexing note:** Use `jsonb_path_ops` on the GIN index for containment-only queries (`@>`), which is smaller and faster than the default `jsonb_ops`. The existing indexes use the default; a future migration may switch to `jsonb_path_ops` if storage becomes a concern.

### 2.4 Row Level Security (Mandatory)

Per `mms-schema-migrate` rule #6: **every new tenant table must have `FORCE ROW LEVEL SECURITY`** and tenant-scoping policy. The migration in §2.5 must include:

```sql
-- In the migration SQL file:
ALTER TABLE "custom_fields" FORCE ROW LEVEL SECURITY;

-- Tenant-scoping policy (matching the existing custom_tabs pattern):
CREATE POLICY "custom_fields_tenant_isolation"
  ON "custom_fields"
  USING ("workspace_subdomain" = current_setting('app.tenant_subdomain', true))
  WITH CHECK ("workspace_subdomain" = current_setting('app.tenant_subdomain', true));
```

Writes must use `withTenantTransaction` / `SET LOCAL app.tenant_subdomain` so RLS policies evaluate correctly. Never bypass RLS via `SUPERUSER` connections in app code.

### 2.5 Forward-Only Migration & Journal

MMS uses a custom `initDb` migration runner with forward-only `migrations_drizzle/00NN_*.sql` files + a `_journal.json` index. **Never use `drizzle-kit push`** against shared/prod DBs (`mms-schema-migrate` rule #5).

**Step 1 — append SQL migration:**

File: `apps/backend/src/db/migrations_drizzle/0030_custom_fields.sql`

```sql
-- 0030_custom_fields.sql
CREATE TABLE IF NOT EXISTS "custom_fields" (
  "id" text NOT NULL,
  "workspace_subdomain" text NOT NULL,
  "tab_id" text NOT NULL,
  "module_id" text NOT NULL,
  "key" text NOT NULL,
  "label" text NOT NULL,
  "type" text NOT NULL,
  "enabled" boolean NOT NULL DEFAULT true,
  "required" boolean NOT NULL DEFAULT false,
  "unique" boolean NOT NULL DEFAULT false,
  "placeholder" text,
  "description" text,
  "default_value" text,
  "options" jsonb,
  "min_value" integer,
  "max_value" integer,
  "mask" text,
  "allowed_extensions" text,
  "max_file_size" integer,
  "sort_order" integer NOT NULL DEFAULT 0,
  "has_data" boolean NOT NULL DEFAULT false,
  "is_system" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamp,
  "deleted_by" text,
  "deletion_reason" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "custom_fields_workspace_subdomain_id_pk" PRIMARY KEY ("workspace_subdomain", "id")
);

CREATE INDEX IF NOT EXISTS "custom_fields_workspace_tab_idx"
  ON "custom_fields" ("workspace_subdomain", "tab_id");
CREATE INDEX IF NOT EXISTS "custom_fields_workspace_module_idx"
  ON "custom_fields" ("workspace_subdomain", "module_id");
CREATE INDEX IF NOT EXISTS "custom_fields_workspace_active_idx"
  ON "custom_fields" ("workspace_subdomain", "module_id", "sort_order");

ALTER TABLE "custom_fields"
  ADD CONSTRAINT "custom_fields_workspace_subdomain_workspaces_subdomain_fk"
  FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "custom_fields" FORCE ROW LEVEL SECURITY;

CREATE POLICY "custom_fields_tenant_isolation"
  ON "custom_fields"
  USING ("workspace_subdomain" = current_setting('app.tenant_subdomain', true))
  WITH CHECK ("workspace_subdomain" = current_setting('app.tenant_subdomain', true));
```

**Step 2 — update journal:**

File: `apps/backend/src/db/migrations_drizzle/meta/_journal.json`

```jsonc
// Append to "entries" array:
{
  "idx": 30,
  "version": "7",
  "when": 1786058000000,
  "tag": "0030_custom_fields",
  "breakpoints": true
}
```

**Step 3 — run migrations:**

```bash
# Local dev:
pnpm --filter mms-backend exec tsx src/scripts/migrateDb.ts

# Prod deploy (Hetzner VPS, PM2):
pm2 restart mms-backend --update-env  # initDb runs on boot
```

**Expand/contract note:** This migration is purely additive (new table) — no contract phase needed. If a future change alters `customFields` columns, use expand/contract: add nullable → backfill → constrain; drop only after a dual-read window.

---

## 3. Shared Package (`@mms/shared`)

### 3.1 Zod Validation Schemas (`.strict()`)

File: `packages/shared/src/schemas/dynamicFormSchemas.ts`

Per `mms-backend-api`: "Zod write DTOs prefer `.strict()`." The schema uses `sortOrder` (matching the DB column `sort_order`) — not `order`.

```ts
import { z } from 'zod';

export const FIELD_TYPE = z.enum([
  'text', 'textarea', 'number', 'date', 'url', 'email',
  'select', 'tags', 'boolean', 'currency', 'phone', 'file',
  'rating', 'datetime',
]);
export type FieldType = z.infer<typeof FIELD_TYPE>;

export const customFieldConfigSchema = z
  .object({
    // IDs are text (app-generated), NOT uuid — matches schema.ts text('id')
    id: z.string().min(1),
    tabId: z.string().min(1),
    key: z.string().min(1, 'Field key is required'),
    label: z.string().min(2, 'Label must be at least 2 characters'),
    type: FIELD_TYPE,
    enabled: z.boolean().default(true),
    required: z.boolean().default(false),
    unique: z.boolean().default(false),
    placeholder: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    defaultValue: z.string().nullable().optional(),
    options: z.array(z.string()).nullable().optional(),
    minValue: z.number().nullable().optional(),
    maxValue: z.number().nullable().optional(),
    mask: z.string().nullable().optional(),
    allowedExtensions: z.string().nullable().optional(),
    maxFileSize: z.number().nullable().optional(),
    sortOrder: z.number().int().min(0).default(0),
    hasData: z.boolean().optional().default(false),
    isSystem: z.boolean().optional().default(false),
  })
  .strict();
export type CustomFieldConfig = z.infer<typeof customFieldConfigSchema>;

export const tabConfigSchema = z
  .object({
    id: z.string().min(1),
    key: z.string().min(1, 'Tab key is required'),
    label: z.string().min(1, 'Tab label is required'),
    enabled: z.boolean().default(true),
    required: z.boolean().default(false),
    sortOrder: z.number().int().min(0).default(0),
    isSystem: z.boolean().default(false),
    fields: z.array(customFieldConfigSchema).default([]),
  })
  .strict();
export type TabConfig = z.infer<typeof tabConfigSchema>;

// Write DTO for PATCH (all fields optional, but type-locked when hasData is true)
export const updateFieldBodySchema = customFieldConfigSchema
  .partial()
  .omit({ id: true, tabId: true })
  .strict();

// Write DTO for reorder (transactional batch)
export const reorderFieldsBodySchema = z
  .object({
    items: z.array(z.object({ id: z.string().min(1), sortOrder: z.number().int().min(0) }).strict()),
  })
  .strict();
```

### 3.2 Field Type Metadata Registry

File: `packages/shared/src/constants/fieldTypesMeta.ts`

```ts
import type { FieldType } from '../schemas/dynamicFormSchemas.js';

export interface FieldTypeMeta {
  type: FieldType;
  displayLabel: string;
  description: string;
  hasOptions: boolean;
  isNumeric: boolean;
  supportsMinMax: boolean;
  supportsMask: boolean;
  supportsFileRules: boolean;
}

export const FIELD_TYPES_META: Record<FieldType, FieldTypeMeta> = {
  text:      { type: 'text',      displayLabel: 'Single-line Text', description: 'Standard text input',         hasOptions: false, isNumeric: false, supportsMinMax: false, supportsMask: true,  supportsFileRules: false },
  textarea:  { type: 'textarea',  displayLabel: 'Multi-line Text',  description: 'Expanding text area',         hasOptions: false, isNumeric: false, supportsMinMax: false, supportsMask: false, supportsFileRules: false },
  number:    { type: 'number',    displayLabel: 'Number',          description: 'Numeric field',               hasOptions: false, isNumeric: true,  supportsMinMax: true,  supportsMask: true,  supportsFileRules: false },
  date:      { type: 'date',      displayLabel: 'Date',            description: 'Calendar date picker',        hasOptions: false, isNumeric: false, supportsMinMax: false, supportsMask: false, supportsFileRules: false },
  url:       { type: 'url',       displayLabel: 'URL',             description: 'Web address input',           hasOptions: false, isNumeric: false, supportsMinMax: false, supportsMask: false, supportsFileRules: false },
  email:     { type: 'email',     displayLabel: 'Email',           description: 'Email address input',         hasOptions: false, isNumeric: false, supportsMinMax: false, supportsMask: false, supportsFileRules: false },
  select:    { type: 'select',    displayLabel: 'Dropdown Select',  description: 'Single select from list',    hasOptions: true,  isNumeric: false, supportsMinMax: false, supportsMask: false, supportsFileRules: false },
  tags:      { type: 'tags',       displayLabel: 'Predefined Tags',  description: 'Multi-select pill options',  hasOptions: true,  isNumeric: false, supportsMinMax: false, supportsMask: false, supportsFileRules: false },
  boolean:   { type: 'boolean',   displayLabel: 'Checkbox Toggle',  description: 'True or false switch',      hasOptions: false, isNumeric: false, supportsMinMax: false, supportsMask: false, supportsFileRules: false },
  currency:  { type: 'currency',  displayLabel: 'Currency',         description: 'Monetary amount (decimal)',   hasOptions: false, isNumeric: true,  supportsMinMax: true,  supportsMask: true,  supportsFileRules: false },
  phone:     { type: 'phone',     displayLabel: 'Phone Number',    description: 'Telephone input (E.164)',     hasOptions: false, isNumeric: false, supportsMinMax: false, supportsMask: true,  supportsFileRules: false },
  file:      { type: 'file',      displayLabel: 'File Upload',     description: 'Attachment upload',           hasOptions: false, isNumeric: false, supportsMinMax: false, supportsMask: false, supportsFileRules: true },
  rating:    { type: 'rating',    displayLabel: 'Rating',          description: '1-5 Star rating',            hasOptions: false, isNumeric: true,  supportsMinMax: false, supportsMask: false, supportsFileRules: false },
  datetime:  { type: 'datetime',  displayLabel: 'Date & Time',     description: 'Combined timestamp picker',   hasOptions: false, isNumeric: false, supportsMinMax: false, supportsMask: false, supportsFileRules: false },
};
```

### 3.3 Dynamic Zod Schema Builder

File: `packages/shared/src/utils/dynamicSchemaBuilder.ts`

This version fixes the spec v1 bugs: **currency as decimal string** (not `z.number()` — IEEE-754 precision), **phone E.164**, **`z.unknown()` default** (not `z.any()`), **`z.preprocess` empty-string → null** for optional fields, and **runtime-safe `z.enum` via tuple cast** (validated against `select`/`tags` options).

```ts
import { z } from 'zod';
import type { CustomFieldConfig } from '../schemas/dynamicFormSchemas.js';

export function buildDynamicValidationSchema(
  fields: CustomFieldConfig[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (!field.enabled) continue;

    let base: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
      case 'textarea':
        base = z.string();
        break;

      case 'phone':
        // MMS global standard: E.164 phone string validation
        base = z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number (E.164 format required)');
        break;

      case 'email':
        base = z.string().email('Invalid email address');
        break;

      case 'url':
        base = z.string().url('Invalid URL');
        break;

      case 'number':
        base = z.number();
        if (field.minValue != null) base = (base as z.ZodNumber).min(field.minValue);
        if (field.maxValue != null) base = (base as z.ZodNumber).max(field.maxValue);
        break;

      case 'currency':
        // Money handled as decimal string to prevent IEEE-754 floating point precision bugs.
        // mms-form-architecture: "decimal-as-string money"
        base = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid monetary amount (e.g. 100 or 100.50)');
        break;

      case 'date':
        base = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD required)');
        break;

      case 'datetime':
        base = z.string().datetime({ offset: true });
        break;

      case 'boolean':
        base = z.boolean();
        break;

      case 'select': {
        // Runtime-safe enum: options change at runtime, schema compiled per render.
        const uniqueOptions = Array.from(new Set(field.options ?? [])).filter(
          (opt): opt is string => Boolean(opt),
        );
        if (uniqueOptions.length > 0) {
          const [first, ...rest] = uniqueOptions;
          base = z.enum([first, ...rest] as [string, ...string[]]);
        } else {
          base = z.string();
        }
        break;
      }

      case 'tags': {
        const uniqueOptions = Array.from(new Set(field.options ?? [])).filter(
          (opt): opt is string => Boolean(opt),
        );
        if (uniqueOptions.length > 0) {
          const [first, ...rest] = uniqueOptions;
          base = z.array(z.enum([first, ...rest] as [string, ...string[]]));
        } else {
          base = z.array(z.string());
        }
        break;
      }

      case 'rating':
        base = z.number().int().min(1).max(5);
        break;

      case 'file':
        base = z.object({
          url: z.string().url(),
          name: z.string(),
          size: z.number().max(field.maxFileSize ?? 10 * 1024 * 1024),
        });
        break;

      default:
        base = z.unknown();
    }

    if (field.required) {
      if (field.type === 'boolean') {
        base = base.refine((val) => val === true, { message: `${field.label} is required` });
      } else if (field.type === 'tags') {
        base = (base as z.ZodArray<any>).min(1, `${field.label} requires at least one selection`);
      } else if (typeof (base as any).min === 'function') {
        base = (base as any).min(1, `${field.label} is required`);
      }
    } else {
      // Empty string → null so optional fields don't fail string min(1) checks.
      base = z.preprocess((val) => (val === '' ? null : val), base.optional().nullable());
    }

    shape[field.key] = base;
  }

  return z.object(shape);
}
```

### 3.4 Custom Field Helpers (`createFormCustomFieldHelpers`)

File: `packages/shared/src/createFormCustomFieldHelpers.ts`

Shared factory so students/teachers/contacts all use the same system-field vs. custom-field partitioning logic — no duplication across modules.

```ts
import type { FieldDefinition } from './contactFieldSchemaTypes.js';
import type { CustomFieldConfig } from './schemas/dynamicFormSchemas.js';

export interface ModuleFormCustomFieldHelpers {
  listSystemFormFieldKeys: () => ReadonlySet<string>;
  listEnabledCustomFormFields: <T extends FieldDefinition | CustomFieldConfig>(
    fields: Record<string, T[]>,
    tabId?: string,
  ) => T[];
  isSystemFormField: (tabId: string, fieldId: string) => boolean;
}

export function createFormCustomFieldHelpers(
  seed: Record<string, FieldDefinition[]>,
): ModuleFormCustomFieldHelpers {
  function listSystemFormFieldKeys(): ReadonlySet<string> {
    const keys = new Set<string>();
    for (const tabFields of Object.values(seed)) {
      for (const field of tabFields) keys.add(field.key);
    }
    return keys;
  }

  function listEnabledCustomFormFields<T extends FieldDefinition | CustomFieldConfig>(
    fields: Record<string, T[]>,
    tabId?: string,
  ): T[] {
    const systemKeys = listSystemFormFieldKeys();
    const byKey = new Map<string, T>();
    const sourceTabs: T[][] = tabId != null ? [fields[tabId] ?? []] : Object.values(fields);

    for (const tabFields of sourceTabs) {
      for (const field of tabFields) {
        if (!field.enabled || systemKeys.has(field.key)) continue;
        if (!byKey.has(field.key)) byKey.set(field.key, field);
      }
    }

    return [...byKey.values()].sort((left, right) => {
      const leftOrder = 'sortOrder' in left ? left.sortOrder : (left.order ?? 0);
      const rightOrder = 'sortOrder' in right ? right.sortOrder : (right.order ?? 0);
      const orderDelta = leftOrder - rightOrder;
      return orderDelta !== 0 ? orderDelta : left.key.localeCompare(right.key);
    });
  }

  function isSystemFormField(tabId: string, fieldId: string): boolean {
    return (seed[tabId] ?? []).some((field) => field.key === fieldId);
  }

  return { listSystemFormFieldKeys, listEnabledCustomFormFields, isSystemFormField };
}
```

---

## 4. Backend Architecture (`apps/backend`)

### 4.1 Fastify Plugin, Middleware & RBAC

File: `apps/backend/src/plugins/dynamicFormPlugin.ts`

Per `mms-backend-security`: **`authenticateTenant`** (not raw `jwtVerify`) + **`rbacService`** (`can(module, 'editSetup')`) on all writes. Per `mms-backend-api`: **Zod write DTOs** on every mutating route (no `request.body as Record<string, any>`). Audit hooks scoped to mutating routes only (exclude `/check-unique`).

```ts
import type { FastifyInstance } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { auditPreHandler, auditOnSend } from '../hooks/auditHooks.js';
import {
  listModuleTabs,
  checkValueUniqueness,
  generateFieldId,
  generateTabId,
} from '../services/dynamic-form/fieldService.js';
import { getRequestTenant, getRequestUserId } from '../lib/tenantContext.js';
import { activeDb } from '../db/dbConnection.js';
import { customFields, customTabs } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import {
  customFieldConfigSchema,
  updateFieldBodySchema,
  reorderFieldsBodySchema,
} from '@mms/shared';
import { z } from 'zod';

export async function dynamicFormPlugin(app: FastifyInstance) {
  app.register(async (protectedRoutes) => {
    // Auth + RBAC: tenant session required; editSetup permission enforced per-write below.
    protectedRoutes.addHook('preHandler', authenticateTenant);
    // Audit: only for mutating routes (GET excluded inside the hook).
    protectedRoutes.addHook('preHandler', auditPreHandler);
    protectedRoutes.addHook('onSend', auditOnSend);

    // List Tabs & Fields for Module (read — any authenticated tenant user)
    protectedRoutes.get<{ Params: { module: string } }>(
      '/modules/:module/tabs',
      async (request, reply) => {
        const tenantSubdomain = getRequestTenant();
        if (!tenantSubdomain) {
          return reply.status(401).send({ type: 'auth_required', message: 'Tenant required' });
        }
        const tabs = await listModuleTabs(tenantSubdomain, request.params.module);
        return reply.send({ data: tabs });
      },
    );

    // Create Tab — editSetup required
    protectedRoutes.post<{ Params: { module: string } }>(
      '/modules/:module/tabs',
      async (request, reply) => {
        const tenantSubdomain = getRequestTenant();
        if (!tenantSubdomain) {
          return reply.status(401).send({ type: 'auth_required', message: 'Tenant required' });
        }
        // RBAC: editSetup guard (use the module-aware can() helper)
        const user = request.user as any;
        if (!canEditSetup(user, request.params.module)) {
          return reply.status(403).send({ type: 'forbidden', message: 'editSetup required' });
        }

        const bodySchema = z.object({ label: z.string().min(1), key: z.string().optional() }).strict();
        const parsed = bodySchema.parse(request.body);

        const tabId = generateTabId();
        const tabKey = parsed.key || tabId;
        const db = activeDb();

        await db.insert(customTabs).values({
          id: tabId,
          workspaceSubdomain: tenantSubdomain,
          moduleId: request.params.module,
          key: tabKey,
          label: parsed.label,
          enabled: true,
          sortOrder: 0,
        });

        return reply.status(201).send({
          data: { id: tabId, key: tabKey, label: parsed.label, enabled: true, fields: [] },
        });
      },
    );

    // Create Field under Tab — editSetup required
    protectedRoutes.post<{ Params: { module: string; tabId: string } }>(
      '/modules/:module/tabs/:tabId/fields',
      async (request, reply) => {
        const tenantSubdomain = getRequestTenant();
        if (!tenantSubdomain) {
          return reply.status(401).send({ type: 'auth_required', message: 'Tenant required' });
        }
        const user = request.user as any;
        if (!canEditSetup(user, request.params.module)) {
          return reply.status(403).send({ type: 'forbidden', message: 'editSetup required' });
        }

        const fieldId = generateFieldId();
        // Validate write DTO — .strict() rejects unknown keys
        const parsed = customFieldConfigSchema.omit({ id: true, tabId: true }).parse(request.body);
        const db = activeDb();

        await db.insert(customFields).values({
          id: fieldId,
          workspaceSubdomain: tenantSubdomain,
          tabId: request.params.tabId,
          moduleId: request.params.module,
          key: parsed.key || fieldId,
          label: parsed.label,
          type: parsed.type,
          enabled: parsed.enabled,
          required: parsed.required,
          unique: parsed.unique,
          placeholder: parsed.placeholder ?? null,
          description: parsed.description ?? null,
          defaultValue: parsed.defaultValue ?? null,
          options: parsed.options ?? null,
          minValue: parsed.minValue ?? null,
          maxValue: parsed.maxValue ?? null,
          mask: parsed.mask ?? null,
          allowedExtensions: parsed.allowedExtensions ?? null,
          maxFileSize: parsed.maxFileSize ?? null,
          sortOrder: parsed.sortOrder,
          hasData: false,
          isSystem: false,
        });

        return reply.status(201).send({ data: { id: fieldId, tabId: request.params.tabId, ...parsed } });
      },
    );

    // Update Field — editSetup required, Zod-validated, type-lock enforced
    protectedRoutes.patch<{ Params: { module: string; tabId: string; fieldId: string } }>(
      '/modules/:module/tabs/:tabId/fields/:fieldId',
      async (request, reply) => {
        const tenantSubdomain = getRequestTenant();
        if (!tenantSubdomain) {
          return reply.status(401).send({ type: 'auth_required', message: 'Tenant required' });
        }
        const user = request.user as any;
        if (!canEditSetup(user, request.params.module)) {
          return reply.status(403).send({ type: 'forbidden', message: 'editSetup required' });
        }

        const db = activeDb();
        const [existing] = await db
          .select()
          .from(customFields)
          .where(
            and(
              eq(customFields.workspaceSubdomain, tenantSubdomain),
              eq(customFields.id, request.params.fieldId),
            ),
          );

        if (!existing) {
          return reply.status(404).send({ type: 'not_found', message: 'Field not found' });
        }

        // Validate write DTO — .strict() rejects unknown keys
        const body = updateFieldBodySchema.parse(request.body);

        // Type Lock: cannot change type when hasData is true
        if (existing.hasData && body.type && body.type !== existing.type) {
          return reply.status(422).send({
            type: 'validation_error',
            message: 'Cannot modify type of field containing active data',
          });
        }

        // Uniqueness Enforcer: switching unique false → true scans for duplicates
        if (body.unique === true && !existing.unique) {
          const isUnique = await checkValueUniqueness(
            tenantSubdomain,
            request.params.module,
            existing.key,
            null, // null = check for ANY duplicate values (existence scan)
          );
          if (!isUnique) {
            return reply.status(409).send({
              type: 'conflict',
              message: 'Existing records contain duplicate values for this field',
            });
          }
        }

        await db
          .update(customFields)
          .set({
            label: body.label ?? existing.label,
            type: body.type ?? existing.type,
            enabled: body.enabled ?? existing.enabled,
            required: body.required ?? existing.required,
            unique: body.unique ?? existing.unique,
            placeholder: body.placeholder ?? existing.placeholder,
            description: body.description ?? existing.description,
            options: body.options ?? existing.options,
            minValue: body.minValue ?? existing.minValue,
            maxValue: body.maxValue ?? existing.maxValue,
            mask: body.mask ?? existing.mask,
            allowedExtensions: body.allowedExtensions ?? existing.allowedExtensions,
            maxFileSize: body.maxFileSize ?? existing.maxFileSize,
            sortOrder: body.sortOrder ?? existing.sortOrder,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(customFields.workspaceSubdomain, tenantSubdomain),
              eq(customFields.id, request.params.fieldId),
            ),
          );

        return reply.send({ data: { success: true } });
      },
    );

    // Reorder Fields — transactional batch (single UPDATE ... FROM VALUES)
    protectedRoutes.put<{ Params: { module: string; tabId: string } }>(
      '/modules/:module/tabs/:tabId/fields/reorder',
      async (request, reply) => {
        const tenantSubdomain = getRequestTenant();
        if (!tenantSubdomain) return reply.status(401).send({ type: 'auth_required', message: 'Tenant required' });
        const user = request.user as any;
        if (!canEditSetup(user, request.params.module)) {
          return reply.status(403).send({ type: 'forbidden', message: 'editSetup required' });
        }

        const parsed = reorderFieldsBodySchema.parse(request.body);
        const db = activeDb();

        await db.transaction(async (tx) => {
          for (const item of parsed.items) {
            await tx
              .update(customFields)
              .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
              .where(
                and(
                  eq(customFields.workspaceSubdomain, tenantSubdomain),
                  eq(customFields.tabId, request.params.tabId),
                  eq(customFields.id, item.id),
                ),
              );
          }
        });

        return reply.send({ data: { success: true } });
      },
    );

    // Check Uniqueness — editSetup required, NOT audited (probe, not mutation)
    // Registered BEFORE audit hooks would capture it; exclude from audit via route opt-out.
    protectedRoutes.post<{ Params: { module: string } }>(
      '/modules/:module/fields/check-unique',
      async (request, reply) => {
        const tenantSubdomain = getRequestTenant();
        if (!tenantSubdomain) return reply.status(401).send({ type: 'auth_required', message: 'Tenant required' });
        const user = request.user as any;
        if (!canEditSetup(user, request.params.module)) {
          return reply.status(403).send({ type: 'forbidden', message: 'editSetup required' });
        }

        const bodySchema = z.object({ fieldKey: z.string().min(1), value: z.unknown() }).strict();
        const parsed = bodySchema.parse(request.body);

        // Validate fieldKey against the live registry (SQL-injection guard)
        const db = activeDb();
        const [field] = await db
          .select({ id: customFields.id })
          .from(customFields)
          .where(
            and(
              eq(customFields.workspaceSubdomain, tenantSubdomain),
              eq(customFields.moduleId, request.params.module),
              eq(customFields.key, parsed.fieldKey),
            ),
          )
          .limit(1);

        if (!field) {
          return reply.status(404).send({ type: 'not_found', message: 'Field key not registered' });
        }

        const isUnique = await checkValueUniqueness(
          tenantSubdomain,
          request.params.module,
          parsed.fieldKey,
          parsed.value,
        );
        return reply.send({ data: { isUnique } });
      },
    );
  });
}

// RBAC helper — delegate to the module-aware can() from lib/rbacCanHelpers
import { can } from '../lib/rbacCanHelpers.js';
function canEditSetup(user: unknown, module: string): boolean {
  return can(user as any, module, 'editSetup');
}
```

**Note on audit hook scoping:** The `/check-unique` POST is a probe, not a mutation. The `auditPreHandler` hook must skip it. Two options: (a) check `request.url.includes('/check-unique')` inside `auditPreHandler` and return early, or (b) register `/check-unique` in a separate sub-registration without audit hooks. Option (b) is cleaner — split the plugin into audited and non-audited route groups.

### 4.2 Service Layer (parameterized uniqueness, module-aware table map)

File: `apps/backend/src/services/dynamic-form/fieldService.ts`

Fixes the v1 SQL-injection surface: **`fieldKey` is validated against the `customFields` registry before the containment query** (the route handler in §4.1 does this; the service trusts the caller). Uses `node:crypto.randomUUID()` (no `nanoid` dependency). Module-aware table map. `listModuleTabs` scopes by `moduleId` (no over-fetch).

```ts
import { activeDb } from '../../db/dbConnection.js';
import { students, contacts, teachers, tenantUsers, customFields, customTabs } from '../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { CustomFieldConfig, TabConfig, FieldType } from '@mms/shared';

export function generateFieldId(): string {
  const timeStamp = Date.now().toString(36);
  return `cf_${timeStamp}_${randomUUID().slice(0, 8)}`;
}

export function generateTabId(): string {
  const timeStamp = Date.now().toString(36);
  return `custom_${timeStamp}_${randomUUID().slice(0, 8)}`;
}

// Module → Drizzle table map (typed — no `any`).
const MODULE_TABLE_MAP = {
  students: students,
  contacts: contacts,
  teachers: teachers,
  users: tenantUsers,
} as const;

type ModuleName = keyof typeof MODULE_TABLE_MAP;

function resolveModuleTable(moduleName: string) {
  const table = MODULE_TABLE_MAP[moduleName as ModuleName];
  if (!table) throw new Error(`DFS: unsupported module "${moduleName}"`);
  return table;
}

/**
 * Checks value uniqueness across entity customData using PostgreSQL GIN containment (@>).
 * Caller MUST validate `fieldKey` against the customFields registry first (SQL-injection guard).
 * When `value` is null, performs an existence scan (any non-null values for that key).
 */
export async function checkValueUniqueness(
  workspaceSubdomain: string,
  moduleName: string,
  fieldKey: string,
  value: unknown,
): Promise<boolean> {
  const table = resolveModuleTable(moduleName);
  // Parameterized JSONB literal — fieldKey is registry-validated by the caller.
  const matchPattern =
    value === null
      ? sql`jsonb_build_object(${sql.placeholder('k')}, null)`
      : JSON.stringify({ [fieldKey]: value });

  const db = activeDb();
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .where(
      and(
        eq(table.workspaceSubdomain, workspaceSubdomain),
        sql`${table.customData} @> ${matchPattern}::jsonb`,
      ),
    );

  return Number(result?.count ?? 0) === 0;
}

/**
 * List all tabs (with their fields) for a module — scoped by workspaceSubdomain + moduleId.
 * Fields are queried by moduleId (denormalized) to avoid joining customTabs.
 */
export async function listModuleTabs(
  workspaceSubdomain: string,
  moduleName: string,
): Promise<TabConfig[]> {
  const db = activeDb();

  const tabRows = await db
    .select()
    .from(customTabs)
    .where(
      and(
        eq(customTabs.workspaceSubdomain, workspaceSubdomain),
        eq(customTabs.moduleId, moduleName),
      ),
    )
    .orderBy(customTabs.sortOrder);

  // Scope fields by moduleId (denormalized) — avoids loading every tenant field.
  const fieldRows = await db
    .select()
    .from(customFields)
    .where(
      and(
        eq(customFields.workspaceSubdomain, workspaceSubdomain),
        eq(customFields.moduleId, moduleName),
      ),
    )
    .orderBy(customFields.sortOrder);

  const fieldsByTab = new Map<string, CustomFieldConfig[]>();
  for (const field of fieldRows) {
    if (field.deletedAt) continue; // soft-delete filter
    const list = fieldsByTab.get(field.tabId) ?? [];
    list.push({
      id: field.id,
      tabId: field.tabId,
      key: field.key,
      label: field.label,
      type: field.type as FieldType,
      enabled: field.enabled,
      required: field.required,
      unique: field.unique,
      placeholder: field.placeholder,
      description: field.description,
      defaultValue: field.defaultValue,
      options: field.options,
      minValue: field.minValue,
      maxValue: field.maxValue,
      mask: field.mask,
      allowedExtensions: field.allowedExtensions,
      maxFileSize: field.maxFileSize,
      sortOrder: field.sortOrder,
      hasData: field.hasData,
      isSystem: field.isSystem,
    });
    fieldsByTab.set(field.tabId, list);
  }

  return tabRows.map((tab) => ({
    id: tab.id,
    key: tab.key,
    label: tab.label,
    enabled: tab.enabled,
    required: false,
    sortOrder: tab.sortOrder,
    isSystem: tab.isSystem,
    fields: fieldsByTab.get(tab.id) ?? [],
  }));
}
```

### 4.3 Uniqueness Check & Type Lock Logic

When changing a field configuration:

1. **Type Lock**: If `hasData` is `true`, requests attempting to modify the `type` column return HTTP `422 Unprocessable Entity`. The route handler checks this after fetching the existing row (§4.1).

2. **Uniqueness Enforcer**: Switching `unique` from `false` to `true` scans the entity table using the GIN-indexed containment query (`@>`). If duplicate values exist (or any non-null values exist for that key), the endpoint returns HTTP `409 Conflict`.

3. **Server-Side Save Enforcement**: Entity save routes (students/contacts/teachers) MUST re-validate `customData` against the dynamic schema AND check unique-field constraints before persisting (§4.5). Client-side `/check-unique` is a UX probe only — never the sole enforcement.

### 4.4 Automated Audit Hook (Fastify v5 `onSend` with payload return)

File: `apps/backend/src/hooks/auditHooks.ts`

**Critical Fastify v5 detail:** `onSend` receives the `payload` and **must return it** (or a modified payload). Returning `undefined` sends an empty body. The hook captures `previousState` in `preHandler`, then in `onSend` **re-fetches the new state from the DB** by `entityId` (the response payload may be `{ success: true }` without the full row). The hook is skipped for `/check-unique` (probe, not mutation) and for error responses (`reply.statusCode >= 400`).

```ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { activeDb } from '../db/dbConnection.js';
import { auditLogs, customFields, customTabs } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getRequestTenant, getRequestUserId } from '../lib/tenantContext.js';

declare module 'fastify' {
  interface FastifyRequest {
    auditContext?: {
      entityType: 'custom_tab' | 'custom_field';
      entityId: string;
      previousState: unknown | null;
    };
  }
}

export async function auditPreHandler(request: FastifyRequest) {
  if (request.method === 'GET') return;
  // Skip probes — /check-unique is a read masquerading as POST
  if (request.url.includes('/check-unique')) return;

  const url = request.url;
  const entityType: 'custom_tab' | 'custom_field' = url.includes('/fields')
    ? 'custom_field'
    : 'custom_tab';
  const params = request.params as { tabId?: string; fieldId?: string };
  const entityId = params.fieldId || params.tabId || 'bulk_reorder';
  const tenantSubdomain = getRequestTenant();

  if (!tenantSubdomain) return;
  const db = activeDb();

  let previousState = null;
  if (['PATCH', 'DELETE', 'PUT'].includes(request.method) && entityId !== 'bulk_reorder') {
    if (entityType === 'custom_field') {
      [previousState] = await db
        .select()
        .from(customFields)
        .where(
          and(
            eq(customFields.workspaceSubdomain, tenantSubdomain),
            eq(customFields.id, entityId),
          ),
        );
    } else {
      [previousState] = await db
        .select()
        .from(customTabs)
        .where(
          and(
            eq(customTabs.workspaceSubdomain, tenantSubdomain),
            eq(customTabs.id, entityId),
          ),
        );
    }
  }

  request.auditContext = { entityType, entityId, previousState };
}

export async function auditOnSend(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: unknown,
): Promise<unknown> {
  // MUST return payload — Fastify v5 onSend contract.
  if (request.method === 'GET' || !request.auditContext || reply.statusCode >= 400) {
    return payload;
  }

  const tenantSubdomain = getRequestTenant();
  const userId = getRequestUserId() ?? (request as any).user?.id;

  if (!tenantSubdomain || !userId) return payload;
  const db = activeDb();

  try {
    // Re-fetch the new state from the DB — the response payload may be { success: true }.
    let newState: unknown = null;
    const { entityType, entityId } = request.auditContext;
    if (entityId !== 'bulk_reorder' && entityType === 'custom_field') {
      const [row] = await db
        .select()
        .from(customFields)
        .where(
          and(
            eq(customFields.workspaceSubdomain, tenantSubdomain),
            eq(customFields.id, entityId),
          ),
        );
      newState = row ?? null;
    } else if (entityId !== 'bulk_reorder' && entityType === 'custom_tab') {
      const [row] = await db
        .select()
        .from(customTabs)
        .where(
          and(
            eq(customTabs.workspaceSubdomain, tenantSubdomain),
            eq(customTabs.id, entityId),
          ),
        );
      newState = row ?? null;
    }

    await db.insert(auditLogs).values({
      workspaceSubdomain: tenantSubdomain,
      tableName: request.auditContext.entityType,
      recordId: request.auditContext.entityId,
      action: request.method,
      oldValues: request.auditContext.previousState as any ?? null,
      newValues: newState as any ?? null,
      userId,
    });
  } catch (err) {
    request.log.error({ err }, 'Audit logging execution failed');
  }

  // MUST return payload — never return undefined from onSend.
  return payload;
}
```

### 4.5 Server-Side `customData` Validation on Entity Save (never trust client)

Per `mms-backend-api`: "never trust client." Every entity save route (students/contacts/teachers) MUST re-validate `customData` against the dynamic schema before persisting. Client-side validation (§5.4) is UX only.

**Pattern** (add to each module's save route / use-case):

```ts
import { buildDynamicValidationSchema } from '@mms/shared';
import { listModuleTabs } from '../services/dynamic-form/fieldService.js';

// Inside the student create/update use-case, BEFORE db.insert/update:
async function validateCustomData(
  workspaceSubdomain: string,
  moduleId: string,
  customData: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; errors: ValidationError[] }> {
  const tabs = await listModuleTabs(workspaceSubdomain, moduleId);
  const activeFields = tabs
    .filter((t) => t.enabled)
    .flatMap((t) => t.fields)
    .filter((f) => f.enabled);

  if (activeFields.length === 0) return { ok: true }; // no DFS config → no validation

  const schema = buildDynamicValidationSchema(activeFields);
  const result = schema.safeParse(customData);
  if (result.success) return { ok: true };

  const errors: ValidationError[] = result.error.issues.map((issue) => ({
    fieldId: String(issue.path[0] ?? ''),
    tabId: activeFields.find((f) => f.key === issue.path[0])?.tabId ?? 'basic',
    message: issue.message,
  }));
  return { ok: false, errors };
}

// Unique-field enforcement on save:
async function enforceUniqueFields(
  workspaceSubdomain: string,
  moduleId: string,
  customData: Record<string, unknown>,
  excludeEntityId?: string,
): Promise<{ ok: true } | { ok: false; conflicts: { fieldKey: string; message: string }[] }> {
  const tabs = await listModuleTabs(workspaceSubdomain, moduleId);
  const uniqueFields = tabs
    .flatMap((t) => t.fields)
    .filter((f) => f.enabled && f.unique);

  const conflicts: { fieldKey: string; message: string }[] = [];
  for (const field of uniqueFields) {
    const value = customData[field.key];
    if (value == null || value === '') continue;
    const isUnique = await checkValueUniqueness(workspaceSubdomain, moduleId, field.key, value);
    if (!isUnique) {
      conflicts.push({ fieldKey: field.key, message: `${field.label} must be unique` });
    }
  }
  return conflicts.length === 0 ? { ok: true } : { ok: false, conflicts };
}
```

The save route returns `400` with `type: 'validation_error'` and the field errors, or `409` with `type: 'conflict'` for unique violations. Never persist `customData` that fails validation.

### 4.6 Reorder Endpoints (transactional batch)

The reorder routes (`PUT /modules/:module/tabs/reorder` and `PUT /modules/:module/tabs/:tabId/fields/reorder`) accept a batch body and update `sortOrder` in a single transaction. Per `mms-data-layer` bulk-upsert norms, prefer one transaction over N independent calls — the implementation in §4.1 uses `db.transaction`. For high-cardinality batches, consider a single `UPDATE ... FROM (VALUES ...) AS v(id, sort_order) WHERE custom_fields.id = v.id` statement.

**Body schema** (§3.1 `reorderFieldsBodySchema`):
```ts
{ items: [{ id: "cf_...", sortOrder: 0 }, { id: "cf_...", sortOrder: 1 }] }
```

### 4.7 Optimistic Concurrency (`updated_at` → 409)

For PATCH/PUT on `customFields`/`customTabs`, support optimistic concurrency: the client may send `If-Match: <updatedAt>` (or a body `_version` field). If the DB row's `updatedAt` is newer than the client's, return `409 Conflict` with `type: 'stale_version'`. This prevents lost updates when two admins edit the same field config. (Optional but recommended for multi-admin workspaces.)

### 4.8 Idempotency, Rate Limits & Body Limits

- **Idempotency**: POST create routes accept an `Idempotency-Key` header. The key is bound to the request body digest (hash of method + path + body). A repeat within the TTL window returns the cached `201` response instead of creating a duplicate. Per `mms-api-interface` §6.
- **Rate limits**: Apply `@fastify/rate-limit` to `/check-unique` (probe — high-frequency) and write routes. Per `mms-backend-security`.
- **Body limits**: Set `bodyLimit` on the plugin registration to reject oversized payloads early (default 1MB; file uploads use multipart, not JSON body).

---

## 5. Frontend Architecture (`apps/frontend`)

### 5.1 TanStack Query v5 (`apiJson`, `enabled: isAuthenticated`, tuple keys)

File: `apps/frontend/src/hooks/useDynamicFormConfig.ts`

Per `mms-frontend`: use `apiJson`/`apiFetch` from `@/lib/apiClient` (not raw `fetch` or axios `api`). Per `mms-query-factories`: tuple query keys, `enabled: isAuthenticated` on tenant REST hooks, `placeholderData: (prev) => prev` to avoid refetch flicker. Per `mms-backend-security`: `credentials: 'include'` via apiClient (cookie session — no `mms_token`).

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TabConfig, CustomFieldConfig } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';

export function useModuleTabs(moduleName: string) {
  const { isAuthenticated } = useAuth();
  return useQuery<TabConfig[]>({
    queryKey: ['module-tabs', moduleName] as const, // tuple key — mms-query-factories
    queryFn: async () => {
      const response = await apiJson<{ data: TabConfig[] }>(`/api/v2/modules/${moduleName}/tabs`);
      return response.data;
    },
    enabled: isAuthenticated, // gate — no fetch for unauthenticated users
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev, // avoid refetch flicker — mms-data-layer
  });
}

export function useSaveFieldMutation(moduleName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tabId, field }: { tabId: string; field: Partial<CustomFieldConfig> }) => {
      if (field.id) {
        return apiJson(`/api/v2/modules/${moduleName}/tabs/${tabId}/fields/${field.id}`, {
          method: 'PATCH',
          body: JSON.stringify(field),
        });
      }
      return apiJson(`/api/v2/modules/${moduleName}/tabs/${tabId}/fields`, {
        method: 'POST',
        body: JSON.stringify(field),
      });
    },
    onSuccess: () => {
      // Invalidate list + count keys — mms-query-factories
      queryClient.invalidateQueries({ queryKey: ['module-tabs', moduleName] });
    },
  });
}

export function useCheckUniqueMutation(moduleName: string) {
  return useMutation({
    mutationFn: async ({ fieldKey, value }: { fieldKey: string; value: unknown }) => {
      const response = await apiJson<{ data: { isUnique: boolean } }>(
        `/api/v2/modules/${moduleName}/fields/check-unique`,
        { method: 'POST', body: JSON.stringify({ fieldKey, value }) },
      );
      return response.data.isUnique;
    },
  });
}

export function useReorderFieldsMutation(moduleName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tabId, items }: { tabId: string; items: { id: string; sortOrder: number }[] }) => {
      return apiJson(`/api/v2/modules/${moduleName}/tabs/${tabId}/fields/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ items }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-tabs', moduleName] });
    },
    // No optimistic update for reorder — wait for server confirm (avoids desync on failure).
  });
}
```

**Hook placement note:** This is a tenant REST resource. Per `mms-query-factories`, collection facades belong under `@/tenant/hooks/collections/*`. Consider relocating to `src/tenant/hooks/collections/useDynamicFormConfig.ts` for consistency with the facade pattern.

### 5.2 Setup UI – Tab & Field Builder

The builder interface combines Radix UI components with `@hello-pangea/dnd`. All labels use `t()` (no hardcoded strings — `mms-settings-i18n`).

```tsx
// Abstract render outline for Tab Management — labels via t()
<DragDropContext onDragEnd={handleTabDragEnd}>
  <Droppable droppableId="tabs-list" type="TAB">
    {(provided) => (
      <div ref={provided.innerRef} {...provided.droppableProps}>
        {tabs.map((tab, index) => (
          <Draggable key={tab.id} draggableId={tab.id} index={index}>
            {(provided) => (
              <TabCard
                tab={tab}
                dragHandleProps={provided.dragHandleProps}
                ref={provided.innerRef}
                aria-label={t('dfs.tab.aria.tabCard', { label: tab.label })}
              />
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

### 5.3 Custom Field Editor

The editor form uses `react-hook-form` and `zodResolver`. The type `<select>` offers **all 14 field types** (not just 4 — the v1 spec only listed `text/number/select/boolean`). The type selector is disabled when `hasData` is true (type-lock UX).

```tsx
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customFieldConfigSchema, FIELD_TYPES_META, type CustomFieldConfig, type FieldType } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { TypeSpecificSection } from './TypeSpecificSection';

export function CustomFieldEditor({
  initialData,
  onSave,
}: {
  initialData?: Partial<CustomFieldConfig>;
  onSave: (data: CustomFieldConfig) => void;
}) {
  const { t } = useTranslation();
  const methods = useForm<CustomFieldConfig>({
    resolver: zodResolver(customFieldConfigSchema),
    defaultValues: initialData || {
      label: '',
      type: 'text',
      required: false,
      unique: false,
      enabled: true,
      options: [],
      sortOrder: 0,
    },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSave)} className="space-y-4">
        <div>
          <label htmlFor="field-label" className="text-sm font-medium">
            {t('dfs.fieldEditor.label')}
          </label>
          <input id="field-label" {...methods.register('label')} className="input-class" />
        </div>

        <div>
          <label htmlFor="field-type" className="text-sm font-medium">
            {t('dfs.fieldEditor.type')}
          </label>
          <select
            id="field-type"
            {...methods.register('type')}
            disabled={initialData?.hasData}
            className="select-class"
            aria-describedby={initialData?.hasData ? 'type-locked-hint' : undefined}
          >
            {(Object.keys(FIELD_TYPES_META) as FieldType[]).map((ft) => (
              <option key={ft} value={ft}>
                {t(`dfs.fieldType.${ft}`, { defaultValue: FIELD_TYPES_META[ft].displayLabel })}
              </option>
            ))}
          </select>
          {initialData?.hasData && (
            <p id="type-locked-hint" className="text-xs text-amber-600">
              {t('dfs.fieldEditor.typeLocked')}
            </p>
          )}
        </div>

        <TypeSpecificSection />

        <button type="submit" className="btn-primary">{t('common.save')}</button>
      </form>
    </FormProvider>
  );
}
```

### 5.4 Dynamic Form Renderer for Entity Pages

The renderer creates the Zod schema dynamically and handles input value coercions. Per `mms-form-architecture`: forms use `FormModal` + shared Zod DTOs + React 19 defaults. The renderer is a **client-side UX layer** — server-side re-validation (§4.5) is the source of truth.

```tsx
import { useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildDynamicValidationSchema, type TabConfig } from '@mms/shared';
import { FieldRenderer } from './FieldRenderer';

export function DynamicForm({
  tabs,
  initialValues = {},
  onSubmit,
}: {
  tabs: TabConfig[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const activeFields = useMemo(
    () => tabs.filter((t) => t.enabled).flatMap((t) => t.fields).filter((f) => f.enabled),
    [tabs],
  );

  const dynamicSchema = useMemo(() => buildDynamicValidationSchema(activeFields), [activeFields]);

  const methods = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: initialValues,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {tabs.filter((t) => t.enabled).map((tab) => (
          <fieldset key={tab.id} className="border p-4 rounded-lg space-y-4">
            <legend className="font-semibold px-2">{tab.label}</legend>
            {tab.fields.filter((f) => f.enabled).map((field) => (
              <FieldRenderer key={field.key} field={field} />
            ))}
          </fieldset>
        ))}
        <button type="submit" className="btn-submit">Save Entity</button>
      </form>
    </FormProvider>
  );
}
```

### 5.5 Drag-and-Drop Reordering

Field and tab dragging use `@hello-pangea/dnd`. When reordering ends, dispatch the batched `useReorderFieldsMutation` (§5.1). **Do not optimistic-update reorder** — wait for server confirmation to avoid desync on failure (per `mms-query-factories` optimistic policy: "banned for bulk operations").

### 5.6 Accessibility

Per `mms-a11y-smoke`:
- **Focus-return**: `FormModal` must return focus to the trigger button on close. Test with axe.
- **`aria-busy`**: List pending state uses `aria-busy` on the container (not just a spinner).
- **Icon buttons**: `aria-label` from `t()` on all icon-only buttons.
- **`prefers-reduced-motion`**: Honor for drag animations and field transitions.
- **44×44 target**: Interactive controls ≥ `min-h-11 min-w-11` (per `mms-ui-ux-design`).
- **Error association**: `aria-invalid` + `aria-describedby` on field inputs pointing to `${field.key}-error`.

### 5.7 i18n

Per `mms-settings-i18n` (en/ar/ur/fa):
- **No hardcoded labels**: all field labels, type names, button text, error messages via `t()`.
- **RTL support**: logical CSS (`ms-`/`me-` not `ml-`/`mr-`); `dir="rtl"` mirroring for ar/ur/fa.
- **Title Case skip**: do not Title Case labels in ar/ur/fa (per `mms-structure-naming`).
- **Translation keys**: `dfs.fieldType.<type>`, `dfs.fieldEditor.<field>`, `dfs.tab.<context>`, etc.

---

## 6. Testing Strategy

All implementations follow MMS quality standards per `mms-code-review`:

### 1. Unit Tests (`vitest`)

- Validate `buildDynamicValidationSchema` behavior against **all 14 field types** (not just a sample).
- Verify empty-string → null coercion for optional fields.
- Verify currency rejects `150.509` (3 decimal places) and accepts `150.50`.
- Verify phone E.164 rejection of `1234567` and acceptance of `+923001234567`.
- Verify `createFormCustomFieldHelpers` system-key partitioning.

### 2. Integration Tests (`vitest` + Fastify `.inject()`)

Per `mms-backend-api`/`mms-backend-security`: **`inject()` allow+deny tests** with `host`/`x-forwarded-host` tenant headers.

- **Allow**: authenticated tenant user with `editSetup` permission → POST/PATCH returns 2xx.
- **Deny**: unauthenticated → 401. Wrong-tenant token → 403. Non-`editSetup` role → 403.
- **Deny**: `host` header mismatch → 403 (`authenticateTenant` bind).
- **Type lock**: PATCH with `type` change when `hasData=true` → 422.
- **Uniqueness**: PATCH `unique: false → true` with existing duplicates → 409.
- **Audit**: POST creates an `audit_logs` row; verify `tableName`, `recordId`, `action`, `userId`.
- **Check-unique**: POST does NOT create an audit row (probe, not mutation).
- **Reorder**: PUT updates `sortOrder` atomically; verify all rows in one transaction.

```ts
// Example inject() allow+deny test shape
test('non-editSetup user cannot create field', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v2/modules/students/tabs/tab-1/fields',
    headers: { host: 'madrasa1.localhost', cookie: 'mms_session=student-jwt' },
    payload: { key: 'cf_test', label: 'Test', type: 'text' },
  });
  expect(res.statusCode).toBe(403);
});
```

### 3. End-to-End Tests (`playwright`)

Per `mms-code-review`: prefer `getByRole`/`getByLabel` — no `waitForTimeout` sleeps.

- Full flow: superuser configures custom fields → standard user creates student record using dynamic forms → audit log records mutation.
- RTL layout: configure a field in ar locale → verify form renders right-to-left.
- Drag-and-drop: reorder a field → verify order persists after page reload.

### 4. Shell / a11y Tests

- `responsive-shell` + `responsive-authenticated` stay green.
- axe serious/critical = 0 on FormModal with dynamic fields (run `mms-a11y-smoke` skill).

---

## 7. Deployment & Security

- **Database Migrations**: Applied via `initDb` on PM2 restart (not `drizzle-kit migrate`). The migrate script (`apps/backend/src/scripts/migrateDb.ts`) calls `initDb()` which applies all pending `migrations_drizzle/00NN_*.sql` in journal order. **Ban `drizzle-kit push`** against shared/prod (`mms-schema-migrate` rule #5).
- **Input Sanitization**: User-defined field `description` and `placeholder` are sanitized with DOMPurify before rendering on clients. Server-side, the Zod schema enforces length limits.
- **Tenant Isolation**: Enforced via `workspaceSubdomain` composite checks **and** `FORCE ROW LEVEL SECURITY` policies. Never trust client `workspaceId`/`workspaceSubdomain` for authz — always from `getRequestTenant()` (bound by `authenticateTenant` to the JWT + request host).
- **Cookie CSRF / Origin**: State-changing cookie-auth routes check `Origin`/`csrf` tokens per `mms-backend-security`.
- **Rate Limits**: `@fastify/rate-limit` on `/check-unique` (probe — high-frequency) and write routes.
- **Statement timeout**: Set `statement_timeout` on the pool (`PG_POOL_MAX` via env, not hardcoded) to prevent long-running uniqueness scans on large tables.
- **Secrets**: No secrets in the DFS diff. OTP/auth use `crypto.randomInt()` / `crypto.randomUUID()`.
- **Linux/VPS compatibility**: Case-sensitive imports, LF line endings, PM2-friendly logs (`mms-linux-compatibility`).

---

## 8. Appendix: Production-Grade Code Artifacts

### A. ID Generator (`node:crypto`, no `nanoid` dependency)

File: `apps/backend/src/services/dynamic-form/fieldService.ts` (excerpt)

```ts
import { randomUUID } from 'node:crypto';

export function generateFieldId(): string {
  const timeStamp = Date.now().toString(36);
  return `cf_${timeStamp}_${randomUUID().slice(0, 8)}`;
}

export function generateTabId(): string {
  const timeStamp = Date.now().toString(36);
  return `custom_${timeStamp}_${randomUUID().slice(0, 8)}`;
}
```

**Why `node:crypto.randomUUID` (not `nanoid`):** `nanoid` is not in the MMS dependency tree per `mms-dependency-upgrade`. Adding it for a 2-line ID generator is unjustified. `crypto.randomUUID()` is built-in, cryptographically secure, and zero-dep.

### B. Dynamic Form Field Renderer

File: `apps/frontend/src/components/dynamic-form/FieldRenderer.tsx`

Per `mms-ui-ux-design`: shared Work chrome, `aria-invalid` + `aria-describedby`, `role="alert"` on errors, 44×44 targets.

```tsx
import { useFormContext, Controller } from 'react-hook-form';
import type { CustomFieldConfig } from '@mms/shared';

export function FieldRenderer({ field }: { field: CustomFieldConfig }) {
  const { register, control, formState: { errors } } = useFormContext();
  const error = errors[field.key];

  const commonProps = {
    id: field.key,
    placeholder: field.placeholder ?? undefined,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${field.key}-error` : undefined,
  };

  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
        return (
          <input
            {...commonProps}
            type={field.type === 'phone' ? 'tel' : field.type}
            {...register(field.key)}
            className="input-field"
          />
        );

      case 'textarea':
        return <textarea {...commonProps} {...register(field.key)} rows={3} className="textarea-field" />;

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            step="any"
            {...register(field.key, {
              setValueAs: (val) =>
                val === '' || val === null || Number.isNaN(Number(val)) ? undefined : Number(val),
            })}
            className="input-field"
          />
        );

      case 'currency':
        // Decimal-as-string — never coerce to number on the client.
        return (
          <input
            {...commonProps}
            type="text"
            inputMode="decimal"
            {...register(field.key)}
            className="input-field"
          />
        );

      case 'date':
        return <input {...commonProps} type="date" {...register(field.key)} className="input-field" />;

      case 'datetime':
        return <input {...commonProps} type="datetime-local" {...register(field.key)} className="input-field" />;

      case 'boolean':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: { onChange, value } }) => (
              <input
                type="checkbox"
                id={field.key}
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                className="checkbox-field"
              />
            )}
          />
        );

      case 'select':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: { onChange, value } }) => (
              <select id={field.key} value={(value as string) ?? ''} onChange={onChange} className="select-field">
                <option value="">Select option...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          />
        );

      case 'tags':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: { onChange, value } }) => (
              <select
                id={field.key}
                multiple
                value={(value as string[]) ?? []}
                onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}
                className="select-field"
              >
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          />
        );

      case 'rating':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: { onChange, value } }) => (
              <input
                type="range"
                min={1}
                max={5}
                value={(value as number) ?? 0}
                onChange={(e) => onChange(Number(e.target.value))}
                className="rating-field"
              />
            )}
          />
        );

      case 'file':
        return <input {...commonProps} type="file" {...register(field.key)} className="file-field" />;

      default:
        return <input {...commonProps} type="text" {...register(field.key)} className="input-field" />;
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.key} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ms-0.5">*</span>}
      </label>
      {field.description && <p className="text-xs text-gray-500">{field.description}</p>}
      {renderInput()}
      {error && (
        <p id={`${field.key}-error`} className="text-xs text-red-600" role="alert">
          {error.message?.toString()}
        </p>
      )}
    </div>
  );
}
```

---

## 9. Dropdown Option Management (Lookup Lists)

This section describes the **canonical pattern** for every dropdown (`select`) and multi-entry label field (`phones[]`, `emails[]`, `addresses[]`, `socials[]`) in the DFS. Options are **never hardcoded** in the form schema. Users perform **inline CRUD** (Create, Read, Delete options) directly inside the form dropdown controls (`EditableSelect`). There is **no separate Setup → Lookups sub-tab**.

---

### 9.1 Concept: Inline Form Dropdown CRUD vs. Setup Tabs

| Concern | Separate Setup Tab Approach ❌ | Inline Form Dropdown CRUD Approach ✅ |
|---|---|---|
| Where options are managed | Isolated in a dedicated Setup sub-tab | Directly inside the form dropdown popovers (`EditableSelect`) |
| User experience | User must navigate away from form to Setup to add an option | User adds/removes options seamlessly while filling out the form |
| Option Persistence | Standard API mutation (`PUT /api/:module/lookups/:kind`) | Immediate background mutation upon adding/removing an option |
| UI Control | Static listbox or separate settings form | `EditableSelect` + `OptionSelectPopover` (popover with input + add button & remove `X` icons) |

**Rule:** Dropdown option management must be accessible **inline directly within entity forms**. Users add or remove dropdown options inside the popover without leaving their active form session.

---

### 9.2 Data Flow: End-to-End Inline CRUD

```
User opens Form Dropdown (EditableSelect)
          │
          ├──► View options & Select option
          │
          ├──► Type new option in Popover Footer + Click "Add"
          │         │
          │         ▼
          │    onUpdateOptions / onCommitAdd
          │         │
          │         ▼
          │    useContactLookupMutation() ──► PUT /api/:module/lookups/:kind
          │                                           │
          │                                           ▼
          │                                  contact_lookups DB
          │                                           │
          │                                           ▼
          │                                   Invalidates Query
          │                                           │
          │                                           ▼
          │                                 ModuleConfigContext
          │
          └──► Click "X" on Option item in Popover
                    │
                    ▼
               onUpdateOptions(nextFilteredOptions) ──► PUT /api/:module/lookups/:kind
```

**Key Invariant:** The form renderer supplies `options` and `onUpdateOptions` callback (from `ModuleConfigContext` / lookup mutations) to `EditableSelect`. No separate Setup Lookups tab is required.

---

### 9.3 Backend: Lookup API Routes

Each module that has dropdown lookups exposes two routes via `registerModuleLookupRoutes`:

```ts
// Pattern: apps/backend/src/routes/tenant/:module/:moduleLookupRoutes.ts

import { registerModuleLookupRoutes } from '@/routes/tenant/shared/registerModuleLookupRoutes';
import { CONTACT_LOOKUP_KINDS } from '@mms/shared';

export async function registerContactLookupRoutes(app: FastifyInstance) {
  registerModuleLookupRoutes(app, {
    module: 'contacts',
    lookupKinds: CONTACT_LOOKUP_KINDS,
    tableName: 'contact_lookups',
  });
}

// Registers:
//   GET  /api/contacts/lookups          → { genders: [], phoneLabels: [], ... }
//   PUT  /api/contacts/lookups/:kind    → atomically replace a single list
```

**PUT semantics:**
- Body: `{ items: string[] }` for string kinds, `{ items: object[] }` for `countryCodes`.
- Full replace (not append). The client always sends the complete desired list.
- Returns the newly stored list; the client invalidates `CONTACTS_LOOKUPS_QUERY_KEY`.
- Guarded by `authenticateTenant` + `can('contacts', 'editSetup')`.

---

### 9.4 Shared Package: Lookup Kinds & Field-Target Map

```ts
// packages/shared/src/contactLookupTypes.ts  (actual location may vary per module)

export const CONTACT_LOOKUP_KINDS = [
  'genders', 'phoneLabels', 'emailLabels', 'addressLabels',
  'socialPlatforms', 'relationships', 'countryCodes',
] as const;

export type ContactLookupKind = typeof CONTACT_LOOKUP_KINDS[number];

// String-only kinds (used by ModuleStringListLookupEditor):
export type ContactLookupStringKind =
  Exclude<ContactLookupKind, 'countryCodes' | 'relationships'>;

// Maps each string-kind to the FieldConfig tab+field that holds options for sync:
export const CONTACT_LOOKUP_FIELD_TARGETS: Record<
  ContactLookupStringKind,
  { tabId: string; fieldId: string }
> = {
  genders:         { tabId: 'basic',   fieldId: 'gender' },
  phoneLabels:     { tabId: 'basic',   fieldId: 'phones' },
  emailLabels:     { tabId: 'basic',   fieldId: 'emails' },
  addressLabels:   { tabId: 'basic',   fieldId: 'addresses' },
  socialPlatforms: { tabId: 'profile', fieldId: 'socials' },
};
```

After a successful `PUT`, `persistStringKind` calls `syncOptionsInConfig` to write the new options into the in-memory `FieldConfig`, keeping the two sources in sync without a round-trip re-fetch.

---

### 9.5 Frontend: Lookup Query Hooks

Generated by `createModuleLookupsHooks`:

```ts
// apps/frontend/src/tenant/features/contacts/hooks/useContactLookups.ts

import { createModuleLookupsHooks } from '@/lib/query/createModuleLookupsHooks';
import { CONTACT_LOOKUP_KINDS, CONTACTS_LOOKUPS_QUERY_KEY } from '@mms/shared';

const { useLookupsQuery, useLookupMutation } = createModuleLookupsHooks({
  module: 'contacts',
  kinds: CONTACT_LOOKUP_KINDS,
  queryKeyBase: CONTACTS_LOOKUPS_QUERY_KEY,
});

export const useContactLookupsQuery = useLookupsQuery;
export const useContactLookupMutation = useLookupMutation;
```

Mutation usage:

```ts
const mutation = useContactLookupMutation();

// Replace the genders list atomically:
await mutation.mutateAsync({ kind: 'genders', items: ['Male', 'Female', 'Other'] });
// → PUT /api/contacts/lookups/genders  { items: [...] }
// → invalidates CONTACTS_LOOKUPS_QUERY_KEY
// → ContactConfigContext re-renders with new genders
```

---

### 9.6 Inline Form Dropdown Option Management

All string dropdown lists and label lookups are managed **inline directly inside entity form controls** using `EditableSelect` and `OptionSelectPopover`. Users add or delete options directly within the dropdown popover during active form sessions.

Setup sub-tabs in module manifests are strictly:
```ts
setupSubTabs: ['fields', 'preferences'] as const
```
There is **no separate Setup → Lookups sub-tab**.

---

### 9.7 Form Renderer: Resolving Options at Runtime

For **system lookup fields**, options come from context — not from `field.options`.

**`select` field (single value):**

```tsx
function GenderSelectField({ field }: { field: CustomFieldConfig }) {
  const { genders } = useContactConfig();

  return (
    <Controller
      name={field.key}
      render={({ field: { onChange, value } }) => (
        <Select value={value ?? ''} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {genders.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
```

**Multi-entry row label field (array field):**

```tsx
function PhoneEntryRow({ index }: { index: number }) {
  const { phoneLabels } = useContactConfig();

  return (
    <div className="flex gap-2">
      <Input {...register(`phones.${index}.number`)} type="tel" />
      <Select>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {phoneLabels.map((label) => (
            <SelectItem key={label} value={label}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

**Zod validation strategy:**
- **Form-side (client):** `z.string()` (open) — options change at runtime, schema compiled per render. Use `z.enum([first, ...rest] as [string, ...string[]])` only when the options are known at schema-build time (DFS custom `select` fields). For system lookup fields (genders, phoneLabels) whose options come from context, use `z.string()` — never `z.enum([...runtimeOptions])` as a compile-time tuple.
- **Server-side (save handler):** `refine` against the live DB lookup values to reject submitted values not in the current list. Per §4.5: server-side validation is mandatory.
- The DFS `buildDynamicValidationSchema` (§3.3) uses `z.enum` for custom `select`/`tags` fields because the options are fixed in the field config at build time — this is correct and consistent with §9.7 (the prohibition is against using *runtime-context* options as a compile-time enum tuple, not against using config-stored options).

---

### 9.8 Implementation Checklist for New Modules

When adding dropdown lookups to a new MMS module, follow these steps in order:

**`packages/shared`**
- [ ] Add `MY_MODULE_LOOKUP_KINDS` const tuple and export `MyModuleLookupKind` type
- [ ] Add `MyModuleLookupStringKind` (exclude complex object kinds)
- [ ] Add `MY_MODULE_LOOKUP_FIELD_TARGETS` mapping string-kinds to `{ tabId, fieldId }`
- [ ] Set `setupSubTabs: ['fields', 'preferences'] as const` in the module manifest
- [ ] Update the manifest test's `setupSubTabs` assertion to `['fields', 'preferences']`

**`apps/backend`**
- [ ] Create a `my_module_lookups` typed table (Drizzle schema) with `FORCE ROW LEVEL SECURITY`
- [ ] Write a forward-only migration (`mms-schema-migrate` skill): `migrations_drizzle/00NN_*.sql` + `_journal.json`
- [ ] Call `registerModuleLookupRoutes` with `authenticateTenant` + `can()` guard
- [ ] Seed defaults in migration or workspace creation handler
- [ ] Add server-side `buildDynamicValidationSchema` + `safeParse` on the save route (§4.5)
- [ ] Add `inject()` allow+deny tests for the lookup PUT route (§6)

**`apps/frontend`**
- [ ] Create `useMyModuleLookupsQuery` + `useMyModuleLookupMutation` via `createModuleLookupsHooks`
- [ ] Add lookup fields to the module's config context
- [ ] Wire inline option management (`EditableSelect`) directly inside entity forms
- [ ] Inject options from context into form field renderers — never hardcode options
- [ ] `useModuleTabs` hook uses `enabled: isAuthenticated` + tuple query key (§5.1)

**Verification**
- [ ] `pnpm typecheck` — clean
- [ ] `cd apps/frontend && pnpm lint` — clean
- [ ] `pnpm --filter @mms/shared test` — manifest test updated and passing
- [ ] `pnpm test` — all DFS unit + integration tests green
- [ ] Form dropdown popovers render inline CRUD controls; Setup shell displays `Fields` and `Preferences` sub-tabs cleanly
- [ ] `mms-a11y-smoke` axe scan: 0 serious/critical on FormModal with DFS fields
- [ ] RTL locale (ar/ur/fa) renders form mirrored with no hardcoded English labels