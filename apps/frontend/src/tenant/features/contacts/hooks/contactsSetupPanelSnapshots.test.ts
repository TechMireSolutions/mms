import { describe, expect, it } from "vitest";
import type { FieldDefinition, TabDefinition } from "@mms/shared";
import { fieldsSetupSnapshot } from "./contactsSetupPanelSnapshots";

const basicTab: TabDefinition = {
  key: "basic",
  label: "Basic",
  enabled: true,
  order: 0,
};

function field(partial: Partial<FieldDefinition> & { key: string }): FieldDefinition {
  return {
    label: partial.label ?? partial.key,
    type: partial.type ?? "text",
    enabled: partial.enabled ?? true,
    order: partial.order ?? 0,
    ...partial,
  } as FieldDefinition;
}

describe("fieldsSetupSnapshot", () => {
  it("treats omitted unique as equal to unique: false", () => {
    const formTabs = [basicTab];
    const withoutUnique = fieldsSetupSnapshot({
      fields: {
        basic: [field({ key: "firstName", label: "First Name", enabled: true })],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    const withUniqueFalse = fieldsSetupSnapshot({
      fields: {
        basic: [
          field({ key: "firstName", label: "First Name", enabled: true, unique: false }),
        ],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    expect(withoutUnique).toBe(withUniqueFalse);
  });

  it("ignores orphan field tabs not listed in formTabs", () => {
    const formTabs = [basicTab];
    const base = fieldsSetupSnapshot({
      fields: {
        basic: [field({ key: "firstName", enabled: true })],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    const withOrphan = fieldsSetupSnapshot({
      fields: {
        basic: [field({ key: "firstName", enabled: true })],
        ghost: [field({ key: "gone", enabled: true })],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    expect(withOrphan).toBe(base);
  });

  it("detects a real enabled toggle as dirty", () => {
    const formTabs = [basicTab];
    const enabled = fieldsSetupSnapshot({
      fields: {
        basic: [field({ key: "firstName", enabled: true })],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    const disabled = fieldsSetupSnapshot({
      fields: {
        basic: [field({ key: "firstName", enabled: false })],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    expect(enabled).not.toBe(disabled);
  });

  it("treats absolute order renumbering as equal when relative order matches", () => {
    const formTabs = [basicTab];
    const sparse = fieldsSetupSnapshot({
      fields: {
        basic: [
          field({ key: "a", order: 10, enabled: true }),
          field({ key: "b", order: 20, enabled: true }),
        ],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    const dense = fieldsSetupSnapshot({
      fields: {
        basic: [
          field({ key: "a", order: 0, enabled: true }),
          field({ key: "b", order: 1, enabled: true }),
        ],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    expect(sparse).toBe(dense);
  });

  it("detects a real reorder as dirty", () => {
    const formTabs = [basicTab];
    const first = fieldsSetupSnapshot({
      fields: {
        basic: [
          field({ key: "a", order: 0, enabled: true }),
          field({ key: "b", order: 1, enabled: true }),
        ],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    const swapped = fieldsSetupSnapshot({
      fields: {
        basic: [
          field({ key: "b", order: 0, enabled: true }),
          field({ key: "a", order: 1, enabled: true }),
        ],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    expect(first).not.toBe(swapped);
  });
});
