---
description: Master specification for MMS Static Form Architecture - ESM boundaries, branded IDs, Zod validation, IEEE 754 bypass, transaction-scoped RLS, React 19 state init, S3 uploads.
paths:
  - "packages/shared/src/**/*.ts"
  - "apps/frontend/src/components/ui/FormPrimitives.tsx"
  - "apps/backend/src/db/schema.ts"
  - "apps/backend/src/routes/api/db/**/*.ts"
  - "apps/backend/src/routes/api/contacts/**/*.ts"
  - "apps/backend/src/routes/**/*.ts"
---

# 🏛️ MMS Form Architecture: Master Static Blueprint Specification

This specification governs all code, form structure, layout, UX/UI patterns, and backend save payloads across the Madrasa Management System (MMS) `pnpm` monorepo. It establishes the rule of simple static forms using standard inputs, replacing dynamic form layout engines.

---

## PILLAR I: Monorepo Foundation & Validation

### Rule 1: Form Structure and Layout Strategy
- Forms must be implemented statically using React state and standard HTML/Tailwind input primitives.
- Standard input elements (inputs, textareas, checkboxes) must utilize the central primitives (`Input`, `Textarea`, `Checkbox`) and resolve to style constants from `formStyles.ts` to ensure consistent borders, outline rings, and focus states. Inline custom stylings on inputs are prohibited.
- **Tab-to-Table Mapping**: Forms must map tabs to target database tables on a 1-to-1 basis. If a form is persisting inputs for exactly one table, it must be represented in a single-tab layout. If the form targets multiple tables, it must split its fields across multiple distinct tabs, allocating exactly one tab per table.
- Dynamic form compilation engines, visual builders, and dynamic schema generation configurations are prohibited on the frontend.
- Structure must use a unified standard `<FormModal>` container to ensure visual and responsive consistency.
- **Stacking Context & Dropdown Z-Indices**: When vertical sections, fieldsets, or cards containing pickers/dropdowns (like `ContactPicker`) are stacked in a single scrolling layout, they must be wrapped in container elements with descending z-indices (e.g. `z-30`, `z-20`, `z-10`) or dynamically styled based on list indices (`style={{ zIndex: 100 - idx }}`). This prevents absolute/floating picker list overlays from hiding underneath subsequent sibling cards or fields.
- **DRY Date Pickers**: All dates requiring user selection or calendar input fields must use the central `<DatePicker>` component (`@/components/ui/DatePicker`) instead of native browser `<input type="date">` inputs. The date picker must render its calendar trigger icon inside the box on the left-hand side to maintain alignment with other icon-prepended inputs and settings-driven date formatting consistency.

### Rule 2: React Hook Form & Component State Initialization
- To prevent React 19 uncontrolled-to-controlled component warning crashes, all form input fields must initialize with standard defaults:
  - Strings (`text`, `email`, `url`, `currency` selectors) **MUST initialize to `""`**.
  - Numbers, Dates, and Times **MUST initialize to `null` or appropriate defaults**.
  - Multi-select choices and lists **MUST initialize to `[]`**.
- Keep form state simple, clean, and flat to simplify payload validation mapping.
- **Form Fields Accessibility**: Every input field, select box, textarea, and picker control must declare explicit `name` and `id` properties. Primitives must fallback automatically to `React.useId()` if not passed down.
- **Unified Phone Fields**: Phone inputs must use a single, unified text input field (marked with `type="tel"`) instead of separate country code (`cc`) and number fields to support standard browser autofill and copy-paste. Apply a blur handler to parse and split it into country code and local number values for database storage.
- **Zero-Click List Pre-population**: Forms with editable list sections (e.g. phones, emails, addresses, socials, emergency contacts) must pre-populate exactly one empty default item when the list is empty to save the user an initial "Add" click. Completely blank/unedited list rows must be stripped out by a sanitization/clean helper prior to validation and database saving.

### Rule 3: Decimal Precision & Currency Math
- Currency and fee values must be treated as strings on input and validated without floating-point arithmetic to prevent IEEE 754 precision inaccuracies.
- Validate decimal boundaries by verifying decimals string length:
  ```typescript
  const decimals = val.toString().split('.')[1] ?? '';
  if (decimals.length > precision) throw new Error('Precision exceeded');
  ```

---

## PILLAR II: Navigation & Directional Alignment

### Rule 4: Tab Layouts & RTL Compatibility
- Modal layouts requiring section segmentation must use `Tabs` within the sidebar or body triggers.
- For RTL language support (Arabic/Urdu), sidebars and tabs must dock to the starting edge. Use logical Tailwind CSS variables (`start-0`, `border-e`, `ms-auto`) to ensure elements automatically adapt their position when the document direction changes.

### Rule 5: User Error Routing
- Forms must handle local errors explicitly, displaying readable inline validation indicators.
- In multi-tab forms, validation failures must automatically focus the first tab containing invalid inputs, ensuring errors are immediately visible.

---

## PILLAR III: Security & Tenant Isolation

### Rule 6: Row-Level Security (RLS) Transactions
- Every database transaction must enforce tenant isolation using the transaction-scoped `app.current_tenant` parameter:
  ```typescript
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`);
    // execute operations...
  });
  ```

### Rule 7: Zero-Trust File Uploads
- File uploads are uploaded directly to S3 via presigned URLs.
- The backend must perform an AWS SDK `HEAD Object` request to verify the file's `Content-Length` and `Content-Type` before persisting any metadata, maintaining zero-trust safety.
