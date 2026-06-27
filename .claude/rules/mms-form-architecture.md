---
description: Definitive master specification for MMS Dynamic Form Architecture (v11.0 Production Final) - ESM boundaries, branded IDs, Zod validation, IEEE 754 bypass, transaction-scoped RLS, JSONB concats, React 19 state init, S3 uploads.
paths:
  - "packages/shared/src/**/*.ts"
  - "apps/frontend/src/components/ui/FormPrimitives.tsx"
  - "apps/backend/src/db/schema.ts"
  - "apps/backend/src/routes/api/db/**/*.ts"
  - "apps/backend/src/routes/api/contacts/**/*.ts"
  - "apps/backend/src/routes/**/*.ts"
---

This is the **Definitive Master Specification (v11.0 Production Final)** for the MMS Dynamic Form Architecture.

It synthesizes every architectural mandate, security protocol, UX/UI standard, and performance safeguard into a single, executable contract. All previously identified edge cases (React division-by-zero, hot-swap memory loss, indexing anti-patterns, Fastify payload starvation, version race conditions, and RTL navigation) have been rigorously patched alongside your precise UI/UX layout rules.

---

# 🏛️ MMS Form Architecture: Master Blueprint Specification (v11.0 Final)

This specification governs all code, infrastructure, database schemas, UX/UI procedures, and operational protocols across the Madrasa Management System (MMS) `pnpm` monorepo. It is the single source of truth for engineering, security, and DevOps teams.

---

## PILLAR I: Monorepo Foundation & Domain Modeling

### Rule 1: Strict ESM Boundaries & Package Isolation

**1.1** All blueprint definitions, schemas, validators, types, and utilities reside exclusively in `packages/shared`, exported as `@mms/shared`.
**1.2** `apps/frontend` and `apps/backend` are strictly prohibited from redefining form logic, types, or validation schemas. All form-related imports must originate from `@mms/shared`.
**1.3** `packages/shared/src/index.ts` acts as the strict barrel export. Subpath imports are forbidden. The `package.json` declares strict ESM: `"type": "module"`, `"moduleResolution": "bundler"`, and explicitly mapped `"exports"`.
**1.4** Internal cross-referencing types reside in `packages/shared/src/_internal.ts`. This file exports only pure types and constants. It must *never* import from `schemas.ts` or `utils.ts` to natively guarantee zero ESM circular dependencies.

### Rule 2: Branded Identifier Types

**2.1** Every domain identifier carries a compile-time brand to prevent accidental interchange across Fastify, Drizzle, and React.
**2.2** Brand declaration pattern: `declare const __brand: unique symbol; export type Brand<B> = { readonly [__brand]: B };`
**2.3** Branded types with strict format constraints via factory functions:

* `FieldId`: `^[a-z0-9_]+$` (e.g., `core_student_name`)
* `TabId`: `^[a-z0-9_]+$` (e.g., `tab_personal`)
* `BlueprintId`: `^bp_[a-zA-Z0-9]+$`
* `TenantId`: `^tnt_[a-zA-Z0-9]+$`
* `ISODateTime`: Strict ISO 8601 with timezone offset.
**2.4** Factory functions (e.g., `createFieldId`) enforce runtime validation. Raw string casting is prohibited. Deserialization requires `validateBlueprint()` to reconstruct brands safely.

### Rule 3: Field Taxonomy & Entity Enumeration

**3.1** The field type union is closed. Each maps to exactly one Shadcn UI primitive: `text`, `textarea`, `number`, `boolean`, `date`, `datetime`, `email`, `url`, `currency`, `single_select`, `multi_select`, `file`.
**3.2** `file` metadata structure: `{ filename, mimeType, size, url, uploadedAt, uploadedBy, storageKey, scanStatus }`.
**3.3** MMS Supported Entities: `student`, `instructor`, `asset`, `invoice`, `exam`, `guardian`. Adding an entity requires synchronized updates across unions, Zod enums, Drizzle tables, routes, and query keys.
**3.4** **Core Fields (`isCore: true`):** Map to explicit typed columns (e.g., `student_name varchar(255)`).
**3.5** **Custom Fields (`isCore: false`):** Map exclusively to the `custom_data jsonb` column.

