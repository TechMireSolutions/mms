---
description: 
---

# Role

Act as a **Senior Frontend Architect and UI/UX Systems Engineer**.

## Project

`mms` project — scope is **all modules under the `tenant` domain/module**.

## Objective

Audit and prepare a safe refactoring strategy for **all Tenant forms** to achieve:

* Consistent UI/UX and accessibility.
* Strong DRY principles.
* Clear **Single Source of Truth (SSOT)**.
* Maximum reuse of shared form components and patterns.
* Consistent validation, errors, loading, submission, and reset behaviour.
* Scalable architecture without unnecessary abstraction.
* Safe, incremental migration with minimal regression risk.

## Critical Constraint

**Do NOT write, modify, rename, delete, or generate implementation code yet.**

Do not install dependencies or change schemas/APIs. This task is **audit + architecture + migration planning only**.

---

# 1. Inventory & Audit

Inspect every Tenant form, including:

* Create/edit forms
* Search/filter forms
* Modal/drawer forms
* Multi-step forms
* Inline/nested forms
* Dynamic/conditional forms
* Forms with uploads or dependent fields

Also inspect existing form infrastructure: shared components, hooks, schemas, types, validation, API mappings, and UI primitives.

### Form Inventory

For every form provide:

| Form | Module | Purpose | File Path | Form Library | Validation | Schema | Complexity | Risk |
| ---- | ------ | ------- | --------- | ------------ | ---------- | ------ | ---------- | ---- |

Do not omit small or apparently insignificant forms.

### Audit Each Form

Analyse:

* Form-state management.
* Initial/default values.
* Validation and duplication.
* Field types and reusable controls.
* API ↔ form data mapping.
* Loading/submission/error states.
* Reset/cancel/success behaviour.
* Accessibility.
* Responsive/layout consistency.
* Existing shared components.

Classify findings as:

* Duplicate code
* Duplicate validation
* Duplicate types/defaults
* Duplicate UI
* Duplicate business logic
* Inconsistent UX
* Accessibility issues
* Tight coupling
* Unnecessary complexity
* Technical debt

For each significant finding explain:

1. What is duplicated/inconsistent?
2. Where does it occur?
3. Why is it problematic?
4. What should become the SSOT?
5. What abstraction could address it?
6. What risks exist in consolidating it?

---

# 2. SSOT & Architecture

Define clear ownership for:

* Form schemas
* Validation rules
* Form values/types
* Domain/API types
* Default values
* Enumerations/options
* Data transformations

If the project already uses **Zod, Yup, Valibot, React Hook Form, Formik, etc.**, evaluate the existing stack first. Do not introduce competing libraries without a strong reason.

Maintain separation between:

**UI → Form State → Validation/Schema → Domain/API**

Do not place unnecessary API/business logic inside reusable UI components.

---

# 3. Shared Component Architecture

Propose only abstractions justified by actual duplication.

Evaluate the need for shared primitives such as:

* `Form`
* `FormField`
* `FormLabel`
* `FormControl`
* `FormDescription`
* `FormMessage`
* Controlled input/select/textarea/checkbox/radio/switch
* Date/date-time picker
* Combobox/autocomplete
* File upload
* Form sections
* Form actions
* Submit/loading button

Also evaluate appropriate shared hooks/context.

**Do not create abstractions merely because components look similar. Prefer composition and simple reusable primitives over overly generic/configuration-heavy components.**

Before proposing a new abstraction:

1. Search for an existing equivalent.
2. Determine whether it can be extended.
3. Explain why a new abstraction is necessary.

---

# 4. Phased Migration Plan

Create a dependency-aware migration plan.

Do not migrate forms simply in file-system order.

Recommended sequence:

1. Shared infrastructure/primitives.
2. Foundational schemas/components.
3. Simple representative forms.
4. Medium-complexity forms.
5. Complex/high-risk forms.

Every form must have a dedicated migration entry:

| Form | Current State | Target State | Dependencies | Steps | Complexity | Risk | Regression Risks | Verification | Rollback |
| ---- | ------------- | ------------ | ------------ | ----- | ---------- | ---- | ---------------- | ------------ | -------- |

Identify dependencies between forms/components and provide a migration dependency graph where useful.

---

# 5. Verification & Testing

Define verification for each migration.

### Functional

* Create/edit
* Validation
* Submit/reset/cancel
* Loading states
* Server errors
* Conditional/dependent fields

### UI/UX

* Layout
* Spacing
* Responsive behaviour
* Error/loading states
* Consistent interaction patterns

### Accessibility

* Labels
* Keyboard navigation
* Focus management
* Error announcements
* Screen-reader semantics

### Technical

* Type checking
* Linting
* Unit/integration tests
* Existing test suite
* Production build

Prioritise behavioural and integration testing over implementation-detail tests.

---

# 6. Risk Register

Identify significant risks with:

| Risk | Affected Area | Probability | Impact | Mitigation | Rollback |
| ---- | ------------- | ----------- | ------ | ---------- | -------- |

---

# 7. Required Final Deliverable

Structure the response as:

1. **Executive Summary**
2. **Complete Tenant Form Inventory**
3. **Existing Form Architecture Map**
4. **Duplication & Inconsistency Matrix**
5. **Shared Component Architecture**
6. **Schema/Type/SSOT Strategy**
7. **Migration Dependency Graph**
8. **Form-by-Form Migration Plan**
9. **Testing & Verification Strategy**
10. **Risk Register**
11. **Recommended Implementation Order**
12. **Definition of Done**

Use Mermaid diagrams where useful.

## Definition of Done

The target architecture should ensure:

* No unnecessary duplicate form primitives.
* Consistent UI, UX, accessibility, validation, and error handling.
* Clearly defined SSOT for schemas, defaults, and types.
* Explicit and maintainable API/form mapping.
* Shared components are reusable and independently testable.
* Domain-specific logic remains clear.
* No unnecessary abstraction.
* Every migrated form has verification and rollback criteria.
* Existing functionality is preserved unless an intentional change is documented.

## Evidence Standard

Be precise and repository-driven.

Clearly distinguish:

* **Observed** — directly confirmed in the codebase.
* **Inferred** — strongly suggested but not confirmed.
* **Recommended** — proposed future architecture.

Never present assumptions as facts.

If something cannot be determined, state:

**Unknown — requires repository inspection.**

Reference exact file paths wherever possible.

**Do not implement anything during this task. Produce only the audit, target architecture, dependency analysis, and phased migration plan.**
