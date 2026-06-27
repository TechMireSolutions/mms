---
name: mms-form-architecture
description: Implements and verifies features within the MMS Dynamic Form Architecture — ESM boundaries, branded IDs, dynamic validation, decimal precision safeguards, transaction RLS, JSONB deep merge, React 19 uncontrolled inputs, and Zero-Trust S3 uploads.
---

# MMS Dynamic Form Architecture Skill

This skill guides the implementation, extension, and auditing of dynamic form blueprints, custom fields, data validation, and secure S3 file ingestion in the MMS monorepo.

**Reference Specification:** [`dcform.md`](../../dcform.md) · **Rule:** `mms-form-architecture.mdc`

---

## 🏛️ Implementation Checklist by Pillar

### Pillar I: Monorepo Foundation & Domain Modeling
* **Rule 1: Strict ESM Boundaries & Package Isolation:**
  - Place all blueprint definitions, schemas, validators, types, and utilities exclusively in `packages/shared`, exported as `@mms/shared`.
  - `apps/frontend` and `apps/backend` are strictly prohibited from redefining form logic, types, or validation schemas. All form-related imports must originate from `@mms/shared`.
  - Export types/utilities exclusively via named barrel exports in `packages/shared/src/index.ts`. Subpath imports are forbidden.
  - Keep internal cross-referencing types in `packages/shared/src/_internal.ts`. It must never import from `schemas.ts` or `utils.ts` to natively guarantee zero circular dependencies.
  - Enforce Node >=26 ESM standards in `packages/shared/package.json` (`"type": "module"`, `"moduleResolution": "bundler"`, and explicitly mapped `"exports"`).
* **Rule 2: Branded Identifier Types:**
  - Compile-time brand every domain identifier (`FieldId`, `TabId`, `BlueprintId`, `TenantId`, `ISODateTime`) using: `declare const __brand: unique symbol; export type Brand<B> = { readonly [__brand]: B };`.
  - Use factory functions to validate and instantiate identifiers:
    - `FieldId`: `^[a-z0-9_]+$` (e.g., `core_student_name`)
    - `TabId`: `^[a-z0-9_]+$` (e.g., `tab_personal`)
    - `BlueprintId`: `^bp_[a-zA-Z0-9]+$`
    - `TenantId`: `^tnt_[a-zA-Z0-9]+$`
    - `ISODateTime`: Strict ISO 8601 with timezone offset.
  - Direct string casting is prohibited. Deserialize using `validateBlueprint()` to reconstruct brands.
* **Rule 3: Field Taxonomy & Entity Enumeration:**
  - Ensure the field type union is closed and maps strictly to Shadcn UI primitives: `text`/`textarea`/`email`/`url` (string), `number` (number), `boolean` (boolean), `date`/`datetime`/`currency` (string), `single_select` (string), `multi_select` (string[]), `file` (metadata object).
  - `file` metadata structure: `{ filename, mimeType, size, url, uploadedAt, uploadedBy, storageKey, scanStatus }`.
  - Map core fields (`isCore: true`) to explicitly typed Drizzle columns, and custom fields (`isCore: false`) exclusively to the `custom_data jsonb` column.
  - Supported entities: `student`, `instructor`, `asset`, `invoice`, `exam`, `guardian`. Adding an entity requires synchronized updates across unions, Zod enums, Drizzle tables, routes, and query keys.

### Pillar II: Navigation & UI Layout Engine
* **Rule 4: The Logical Vertical Sidebar:**
  - Form navigation utilizes a Radix UI `Tabs` primitive configured for a vertical sidebar.
  - **CRITICAL SAFEGUARD (Native RTL Navigation):** For Arabic/Urdu (`dir="rtl"`), the sidebar **MUST** dock to the starting edge. Use Tailwind v4 logical properties (`start-0`, `border-e`, `ms-auto`) to naturally flip the layout to the right side of the screen in RTL mode.
  - Conceal tab triggers dynamically if they contain no visible fields due to AST conditions or RBAC.
  - Append numerical counts to tab labels for array-based data collections (e.g., "Emergency Contacts [3]").
