# Sub-project B — Entity Descriptor Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the adopted (baseline `8e52ae27`) FE entity descriptor registry into a FieldConfig-backed adapter and prove it on the contacts Work-tier cards, with SSOT invariants enforced by tests.

**Architecture:** The static descriptor registry (`apps/frontend/src/components/common/entityRegistry*`, `descriptors/`) stays for simple/platform entities. A new adapter `createEntityDescriptorFromFieldConfig` maps the tenant runtime `FieldConfig` (shared `FieldDefinition`, source of truth per `mms-fields.md`) into descriptor fields at render time — i18n, permissions, and custom fields preserved via injected resolvers. `DirectoryCardMetadata` gains a merge mode so descriptor-driven tiles compose with bespoke module chrome. Contacts is the pilot; further module rollouts follow after the review gate (spec Revision 1, B-6).

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library (happy-dom), `@mms/shared` registry types, existing `entityDescriptorFactory`.

**Spec:** `docs/superpowers/specs/2026-09-20-ui-consolidation-design.md` — Revision 1 (2026-09-20), items B-1..B-5.

## Global Constraints

- Every task ends green: `cd apps/frontend && pnpm typecheck` clean, `npx vitest run <changed test files>` passes, `pnpm lint` clean, `pnpm check:code-norms` (repo root) all ratchets held. Run from repo root for norms: `pnpm check:code-norms`.
- Hard ceiling ~300 lines per file; split rather than grow (`mms-structure-naming.md` §3).
- Named exports only; no `any` in touched code; no physical directional classes.
- Labels only via i18n: injected `resolveLabel` / `labelKey` + `t` — never hardcoded English in new code (`mms-fields.md` §3). Descriptors' existing hardcoded `label` strings are legacy; new adapter path must not add more.
- Badge class strings only from `SEMANTIC_BADGE` / `semanticTone.ts` SSOTs (`mms-ui-ux-design.md` §2).
- Commits: conventional style `feat(frontend): ...` / `test(frontend): ...`; pre-commit hooks run code-norms + rules integrity automatically — they must pass.
- The 32-test `entityRegistry.test.tsx` and all 637 existing test files must keep passing; do not edit existing tests except `DirectoryCardMetadata` label assertions that Task 2 intentionally changes (none expected — existing tests mock `t` as identity).

---

### Task 1: Registry→Descriptor Adapter Core

**Files:**
- Create: `apps/frontend/src/components/common/entityDescriptorFromFieldConfig.ts`
- Test: `apps/frontend/src/components/common/entityDescriptorFromFieldConfig.test.ts`
- Modify: `apps/frontend/src/components/common/index.ts` (add `export * from "./entityDescriptorFromFieldConfig";`)

**Interfaces:**
- Consumes: shared `FieldDefinition` from `@mms/shared` (key/label/labelKey/type/enabled/order/options/permissions/group); `createEntityDescriptor`, `EntityDescriptor`, `FieldDefinition as DescriptorFieldDefinition`, `FieldValueType`, `FieldBadgeConfig` from `./entityDescriptorFactory` / `@/types/entityRegistry`.
- Produces (used by Tasks 3, 4, 5):
  - `mapRegistryFieldType(type: RegistryFieldDefinition["type"]): FieldValueType`
  - `createEntityDescriptorFromFieldConfig<T>(options: CreateEntityDescriptorFromFieldConfigOptions<T>): EntityDescriptor<T>`
  - `interface CreateEntityDescriptorFromFieldConfigOptions<T>` with fields: `entityType, singularLabel, pluralLabel, idField, titleField, fieldsByTab: Record<string, RegistryFieldDefinition[]>, resolveLabel: (field: RegistryFieldDefinition) => string, sectionTitleMap?: Record<string, string>, canViewField?: (field: RegistryFieldDefinition) => boolean, fieldOverrides?: Record<string, Partial<DescriptorFieldDefinition<T>>>`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import type { FieldDefinition as RegistryFieldDefinition } from "@mms/shared";
