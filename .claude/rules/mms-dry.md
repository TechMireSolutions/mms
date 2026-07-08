---
description: DRY (Don't Repeat Yourself) guidelines, extraction thresholds, boundaries, and @mms/shared exports standards.
---

# MMS DRY & Shared Package Policy

**Don't Repeat Yourself (DRY)** — every piece of knowledge, logic, and configuration must have a single, unambiguous, authoritative representation within the Madrasa Management System (MMS).

---

## 1. Proactive Search & Duplication Audits
- **Search First**: BEFORE writing any helper function, component, validation schema, utility hook, or CSS style, search `@mms/shared`, `apps/frontend/src/hooks/`, and `apps/frontend/src/components/ui/` for existing equivalents.
- **Extend, Don't Fork**: If an existing helper almost fits your use case, extend its parameters rather than copying it or creating a near-duplicate function.
- **Scan & Refactor**: When editing code, actively scan the surrounding files for duplicate blocks and refactor them into a unified local utility.

---

## 2. Extraction Thresholds & Strategy
Extract logic to a shared layer (e.g., `@mms/shared` or a local hook/component) if **any** of the following conditions are met:
1. **Logic Repetition**: The same logic appears $\ge 2$ times across different files.
2. **Multi-Module / Boundary Cross**: The logic crosses feature boundaries or the frontend ↔ backend boundary.
3. **Complexity & Length**: A block of code is $> 15$ lines of identical or parametrically identical implementation.

*Constraint*: Keep code inlined if it is truly unique and used only once. Premature abstraction is prohibited.

---

## 3. Monorepo Layer Boundaries
Ensure clear separation of concerns to prevent domain logic from leaking into infrastructure:

```
@mms/shared     Pure validation schemas, types, constants, default configs, and I/O-free formatters.
apps/*/services Hooks, UI components, API route controllers, and database schemas/queries.
```

### Shared Package (`@mms/shared`) Standards
- **Exports Map**:
  - `contactTypes.ts` / `userTypes.ts` / `settingsTypes.ts`: Domain models and default configs (e.g. `DEFAULT_*`).
  - `appTranslations.ts`: Global i18n dictionaries and translation helpers.
  - `brandingTheme.ts` / `logoBrandColors.ts`: CSS color math and accessibility contrast logic.
  - `utils.ts`: Pure helpers (`formatDate`, `getDisplayName`, `parsePhoneNumber`, `getInitials`, `toTitleCase`, `applyTitleCaseRecursive`).
- **Import Rule**: Always use named exports from `@mms/shared` (e.g., `import { Contact } from '@mms/shared'`). Subpath imports are forbidden.
- **Do NOT Put in Shared**: React components, direct Fastify/DB query code, or browser APIs (like `localStorage` or DOM properties).

---

## 4. Quality Bar & Code Cleanup
- **Strict Typing**: Strict TypeScript mode is mandatory. Use `unknown` and type narrowing. The use of `any` is forbidden.
- **JSDoc**: Required on **public exports** in `packages/shared` only. Omit elsewhere; do not add narrating comments to application code.
- **Unit Testing**: All non-trivial pure logic helper utilities added to `@mms/shared` must include unit tests.
- **Dead Code**: Actively prune unused imports, dead variables, and legacy shims within your change boundary.
- **Date Formatting Consistency**: Never format dates using raw inline `.toLocaleDateString()` or custom format patterns. All date formatting across the monorepo must resolve through the global settings-driven `formatDate` helper (imported from `@mms/shared`, `@/lib/utils`, or `@/lib/db`) to ensure the user's date format settings are applied everywhere.
- **Money & Currency Formatting Consistency**: Never format money/currency values using raw inline `.toLocaleString()` or custom string prefixes (e.g. `PKR ...` or `₨ ...`). All currency formatting across the monorepo must resolve through the centralized `formatMoney` helper (imported from `@mms/shared`) to ensure consistency and correct locale formatting.