* **Rule 5: Tab Taxonomy & Custom Tab Management:**
  - Root `FormBlueprint` structurally organizes fields into an ordered array of `FormTab` objects.
  - Core Tabs (`isCustom: false`) are un-deletable baseplates. Custom Fields can be appended to the bottom.
  - Custom Tabs (`isCustom: true`) are tenant-created via the Fields Registry Builder and can be renamed, reordered, or deleted freely.
  - **CRITICAL INVARIANT:** Custom Tabs must **ONLY** contain Custom Fields. Core fields cannot be dragged into Custom Tabs (enforced via Zod `.superRefine()`).
* **Rule 6: Form Shell & Safe Progress Visualization:**
  - Contextual titling: Render state-aware subtitles and entity-specific branding icons (from `lucide-react`) left of the title.
  - **CRITICAL SAFEGUARD (Division-by-Zero Prevention):** `<FormProgressBar />` calculation MUST utilize ternary safe-division to prevent `0 / 0 === NaN` React render crashes if a blueprint has zero required fields:
    ```javascript
    const reqRatio = totalRequired === 0 ? 0 : filledRequired / totalRequired;
    const optRatio = totalOptional === 0 ? 0 : filledOptional / totalOptional;
    const progress = (reqRatio * 0.7) + (optRatio * 0.3);
    ```
  - Display top-level summary error blocks immediately below the header upon validation failure.
  - Wrap dynamic tab content in standardized cards: `rounded-xl border border-border bg-card/50 p-4`. Empty states trigger the `BookOpen` illustration.
* **Rule 7: Builder Hot-Swapping & Memory Safety:**
  - Restricted "Builder Mode" toggle (cog icon) in the sticky footer. Hot-swap redirection switches viewport to Fields Registry Builder.
  - **CRITICAL SAFEGUARD (Serialization Preservation):** `sessionStorage` destroys `Date` and `File` objects. Hot-swapping must park active form state in **TanStack Query's synchronous active memory cache** to preserve complex objects:
    ```typescript
    queryClient.setQueryData(['builder_draft', entityType, recordId], form.getValues());
    ```

### Pillar III: Storage, Isolation & RBAC
* **Rule 8: Flat JSONB Storage Mandate (Anti-Nesting):**
  - Tabs are purely frontend UI layout constructs. The database has zero awareness of tabs.
  - Merge all Custom Fields into a **single, flat `custom_data` object** upon submission. Nested JSONB storage is strictly prohibited to preserve GIN indexing.