import {
  createEntityDescriptorFromFieldConfig,
  mapRegistryFieldType,
} from "@/components/common/entityDescriptorFromFieldConfig";

const f = (over: Partial<RegistryFieldDefinition>): RegistryFieldDefinition => ({
  key: "k",
  label: "L",
  type: "text",
  enabled: true,
  order: 1,
  ...over,
});

describe("createEntityDescriptorFromFieldConfig", () => {
  it("maps registry field types to descriptor value types", () => {
    expect(mapRegistryFieldType("text")).toBe("text");
    expect(mapRegistryFieldType("currency")).toBe("currency");
    expect(mapRegistryFieldType("select")).toBe("badge");
    expect(mapRegistryFieldType("single_select")).toBe("badge");
    expect(mapRegistryFieldType("boolean")).toBe("boolean");
    expect(mapRegistryFieldType("email")).toBe("email");
    expect(mapRegistryFieldType("url")).toBe("link");
    expect(mapRegistryFieldType("number")).toBe("number");
    expect(mapRegistryFieldType("date")).toBe("date");
    expect(mapRegistryFieldType("datetime")).toBe("datetime");
    expect(mapRegistryFieldType("unknown" as RegistryFieldDefinition["type"])).toBe("text");
  });

  it("builds a descriptor covering every enabled, viewable field, tab-ordered", () => {
    const resolveLabel = vi.fn((field: RegistryFieldDefinition) => `lbl:${field.key}`);
    const fieldsByTab: Record<string, RegistryFieldDefinition[]> = {
      identity: [
        f({ key: "name", type: "text", order: 10 }),
        f({ key: "gender", type: "select", order: 20, options: ["male", "female"] }),
        f({ key: "disabledField", enabled: false, order: 30 }),
      ],
      contact: [
        f({ key: "email", type: "email", order: 10 }),
        f({ key: "secret", order: 20 }),
      ],
    };
    const descriptor = createEntityDescriptorFromFieldConfig<Record<string, unknown>>({
      entityType: "testEntity",
      singularLabel: "Item",
      pluralLabel: "Items",
      idField: "id",
      titleField: "name",
      fieldsByTab,
      resolveLabel,
      canViewField: (field) => field.key !== "secret",
      fieldOverrides: {
        gender: {
          badgeVariantMap: {
            male: { label: "Male", tone: "info" },
          },
        },
      },
    });

    const keys = descriptor.fields.map((field) => field.key);
    expect(keys).toEqual(["name", "email", "gender"]); // sorted by drawerOrder: 10, 10, 20; disabled + non-viewable excluded
    expect(resolveLabel).toHaveBeenCalledTimes(3);
    expect(descriptor.getField("email")?.type).toBe("email");
    expect(descriptor.getField("gender")?.type).toBe("badge");
    expect(descriptor.getField("gender")?.badgeVariantMap?.male?.label).toBe("Male");
    expect(descriptor.getField("secret")).toBeUndefined();

    const sections = descriptor.getDrawerSections();
    expect(sections.map((s) => s.id)).toEqual(["identity", "contact"]);
    expect(sections[0]?.fields.map((field) => field.key)).toEqual(["name", "gender"]);
  });

  it("applies fieldOverrides over mapped defaults", () => {
    const descriptor = createEntityDescriptorFromFieldConfig<Record<string, unknown>>({
      entityType: "t",
      singularLabel: "T",
      pluralLabel: "Ts",
      idField: "id",
      titleField: "name",
      fieldsByTab: { general: [f({ key: "dob", type: "date" })] },
      resolveLabel: (field) => field.label,
      fieldOverrides: { dob: { type: "text", cardSlot: "hidden" } },
    });
    expect(descriptor.getField("dob")?.type).toBe("text");
    expect(descriptor.getCardFields().map((field) => field.key)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && npx vitest run src/components/common/entityDescriptorFromFieldConfig.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the adapter**

```ts
import type { FieldDefinition as RegistryFieldDefinition } from "@mms/shared";
import type {
  EntityDescriptor,
  FieldBadgeConfig,
  FieldDefinition as DescriptorFieldDefinition,
  FieldValueType,
} from "@/types/entityRegistry";
import { createEntityDescriptor } from "./entityDescriptorFactory";

const REGISTRY_TYPE_TO_VALUE_TYPE: Record<RegistryFieldDefinition["type"], FieldValueType> = {
  text: "text",
  textarea: "text",
  number: "number",
  currency: "currency",
  date: "date",
  datetime: "datetime",
  select: "badge",
  single_select: "badge",
  multiselect: "text",
  multi_select: "text",
  tags: "text",
  boolean: "boolean",
  url: "link",
  email: "email",
  file: "text",
  location: "text",
  ai_summary: "text",
};

/** Map a shared registry field type to a descriptor value type (parity-safe default "text"). */
export function mapRegistryFieldType(type: RegistryFieldDefinition["type"]): FieldValueType {
  return REGISTRY_TYPE_TO_VALUE_TYPE[type] ?? "text";
}

export interface CreateEntityDescriptorFromFieldConfigOptions<T> {
  entityType: string;
  singularLabel: string;
  pluralLabel: string;
  idField: keyof T | string;
  titleField: keyof T | string;
  /** Runtime module field config (tab id → fields), e.g. contacts `fields` from ContactConfig. */
  fieldsByTab: Record<string, RegistryFieldDefinition[]>;
  /** i18n label resolver — registry labels must never be hardcoded (mms-fields.md §3). */
  resolveLabel: (field: RegistryFieldDefinition) => string;
  /** Drawer section titles by tab id (defaults to the tab id capitalized by the factory). */
  sectionTitleMap?: Record<string, string>;
  /** Permission filter — exclude fields the viewer cannot see (e.g. canViewContactField). */
  canViewField?: (field: RegistryFieldDefinition) => boolean;
  /** Per-field descriptor overrides (type, badgeVariantMap, accessor, renderValue, cardSlot, …). */
  fieldOverrides?: Record<string, Partial<DescriptorFieldDefinition<T>>>;
}

/**
 * Build an EntityDescriptor from a runtime module FieldConfig so descriptor-driven
 * surfaces stay SSOT with the tenant registry (custom fields, permissions, i18n intact).
 */
export function createEntityDescriptorFromFieldConfig<T>(
  options: CreateEntityDescriptorFromFieldConfigOptions<T>,
): EntityDescriptor<T> {
  const fields: DescriptorFieldDefinition<T>[] = Object.entries(options.fieldsByTab)
    .flatMap(([tabId, tabFields]) =>
      (tabFields ?? [])
        .filter(
          (field) =>
            field.enabled && (options.canViewField ? options.canViewField(field) : true),
        )
        .map((field) => ({
          key: field.key,
          label: options.resolveLabel(field),
          labelKey: field.labelKey,
          type: mapRegistryFieldType(field.type),
          defaultVisibleInTable: true,
          tableOrder: (field.order + 1) * 10,
          cardSlot: "meta",
          drawerSection: tabId,
          drawerOrder: field.order,
          ...(options.fieldOverrides?.[field.key] ?? {}),
        }) satisfies DescriptorFieldDefinition<T>),
    )
    .sort((a, b) => (a.drawerOrder ?? 999) - (b.drawerOrder ?? 999));

  return createEntityDescriptor<T>({
    entityType: options.entityType,
    singularLabel: options.singularLabel,
    pluralLabel: options.pluralLabel,
    idField: options.idField,
    titleField: options.titleField,
    fields,
    sectionTitleMap: options.sectionTitleMap,
  });
}
```

Note: `FieldBadgeConfig` is imported for the overrides typing surface (used via `Partial<DescriptorFieldDefinition<T>>`); keep the import — it is re-exported through the barrel for consumers that build badge maps.

- [ ] **Step 4: Add barrel export**

In `apps/frontend/src/components/common/index.ts` append:

```ts
export * from "./entityDescriptorFromFieldConfig";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/frontend && npx vitest run src/components/common/entityDescriptorFromFieldConfig.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/common/entityDescriptorFromFieldConfig.ts \
        apps/frontend/src/components/common/entityDescriptorFromFieldConfig.test.ts \
        apps/frontend/src/components/common/index.ts
git commit -m "feat(frontend): FieldConfig-backed entity descriptor adapter"
```

---

### Task 2: i18n labelKey Resolution in Descriptor Consumers

**Files:**
- Modify: `apps/frontend/src/components/ui/DirectoryCardMetadata.tsx` (descriptor tile labels)
- Modify: `apps/frontend/src/components/ui/FilterChips.tsx` (descriptor chip field labels)
- Test: `apps/frontend/src/components/ui/DirectoryCardMetadata.test.tsx` (new)
- Test: `apps/frontend/src/components/ui/FilterChips.test.tsx` (new)

**Interfaces:**
- Consumes: Task 1 adapter emits `labelKey` on descriptor fields; `useTranslation` from `@/hooks/useTranslation` (mock pattern copied from `entityRegistry.test.tsx:27-33`).
- Produces: `resolveFieldLabel(field: { label: string; labelKey?: string }, t: (key: string) => string): string` exported from `DirectoryCardMetadata.tsx` (reused by Task 5 and later modules).

- [ ] **Step 1: Write the failing tests**

`DirectoryCardMetadata.test.tsx`:

```tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DirectoryCardMetadata, resolveFieldLabel } from "@/components/ui/DirectoryCardMetadata";
import { createEntityDescriptor } from "@/components/common/entityRegistry";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => `t:${key}`, dir: "ltr", language: "en" }),
}));

const descriptor = createEntityDescriptor<{ id: string; city: string }>({
  entityType: "demo",
  singularLabel: "Demo",
  pluralLabel: "Demos",
  idField: "id",
  titleField: "id",
  fields: [
    { key: "city", label: "Fallback City", labelKey: "demo.city", type: "text", cardSlot: "meta" },
  ],
});

describe("DirectoryCardMetadata descriptor labels", () => {
  it("resolveFieldLabel prefers labelKey via t, falls back to label", () => {
    expect(resolveFieldLabel({ label: "L", labelKey: "k.demo" }, (k) => `t:${k}`)).toBe("t:k.demo");
    expect(resolveFieldLabel({ label: "L" }, (k) => `t:${k}`)).toBe("L");
  });

  it("renders descriptor tiles with translated labelKey labels", () => {
    const html = renderToStaticMarkup(
      <DirectoryCardMetadata descriptor={descriptor} entity={{ id: "1", city: "Lahore" }} />,
    );
    expect(html).toContain("t:demo.city");
    expect(html).toContain("Lahore");
  });
});
```

`FilterChips.test.tsx`:

```tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { FilterChips } from "@/components/ui/FilterChips";
import { createEntityDescriptor } from "@/components/common/entityRegistry";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => `t:${key}`, dir: "ltr", language: "en" }),
}));

const descriptor = createEntityDescriptor<Record<string, unknown>>({
  entityType: "demo",
  singularLabel: "Demo",
  pluralLabel: "Demos",
  idField: "id",
  titleField: "id",
  fields: [
    { key: "city", label: "Fallback", labelKey: "demo.city", type: "text" },
  ],
});

describe("FilterChips descriptor labels", () => {
  it("uses labelKey via t for the chip field label", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(async () => {
      createRoot(container).render(
        <FilterChips
          filters={{ city: "Lahore" }}
          descriptor={descriptor}
          onRemoveFilter={() => {}}
          onClearAll={() => {}}
        />,
      );
    });
    expect(container.textContent).toContain("t:demo.city");
    expect(container.textContent).toContain("Lahore");
    container.remove();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/frontend && npx vitest run src/components/ui/DirectoryCardMetadata.test.tsx src/components/ui/FilterChips.test.tsx`
Expected: FAIL — `resolveFieldLabel` not exported; labels render raw.

- [ ] **Step 3: Implement**

In `DirectoryCardMetadata.tsx` add:

```tsx
import { useTranslation } from "@/hooks/useTranslation";

/** Resolve a descriptor field label — labelKey via i18n wins over the legacy hardcoded label. */
export function resolveFieldLabel(
  field: { label: string; labelKey?: string },
  t: (key: string) => string,
): string {
  return field.labelKey ? t(field.labelKey) : field.label;
}
```

Inside the component, before the descriptor branch: `const { t } = useTranslation();` — then in the descriptor tile map use `<DirectoryCardMetaTile key={field.key} label={resolveFieldLabel(field, t)}>`.

In `FilterChips.tsx` replace `const fieldLabel = field?.label ?? key;` with:

```tsx
const fieldLabel = field
  ? resolveFieldLabel(field, t)
  : key;
```

and import `resolveFieldLabel` from `./DirectoryCardMetadata`. (`t` is already in scope there.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/frontend && npx vitest run src/components/ui src/components/common/entityRegistry.test.tsx`
Expected: PASS (new tests + existing component tests + 32 registry tests — `DirectoryCardMetadata` now calls `useTranslation`, so this wider run proves no consumer test renders it outside a provider/mock; the registry test mocks `t` as identity so `labelKey`-less fields are unaffected).

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/ui/DirectoryCardMetadata.tsx \
        apps/frontend/src/components/ui/FilterChips.tsx \
        apps/frontend/src/components/ui/DirectoryCardMetadata.test.tsx \
        apps/frontend/src/components/ui/FilterChips.test.tsx
git commit -m "feat(frontend): i18n labelKey resolution for descriptor-driven labels"
```

---

### Task 3: Registry Invariant Tests (SSOT Guards)

**Files:**
- Test: `apps/frontend/src/components/common/entityRegistry.invariants.test.ts` (new)

**Interfaces:**
- Consumes: `ENTITY_REGISTRY` from `@/components/common/entityRegistry`; `SEMANTIC_BADGE` from `@/lib/semanticTone`.
- Produces: executable invariants later tasks and module rollouts must keep green (enforced in CI via the standard vitest run).

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { ENTITY_REGISTRY } from "@/components/common/entityRegistry";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

const ALLOWED_BADGE_CLASSES = new Set<string>(Object.values(SEMANTIC_BADGE));

describe("entity registry invariants", () => {
  it("registers every entity under its own entityType", () => {
    for (const [registryKey, descriptor] of Object.entries(ENTITY_REGISTRY)) {
      expect(descriptor.entityType).toBe(registryKey);
    }
  });

  it("descriptors have unique field keys and unique table column orders", () => {
    for (const descriptor of Object.values(ENTITY_REGISTRY)) {
      const keys = descriptor.fields.map((field) => field.key);
      expect(new Set(keys).size, `${descriptor.entityType} duplicate field keys`).toBe(keys.length);
      const orders = descriptor.getTableColumns().map((column) => column.order);
      expect(new Set(orders).size, `${descriptor.entityType} duplicate table orders`).toBe(orders.length);
    }
  });

  it("badge classNames resolve only to semanticTone SSOT values", () => {
    for (const descriptor of Object.values(ENTITY_REGISTRY)) {
      for (const field of descriptor.fields) {
        for (const [variant, config] of Object.entries(field.badgeVariantMap ?? {})) {
          if (config.className) {
            expect(
              ALLOWED_BADGE_CLASSES.has(config.className),
              `${descriptor.entityType}.${field.key}.${variant} uses a non-SSOT badge class`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("drawer sections never render empty", () => {
    for (const descriptor of Object.values(ENTITY_REGISTRY)) {
      for (const section of descriptor.getDrawerSections()) {
        expect(section.fields.length, `${descriptor.entityType} section ${section.id} is empty`).toBeGreaterThan(0);
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify it passes against the baseline registry**

Run: `cd apps/frontend && npx vitest run src/components/common/entityRegistry.invariants.test.ts`
Expected: PASS on the current registry (baseline descriptors satisfy all four invariants — if one fails, fix the descriptor, never weaken the test).

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/common/entityRegistry.invariants.test.ts
git commit -m "test(frontend): entity registry SSOT invariant guards"
```

---

### Task 4: DirectoryCardMetadata Merge Mode

**Files:**
- Modify: `apps/frontend/src/components/ui/DirectoryCardMetadata.tsx`
- Test: extend `apps/frontend/src/components/ui/DirectoryCardMetadata.test.tsx`

**Interfaces:**
- Consumes: Task 2's `resolveFieldLabel` and test scaffolding.
- Produces: `DirectoryCardMetadataExtraColumns<TColumn>` interface + `extraColumns?` prop — descriptor tiles render first, legacy columns fill gaps (deduped by `keyFor`); this is the composition contract Task 5 and later modules rely on.

- [ ] **Step 1: Write the failing test** (append to `DirectoryCardMetadata.test.tsx`)

```tsx
describe("DirectoryCardMetadata merge mode", () => {
  it("renders descriptor tiles and legacy columns, deduped by key", () => {
    const html = renderToStaticMarkup(
      <DirectoryCardMetadata
        descriptor={descriptor}
        entity={{ id: "1", city: "Lahore" }}
        extraColumns={{
          columns: [{ label: "x", id: "city" }, { label: "y", id: "notes" }],
          keyFor: (col) => col.id,
          labelFor: (col) => (col.id === "notes" ? "Notes" : col.label),
          renderValue: (col) => (col.id === "notes" ? "hello notes" : null),
        }}
      />,
    );
    expect(html).toContain("Lahore");        // descriptor tile kept
    expect(html).not.toContain("Fallback City"); // legacy "city" deduped (descriptor won)
    expect(html).toContain("Notes");
    expect(html).toContain("hello notes");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/frontend && npx vitest run src/components/ui/DirectoryCardMetadata.test.tsx`
Expected: FAIL — `extraColumns` prop not implemented (TS error / prop ignored).

- [ ] **Step 3: Implement merge mode**

In `DirectoryCardMetadata.tsx`:

```tsx
export interface DirectoryCardMetadataExtraColumns<TColumn extends { label: string }> {
  columns: TColumn[];
  keyFor: (col: TColumn) => string;
  labelFor: (col: TColumn) => string;
  renderValue: (col: TColumn) => ReactNode | null;
}
```

Add to props: `extraColumns?: DirectoryCardMetadataExtraColumns<TColumn>;` — destructure it. In the descriptor branch, after building `tiles`, append:

```tsx
if (extraColumns) {
  const renderedKeys = new Set(cardFields.map((field) => field.key));
  for (const col of extraColumns.columns) {
    const colKey = extraColumns.keyFor(col);
    if (renderedKeys.has(colKey)) continue;
    const value = extraColumns.renderValue(col);
    if (value === null || value === undefined) continue;
    renderedKeys.add(colKey);
    tiles.push(
      <DirectoryCardMetaTile key={colKey} label={extraColumns.labelFor(col)}>
        {value}
      </DirectoryCardMetaTile>,
    );
  }
}
```

(`tiles` must be `const tiles: ReactNode[] = [...]` — already an array from `.map`; switch to a mutable array built the same way.)

- [ ] **Step 4: Run to verify it passes**

Run: `cd apps/frontend && npx vitest run src/components/ui/DirectoryCardMetadata.test.tsx`
Expected: PASS (both describes).

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/ui/DirectoryCardMetadata.tsx \
        apps/frontend/src/components/ui/DirectoryCardMetadata.test.tsx
git commit -m "feat(frontend): DirectoryCardMetadata merge mode (descriptor + legacy columns)"
```

---

### Task 5: Contacts Pilot — Config-Backed Descriptor in Work Cards

**Files:**
- Create: `apps/frontend/src/tenant/features/contacts/hooks/useContactEntityDescriptor.ts`
- Test: `apps/frontend/src/tenant/features/contacts/hooks/useContactEntityDescriptor.test.tsx`
- Modify: `apps/frontend/src/tenant/features/contacts/components/ContactCardMetadataGrid.tsx`
- Modify: `apps/frontend/src/tenant/features/contacts/components/ContactCardItem.tsx`

**Interfaces:**
- Consumes: Task 1 `createEntityDescriptorFromFieldConfig`; Task 2 `resolveFieldLabel` (via the descriptor fields' `labelKey`); Task 4 merge mode; `useContactConfig` from `@/lib/contexts/ContactConfigContext` (see `ContactsPageOverlays.tsx:12`); `resolveRegistryLabel`, `formatContactGenderLabel` from `@/lib/contacts/contactI18n`; `canViewContactField` from `@mms/shared`; viewerRole pattern from `useContactDetailViewModel.ts:37` (`const viewerRole = role ?? "";` — import `role` from the same hook that view model uses); `SEMANTIC_BADGE` from `@/lib/semanticTone`; `ContactMetadataGrid`'s existing legacy columns path (becomes `extraColumns`).
- Produces: `useContactEntityDescriptor(): EntityDescriptor<Contact>` — consumed now by cards; later by contacts filter chips and drawer attribute rows in follow-up plans.

- [ ] **Step 1: Write the failing hook test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useContactEntityDescriptor } from "@/tenant/features/contacts/hooks/useContactEntityDescriptor";
import type { FieldDefinition as RegistryFieldDefinition } from "@mms/shared";

const registryField = (over: Partial<RegistryFieldDefinition>): RegistryFieldDefinition => ({
  key: "k", label: "L", type: "text", enabled: true, order: 1, ...over,
});

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => `t:${key}`, dir: "ltr", language: "en" }),
}));

vi.mock("@/lib/contexts/ContactConfigContext", () => ({
  useContactConfig: () => ({
    fields: {
      identity: [
        registryField({ key: "name", order: 10 }),
        registryField({ key: "gender", type: "select", order: 20 }),
        registryField({ key: "cnic", order: 30 }),
      ],
      contact: [registryField({ key: "email", type: "email", order: 10 })],
    },
  }),
}));

// Mirror the viewerRole source used by useContactDetailViewModel.ts:37.
vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ role: "admin" }),
}));

describe("useContactEntityDescriptor", () => {
  it("builds a descriptor from the runtime config with hero fields hidden from cards", () => {
    const { result } = renderHook(() => useContactEntityDescriptor());
    const descriptor = result.current;
    expect(descriptor.entityType).toBe("contacts");
    const keys = descriptor.getCardFields().map((field) => field.key);
    expect(keys).toContain("gender");
    expect(keys).toContain("cnic");
    expect(keys).not.toContain("name");   // hero — rendered by ContactCardHeader
    expect(keys).not.toContain("email");  // face — rendered by ContactCardInfoPills
    expect(descriptor.getField("gender")?.badgeVariantMap?.male?.className).toBeTruthy();
    expect(descriptor.getField("email")?.type).toBe("email");
  });
});
```

Note: `canViewContactField` is exercised via the shared package with role `"admin"` (full view). If `useContactDetailViewModel` sources `role` from a different import than `@/lib/contexts/AuthContext`, copy that exact import instead — the mock must match the hook's real dependency.

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/frontend && npx vitest run src/tenant/features/contacts/hooks/useContactEntityDescriptor.test.tsx`
Expected: FAIL — hook does not exist.

- [ ] **Step 3: Implement the hook**

```ts
import { useMemo } from "react";
import {
  canViewContactField,
  type Contact,
  type FieldDefinition as RegistryFieldDefinition,
} from "@mms/shared";
import type { EntityDescriptor } from "@/types/entityRegistry";
import { createEntityDescriptorFromFieldConfig } from "@/components/common/entityDescriptorFromFieldConfig";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  formatContactGenderLabel,
  resolveRegistryLabel,
} from "@/lib/contacts/contactI18n";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

/** Contacts descriptor backed by the runtime FieldConfig — custom fields, permissions, i18n intact. */
export function useContactEntityDescriptor(): EntityDescriptor<Contact> {
  const { fields } = useContactConfig();
  const { role } = useAuth();
  const { t } = useTranslation();
  const viewerRole = role ?? "";

  return useMemo(
    () =>
      createEntityDescriptorFromFieldConfig<Contact>({
        entityType: "contacts",
        singularLabel: t("contacts.entity.singular"),
        pluralLabel: t("contacts.entity.plural"),
        idField: "id",
        titleField: "name",
        fieldsByTab: fields,
        resolveLabel: (field: RegistryFieldDefinition) => resolveRegistryLabel(field, t),
        canViewField: (field: RegistryFieldDefinition) => canViewContactField(viewerRole, field),
        fieldOverrides: {
          // Hero/face chrome is rendered by ContactCardHeader / ContactCardInfoPills.
          name: { cardSlot: "hidden" },
          phone: { cardSlot: "hidden" },
          email: { cardSlot: "hidden" },
          gender: {
            badgeVariantMap: {
              male: { label: formatContactGenderLabel("male", t), tone: "info", className: SEMANTIC_BADGE.info },
              female: { label: formatContactGenderLabel("female", t), tone: "secondary", className: SEMANTIC_BADGE.secondary },
            },
          },
        },
      }),
    [fields, viewerRole, t],
  );
}
```

If `contacts.entity.singular` / `contacts.entity.plural` keys do not exist in the locale files, add them to `en/ar/ur/fa` locales (find the locale files under `apps/frontend/src` — e.g. `lib/i18n` or `locales/` — following the existing contacts key file) and expect `pnpm check:i18n` (repo root) to pass. If a suitable existing key exists (search `contacts.` keys), use it instead and skip adding new ones.

- [ ] **Step 4: Wire the card metadata grid**

In `ContactCardItem.tsx`: add `const contactDescriptor = useContactEntityDescriptor();` and pass `descriptor={contactDescriptor}` + `entity={contact}` into `ContactCardMetadataGrid` (extend its props with optional `descriptor`/`entity`).

In `ContactCardMetadataGrid.tsx`: accept the optional `descriptor?: EntityDescriptor<Contact>` and `entity?: Contact` props and forward to `DirectoryCardMetadata` in merge mode — the existing legacy props (`columns/keyFor/labelFor/renderValue`) move into `extraColumns`, and the `otherColumns.length === 0` early-return only applies when no descriptor is present (guard: `if (otherColumns.length === 0 && !descriptor) return null;`). Keep `hasContactCardColumnData` / `ContactMetadataCell` exactly as-is inside `extraColumns.renderValue` — bespoke chrome is untouched.

- [ ] **Step 5: Run all contacts + component tests**

Run: `cd apps/frontend && npx vitest run src/tenant/features/contacts src/components/ui/DirectoryCardMetadata.test.tsx src/components/common`
Expected: PASS — existing contacts card tests unchanged (merge mode is additive; descriptor tiles only add registry-driven fields; hero fields are hidden via overrides so no duplicate name/phone/email tiles appear).

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/tenant/features/contacts/hooks/useContactEntityDescriptor.ts \
        apps/frontend/src/tenant/features/contacts/hooks/useContactEntityDescriptor.test.tsx \
        apps/frontend/src/tenant/features/contacts/components/ContactCardMetadataGrid.tsx \
        apps/frontend/src/tenant/features/contacts/components/ContactCardItem.tsx
git commit -m "feat(frontend): contacts Work cards render registry-backed descriptor tiles"
```

---

### Task 6: Full Gates + Green Landing

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `cd apps/frontend && pnpm typecheck`
Expected: clean.

- [ ] **Step 2: Full frontend suite**

Run: `cd apps/frontend && pnpm test:run`
Expected: all test files pass (baseline 637 + 4 new files).

- [ ] **Step 3: Lint**

Run: `cd apps/frontend && pnpm lint`
Expected: clean.

- [ ] **Step 4: Code-norm ratchets**

Run: `pnpm check:code-norms` (repo root)
Expected: all ratchets held.

- [ ] **Step 5: Report** — paste the four outputs into the sub-project completion report; if all green, the review gate for further module rollouts (spec B-6) is unlocked.
