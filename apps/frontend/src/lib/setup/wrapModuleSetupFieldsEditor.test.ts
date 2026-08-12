import { describe, expect, it, vi } from "vitest";
import { wrapModuleSetupFieldsEditor } from "./wrapModuleSetupFieldsEditor";

describe("wrapModuleSetupFieldsEditor", () => {
  it("wraps valid fieldsEditor without throwing", () => {
    const mockFieldsEditor = {
      formTabs: [{ key: "basic", label: "Basic", enabled: true }],
      tabFields: {
        basic: [{ key: "name", label: "Name", type: "text", required: true, enabled: true }],
      },
      enabledTabs: new Set(["basic"]),
      requiredTabs: new Set(["basic"]),
      buildFieldsMap: () => ({}),
      markDraftPristine: () => {},
      handleDeleteField: vi.fn(),
      handleDeleteTab: vi.fn(),
      setFormTabs: vi.fn(),
      setTabFields: vi.fn(),
      setEnabledTabs: vi.fn(),
      setRequiredTabs: vi.fn(),
      tabFieldEnabled: {},
      tabFieldRequired: {},
      tabFieldUnique: {},
      tabFieldDefaultValues: {},
      tabFieldPermissions: {},
      tabFieldOrder: {},
      isDraftDirty: () => false,
      toggleTabEnabled: vi.fn(),
      toggleTabRequired: vi.fn(),
      toggleFieldEnabled: vi.fn(),
      toggleFieldRequired: vi.fn(),
      toggleFieldUnique: vi.fn(),
      handleReorder: vi.fn(),
      resetAllState: vi.fn(),
      handleCustomFieldsChange: vi.fn(),
      handleEditField: vi.fn(),
      handleAddTab: vi.fn(),
      handleRenameTab: vi.fn(),
    };

    const wrapped = wrapModuleSetupFieldsEditor({
      fieldsEditor: mockFieldsEditor as any,
      handleDeleteField: mockFieldsEditor.handleDeleteField as any,
      handleDeleteTab: mockFieldsEditor.handleDeleteTab as any,
      getSeedTab: () => ({ key: "basic", label: "Basic" }) as any,
      initialFieldSeed: { basic: [{ key: "name", label: "Name", type: "text", required: true, enabled: true }] as any },
      isLockedTab: (key) => key === "basic",
    });

    expect(wrapped.formTabs).toHaveLength(1);
    expect(wrapped.tabFields.basic).toHaveLength(1);
  });

  it("safely handles nullish or non-array formTabs and tabFields entries without throwing n.map is not a function", () => {
    const mockFieldsEditor = {
      formTabs: null as any,
      tabFields: {
        basic: undefined as any,
        custom: {} as any,
      },
      enabledTabs: new Set(),
      requiredTabs: new Set(),
      buildFieldsMap: () => ({}),
      markDraftPristine: () => {},
      handleDeleteField: vi.fn(),
      handleDeleteTab: vi.fn(),
    };

    const wrapped = wrapModuleSetupFieldsEditor({
      fieldsEditor: mockFieldsEditor as any,
      handleDeleteField: mockFieldsEditor.handleDeleteField as any,
      handleDeleteTab: mockFieldsEditor.handleDeleteTab as any,
      getSeedTab: () => undefined,
      initialFieldSeed: {} as any,
      isLockedTab: () => false,
    });

    expect(wrapped.formTabs).toEqual([]);
    expect(wrapped.tabFields.basic).toEqual([]);
    expect(wrapped.tabFields.custom).toEqual([]);
  });

  it("restores seed labelKey/descriptionKey and forces locked tabs enabled", () => {
    const mockFieldsEditor = {
      formTabs: [
        { key: "basic", label: "Basic Setup", enabled: false },
        { key: "custom", label: "Custom Setup", enabled: false },
      ],
      tabFields: {
        basic: [{ key: "name", label: "Full Name", type: "text", required: true, enabled: true }],
      },
      enabledTabs: new Set(["basic"]),
      requiredTabs: new Set(["basic"]),
      buildFieldsMap: () => ({}),
      markDraftPristine: () => {},
      handleDeleteField: vi.fn(),
      handleDeleteTab: vi.fn(),
    };

    const wrapped = wrapModuleSetupFieldsEditor({
      fieldsEditor: mockFieldsEditor as any,
      handleDeleteField: mockFieldsEditor.handleDeleteField as any,
      handleDeleteTab: mockFieldsEditor.handleDeleteTab as any,
      getSeedTab: (key) =>
        key === "basic"
          ? ({ key: "basic", label: "Basic", labelKey: "module.basic.label" } as any)
          : undefined,
      initialFieldSeed: {
        basic: [
          {
            key: "name",
            label: "Full Name",
            labelKey: "module.basic.name.label",
            descriptionKey: "module.basic.name.desc",
            type: "text",
            required: true,
            enabled: true,
          } as any,
        ],
      },
      isLockedTab: (key) => key === "basic",
    });

    // Basic tab is locked, so enabled is forced to true and labelKey is restored from seed
    expect(wrapped.formTabs[0]?.enabled).toBe(true);
    expect(wrapped.formTabs[0]?.labelKey).toBe("module.basic.label");

    // Custom tab is not locked, so enabled stays false
    expect(wrapped.formTabs[1]?.enabled).toBe(false);

    // Field labelKey and descriptionKey are restored from seed
    expect(wrapped.tabFields.basic[0]?.labelKey).toBe("module.basic.name.label");
    expect(wrapped.tabFields.basic[0]?.descriptionKey).toBe("module.basic.name.desc");
  });
});