* **Rule 9: PostgreSQL Row-Level Security (Strict Transactions):**
  - RLS must be transaction-scoped using `set_config` with `is_local: true`. Setting global variables on pooled DB connections is prohibited:
    ```typescript
    await db.transaction(async (tx) => {
      // Set local tenant context (destroyed instantly on COMMIT/ROLLBACK)
      await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`);
      // Run queries...
    });
    ```
* **Rule 10: RBAC & JSONB Deep Merge (Data Destruction Prevention):**
  - Strip unauthorized fields from incoming payloads if user roles do not intersect the field's `readRoles` or `adminRoles`.
  - To prevent destroying admin-only fields omitted by the frontend payload, use the PostgreSQL JSONB concat (`||`) operator with `COALESCE` on update:
    ```typescript
    await tx.update(students)
      .set({ customData: sql`COALESCE(${students.customData}, '{}'::jsonb) || ${incomingPayload}::jsonb` });
    ```

### Pillar IV: Validation & Interactive Safeguards
* **Rule 11: Validation Cascade & Error Auto-Routing:**
  - Execute client-side Zod validation hooks prior to payload submission.
  - **Error Auto-Routing:** On submit failure, instantly switch the Radix active tab to the first tab containing validation errors and smooth-scroll to the invalid input (`element.scrollIntoView({ behavior: 'smooth', block: 'center' })`).
  - Destructive visuals: Invalid inputs enforce `border-destructive` color shifts. Relying solely on text errors fails WCAG 2.1 AA.
* **Rule 12: Asynchronous Duplication Interception & Indexing:**
  - Background queries trigger duplicate detection while typing (500ms debounce).
  - **CRITICAL SAFEGUARD (Indexing Pattern):** Exact match fields (`email`, `cnic`, `phone`) MUST execute against standard **B-Tree indexes** or Unique Constraints. Trigram (`pg_trgm`) indexes are computationally expensive and strictly reserved for fuzzy matching (`name`, `address`).
  - Potential duplicates trigger a `<ConfirmAlertDialog />` forcing a deliberate bypass or merge decision.
* **Rule 13: Conditionals & Math Safeguards (IEEE 754 Bypass):**
  - Evaluate conditional rules synchronously using Radix/AST operators via `useWatch`. Reject circular condition references during blueprint validation (Max Depth: 10).
  - **CRITICAL SAFEGUARD:** Store currency values as `string` decimals; floating-point math is strictly prohibited. Validate precision bounds via string manipulation, never using `Math.round()`:
    ```typescript
    const decimals = val.toString().split('.')[1] ?? '';
    if (decimals.length > field.precision) throw new Error('Precision exceeded');
    ```

### Pillar V: Frontend Execution & React 19 State
* **Rule 14: Vite SPA Architecture:**
  - RSC is unavailable. Blueprints are fetched via TanStack Query and schema compilation executes client-side heavily memoized via `useMemo` using `[blueprint?.blueprintId]`.
* **Rule 15: React Hook Form Initialization (Crash Prevention):**
  - **CRITICAL SAFEGUARD:** Always initialize string-based inputs (`text`, `email`, `url`, `single_select`, `currency`) to `""` (empty string) to prevent React 19 uncontrolled-to-controlled component crashes.
  - Initialize `number`, `boolean`, `date`, and `datetime` to `null`. Initialize `multi_select` to `[]`.
  - `react-hook-form` manages a single, massive, flat state object, completely agnostic to UI tab layouts.

### Pillar VI: Backend API, Security & Operations
* **Rule 16: Fastify v5 Security & The Versioning Race:**
  - Use `zodToJsonSchema` on Blueprint Builder routes for native Ajv speed.
  - **CRITICAL SAFEGUARD (AJV Bypass):** Bypassing Fastify's Ajv parser is mandatory on dynamic data entry routes. Enforce a strict `bodyLimit`, specify `additionalProperties: true` in the route schema, and run Zod validation manually inside the handler.
  - **CRITICAL SAFEGUARD (Version Lock):** Forms must submit their `_blueprintId`. Fastify fetches and validates against *that exact version*, preventing race conditions if an Admin publishes an update mid-submission:
    ```typescript
    fastify.post('/records/:entityType', {
      bodyLimit: 1048576, // 1MB strict limit for dynamic payloads
      schema: { body: { type: 'object', additionalProperties: true } },
      handler: async (request, reply) => {
        const blueprint = await fetchBlueprintById(request.user.tenantId, request.body._blueprintId);
        const schema = compileZodFromBlueprint(blueprint);
        // Execute Zod safeParse...
      }
    });
    ```
* **Rule 17: Cache Security & Rate Limiting:**
  - Published blueprints MUST be cached with `Cache-Control: private, max-age=300, stale-while-revalidate=86400` to prevent CDN tenant data leakage.
* **Rule 18: ReDoS, SSRF & Zero-Trust File Uploads:**
  - Pass tenant `regexPattern` values through AST analyzer (`regjsparser`) to prevent ReDoS.
  - Validate SSRF on URL types, blocking local addresses, localhost, RFC 1918, and loopbacks.
  - **CRITICAL SAFEGUARD (Zero-Trust Uploads):** Execute uploads browser-to-S3 via Presigned URLs. Enforce AWS SDK `HEAD Object` request to verify true `Content-Length` and `Content-Type` before persisting metadata to Drizzle. Never trust client-provided file stats.

---

## 🛡️ Appendix A: Checklist of 14 Critical Safeguards (CS)

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
