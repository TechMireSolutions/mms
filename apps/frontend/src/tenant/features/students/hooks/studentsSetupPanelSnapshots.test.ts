import { describe, expect, it } from "vitest";
import type { FieldDefinition, TabDefinition } from "@mms/shared";
import { studentsFieldsSetupSnapshot } from "./studentsSetupPanelSnapshots";

const basicTab: TabDefinition = {
  key: "basic",
  label: "Identity",
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

describe("studentsFieldsSetupSnapshot", () => {
  it("treats omitted unique as equal to unique: false", () => {
    const formTabs = [basicTab];
    const withoutUnique = studentsFieldsSetupSnapshot({
      fields: {
        basic: [field({ key: "contactId", label: "Contact", enabled: true })],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    const withUniqueFalse = studentsFieldsSetupSnapshot({
      fields: {
        basic: [
          field({ key: "contactId", label: "Contact", enabled: true, unique: false }),
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
    const base = studentsFieldsSetupSnapshot({
      fields: {
        basic: [field({ key: "contactId", enabled: true })],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    const withOrphan = studentsFieldsSetupSnapshot({
      fields: {
        basic: [field({ key: "contactId", enabled: true })],
        ghost: [field({ key: "gone", enabled: true })],
      },
      enabledTabs: ["basic"],
      requiredTabs: [],
      formTabs,
    });
    expect(withOrphan).toBe(base);
  });

  it("always includes locked basic tab in enabled set", () => {
    const snap = studentsFieldsSetupSnapshot({
      fields: { basic: [field({ key: "contactId", enabled: true })] },
      enabledTabs: ["registration"],
      requiredTabs: [],
      formTabs: [
        basicTab,
        { key: "registration", label: "Registration", enabled: true, order: 1 },
      ],
    });
    expect(JSON.parse(snap).enabled).toEqual(["basic", "registration"]);
  });
});