---

## PILLAR II: Navigation & UI Layout Engine

### Rule 4: The Logical Vertical Sidebar

**4.1** Form navigation utilizes a Radix UI `Tabs` primitive configured for a vertical sidebar. It accommodates deep modules gracefully without horizontal scrolling.
**4.2** **CRITICAL SAFEGUARD (Native RTL Navigation):** For Arabic/Urdu (`dir="rtl"`), forcing the sidebar to the left violates cognitive UX patterns. The sidebar **MUST** dock to the starting edge. Tailwind v4 logical properties (`start-0`, `border-e`, `ms-auto`) ensure the layout naturally flips to the right side of the screen in RTL mode.
**4.3** **Ghost Tab Prevention:** Automatically conceal tab triggers if they contain no visible fields (due to AST conditions or RBAC restrictions).
**4.4** **Dynamic Badges:** Append numerical counts to tab labels for array-based data collections (e.g., "Emergency Contacts [3]").

### Rule 5: Tab Taxonomy & Custom Tab Management

**5.1** **Core Tabs (`isCustom: false`):** System-provided baseplates. Un-deletable, but Tenant Admins may append Custom Fields to them.
**5.2** **Custom Tabs (`isCustom: true`):** Created entirely by Tenant Admins via the Fields Registry Builder. Assigned dynamic `order` integers to sequence seamlessly alongside system tabs.
**5.3** **Strict Containment:** Custom Tabs may **ONLY** contain Custom Fields. Core fields cannot be dragged into Custom Tabs (enforced via Zod `.superRefine()`).

### Rule 6: Form Shell & Safe Progress Visualization

**6.1** Contextual titling: Render state-aware subtitles and entity-specific branding icons (from `lucide-react`) left of the title.
**6.2** **CRITICAL SAFEGUARD (Division-by-Zero Prevention):** A `<FormProgressBar />` embeds below the title. Calculation MUST utilize ternary safe-division to prevent `0 / 0 === NaN` React render crashes if a blueprint has zero required fields:

```javascript
const reqRatio = totalRequired === 0 ? 0 : filledRequired / totalRequired;
const optRatio = totalOptional === 0 ? 0 : filledOptional / totalOptional;
const progress = (reqRatio * 0.7) + (optRatio * 0.3);
```

**6.3** Display top-level summary error blocks immediately below the header upon validation failure.
**6.4** Wrap dynamic tab content in standardized cards: `rounded-xl border border-border bg-card/50 p-4`. Empty states trigger the `BookOpen` illustration.

### Rule 7: Builder Hot-Swapping & Memory Safety

**7.1** A "Builder Mode" toggle (cog icon) sits in the sticky footer, restricted to authorized Tenant Administrators.
**7.2** Clicking the toggle hot-swaps the data-entry viewport with the Fields Registry Builder.
**7.3** **CRITICAL SAFEGUARD (Serialization Preservation):** `sessionStorage` destroys `Date` and `File` objects. Hot-swapping must park active form state in **TanStack Query's synchronous active memory cache** to preserve complex objects:

```typescript
queryClient.setQueryData(['builder_draft', entityType, recordId], form.getValues());
```

---

## PILLAR III: Storage, Isolation & RBAC

### Rule 8: The Flat JSONB Storage Mandate (Anti-Nesting Rule)

**8.1** Tabs are purely frontend UI layout constructs. PostgreSQL has zero awareness of tabs.
**8.2** **CRITICAL SAFEGUARD:** On form submission, all Custom Fields merge into a **single, flat `custom_data` object**, regardless of UI tab location. Nested JSONB breaks GIN indexing and is strictly prohibited.

### Rule 9: PostgreSQL Row-Level Security (Strict Transactions)

**9.1** RLS is mandatory on all tenant-scoped tables via `tenant_id`.
**9.2** **CRITICAL SAFEGUARD (Pool Poisoning Prevention):** RLS context is strictly transaction-scoped using `set_config` with `is_local: true`. Global config on pooled connections is prohibited.

```typescript
await db.transaction(async (tx) => {
  // 'true' translates to SET LOCAL (destroyed instantly on COMMIT/ROLLBACK)
  await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`);
});
```

### Rule 10: RBAC & JSONB Deep Merge (Data Destruction Prevention)

**10.1** Schema compilation drops fields from the frontend if the user lacks `readRoles` or `adminRoles`.
**10.2** **CRITICAL SAFEGUARD:** Incoming payloads lack stripped keys. Fastify **MUST** use JSONB concatenation with `COALESCE` to deep-merge data. Blind overwrites (`= $1`) permanently delete admin-only data.

```typescript
await tx.update(students).set({
  customData: sql`COALESCE(${students.customData}, '{}'::jsonb) || ${incomingPayload}::jsonb`
});
```

---

## PILLAR IV: Validation & Interactive Safeguards

### Rule 11: Validation Cascade & Error Auto-Routing

**11.1** Execute client-side Zod validation hooks prior to payload submission.
**11.2** **Error Auto-Routing:** On submit failure, instantly switch the Radix tab state to the first tab containing failures and smooth-scroll to the invalid input (`element.scrollIntoView({ behavior: 'smooth', block: 'center' })`).
**11.3** Destructive visuals: Invalid inputs enforce `border-destructive` color shifts. Relying solely on text errors fails WCAG 2.1 AA.

### Rule 12: Asynchronous Duplication Interception & Indexing

**12.1** Background queries trigger duplicate detection while typing (500ms debounce).
**12.2** **CRITICAL SAFEGUARD (Indexing Pattern):** Exact match fields (`email`, `cnic`, `phone`) MUST execute against standard **B-Tree indexes** or Unique Constraints. Trigram (`pg_trgm`) indexes are computationally expensive and strictly reserved for fuzzy matching (`name`, `address`).
**12.3** Interruption Modal: Potential duplicates trigger a `<ConfirmAlertDialog />` forcing a deliberate bypass or merge decision.

### Rule 13: Conditionals & Math Safeguards

**13.1** AST conditionals (`eq`, `neq`, `gt`, `contains`, etc.) evaluate synchronously via `useWatch`. Circular condition references are actively rejected (Max Depth: 10).
**13.2** **CRITICAL SAFEGUARD (IEEE 754 Bypass):** Currency is stored as `string`. Precision is validated via string manipulation, never floating-point arithmetic (`Math.round()`).

```typescript
const decimals = val.toString().split('.')[1] ?? '';
if (decimals.length > field.precision) throw new Error('Precision exceeded');
```

---

## PILLAR V: Frontend Execution & React 19 State

### Rule 14: Vite SPA Architecture

**14.1** RSC is unavailable. Blueprints are fetched via TanStack Query. Schema compilation executes client-side heavily memoized: `useMemo(() => compileZodFromBlueprint(blueprint), [blueprint?.blueprintId])`.

### Rule 15: React Hook Form Initialization (Crash Prevention)

**15.1** **CRITICAL SAFEGUARD (Uncontrolled Crash Prevention):** To prevent React 19 uncontrolled-to-controlled component crashes:

* `text`, `email`, `url`, `single_select`, `currency` **MUST initialize to `""`**.
* `number`, `boolean`, `date`, `datetime` initialize to `null`.
* `multi_select` initializes to `[]`.
**15.2** `react-hook-form` manages a single, massive, flat state object, completely agnostic to UI tab layouts.

---

## PILLAR VI: Backend API, Security & Operations

### Rule 16: Fastify v5 Security & The Versioning Race

**16.1** Static endpoints (Blueprint Builder): Use `zodToJsonSchema` for `Ajv` speed.
**16.2** **CRITICAL SAFEGUARD (AJV Bypass & Payload Starvation):** Dynamic Data Entry routes must bypass `Ajv`. To prevent Node.js event loop starvation from massive JSON attacks, the route enforces a strict `bodyLimit`.
**16.3** **CRITICAL SAFEGUARD (Version Lock):** Forms must submit their `_blueprintId`. Fastify fetches and validates against *that exact version*, preventing race conditions if an Admin publishes an update mid-submission.

```typescript
fastify.post('/records/:entityType', {
  bodyLimit: 1048576, // 1MB strict limit for dynamic payloads
  schema: { body: { type: 'object', additionalProperties: true } },
  handler: async (request, reply) => {
    // Lock validation to the exact blueprint version the user saw
    const blueprint = await fetchBlueprintById(request.user.tenantId, request.body._blueprintId);
    const schema = compileZodFromBlueprint(blueprint);
    // Execute Zod safeParse...
  }
});
```

### Rule 17: Cache Security & Rate Limiting

**17.1** **CRITICAL SAFEGUARD (CDN Leak Prevention):** Published blueprints MUST be cached with: `Cache-Control: private, max-age=300, stale-while-revalidate=86400`. The `private` directive prevents shared CDNs from leaking Tenant A's blueprints to Tenant B.

### Rule 18: ReDoS, SSRF & Zero-Trust File Uploads

**18.1** **ReDoS:** Tenant `regexPattern` values pass through AST analysis (`regjsparser`).
**18.2** **SSRF:** URL validation blocks `localhost`, RFC 1918, and link-local ranges.
**18.3** **Zero-Trust Uploads:** Browser uploads directly to S3 via presigned URLs. Fastify executes an AWS SDK `HEAD Object` request to verify true `Content-Length` and `Content-Type` before persisting metadata to Drizzle. Never trust client-provided file stats.

---

## Appendix A: Checklist of 14 Critical Safeguards (CS)

Before code merge, QA must verify these 14 catastrophic failure vectors are sealed:

| ID | Safeguard | Location | Failure Mode Prevented |
| --- | --- | --- | --- |
| **CS-1** | Empty string `""` initialization | Rule 15.1 | React uncontrolled-to-controlled crash |
| **CS-2** | `COALESCE` + `||` JSONB merge | Rule 10.2 | Admin-only key deletion on dynamic update |
| **CS-3** | `set_config(..., true)` RLS | Rule 9.2 | Cross-tenant data leakage via pool poisoning |
| **CS-4** | `Cache-Control: private` | Rule 17.1 | Shared CDN exposing tenant blueprints |
| **CS-5** | `bodyLimit` + AJV Bypass | Rule 16.2 | Node.js event-loop starvation via payload |
| **CS-6** | Version-Locked Validation | Rule 16.3 | Mid-entry schema validation mismatch |
| **CS-7** | IEEE 754 String Bypass | Rule 13.2 | Currency precision math corruption |
| **CS-8** | Flat JSONB Anti-Nesting | Rule 8.2 | PostgreSQL GIN index failure & query degradation |
| **CS-9** | TanStack Cache for Hot-Swap | Rule 7.3 | Destruction of JS Dates & Files on toggle |
| **CS-10** | S3 `HEAD Object` Verification | Rule 18.3 | Metadata spoofing, oversized malware uploads |
| **CS-11** | Safe Division for Progress Bar | Rule 6.2 | `NaN` React render tree crashes on empty forms |
| **CS-12** | B-Tree Exact Matches | Rule 12.2 | Database write degradation via `pg_trgm` |
| **CS-13** | Logical RTL docking (`start-0`) | Rule 4.2 | Broken/jarring interface for Arabic/Urdu users |
| **CS-14** | Strict ESM `package.json` | Rule 1.3 | Silent build failures & circular imports |
