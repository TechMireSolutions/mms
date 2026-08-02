import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_COLUMN_REGISTRY,
  CONFIG_VERSION,
  type ContactPreferences,
  type FieldConfig,
} from "@mms/shared";
import {
  preflightContactFieldDelete,
  preflightContactFieldsDelete,
} from "@/tenant/features/contacts/hooks/contactsSetupDeletePreflight";

const apiJson = vi.hoisted(() => vi.fn());

vi.mock("@/lib/apiClient", () => ({
  apiJson,
}));

const emptyPrefs: Pick<ContactPreferences, "duplicateDetectionFields"> = {
  duplicateDetectionFields: [],
};

function baseConfig(overrides?: Partial<FieldConfig>): FieldConfig {
  return {
    version: CONFIG_VERSION,
    enabledTabs: ["basic", "custom"],
    requiredTabs: [],
    fields: {
      custom: [{ key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 }],
    },
    columnRegistry: DEFAULT_COLUMN_REGISTRY,
    ...overrides,
  };
}

describe("preflightContactFieldDelete", () => {
  beforeEach(() => {
    apiJson.mockReset();
    apiJson.mockResolvedValue({ count: 0 });
  });

  it("blocks seed / system fields without calling usage API", async () => {
    const onBlocked = vi.fn();
    const allowed = await preflightContactFieldDelete("firstName", {
      config: baseConfig(),
      contextPrefs: emptyPrefs,
      fieldsDraft: {
        buildFieldsMap: () => ({
          basic: [{ key: "firstName", label: "First", type: "text", enabled: true, order: 0 }],
        }),
        enabledTabs: ["basic", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith("contacts.setup.cannotDeleteSystemField", undefined);
    expect(apiJson).not.toHaveBeenCalled();
  });

  it("allows delete when no column/prefs deps and usage is zero", async () => {
    const onBlocked = vi.fn();
    const allowed = await preflightContactFieldDelete("customNotes", {
      config: baseConfig({ columnRegistry: [] }),
      contextPrefs: emptyPrefs,
      fieldsDraft: {
        buildFieldsMap: () => ({
          custom: [{ key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 }],
        }),
        enabledTabs: ["basic", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(true);
    expect(onBlocked).not.toHaveBeenCalled();
    expect(apiJson).toHaveBeenCalledOnce();
  });

  it("clears matching draft columns so delete is not blocked by persisted column enablement", async () => {
    const onBlocked = vi.fn();
    const allowed = await preflightContactFieldDelete("customNotes", {
      config: baseConfig({
        columnRegistry: [
          {
            key: "customNotes",
            label: "Notes",
            enabled: true,
            order: 99,
          },
        ],
      }),
      contextPrefs: emptyPrefs,
      fieldsDraft: {
        buildFieldsMap: () => ({
          custom: [{ key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 }],
        }),
        enabledTabs: ["basic", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(true);
    expect(onBlocked).not.toHaveBeenCalled();
    expect(apiJson).toHaveBeenCalledOnce();
  });

  it("blocks when field-usage reports contacts with data", async () => {
    apiJson.mockResolvedValue({ count: 3 });
    const onBlocked = vi.fn();
    const allowed = await preflightContactFieldDelete("customNotes", {
      config: baseConfig({ columnRegistry: [] }),
      contextPrefs: emptyPrefs,
      fieldsDraft: {
        buildFieldsMap: () => ({
          custom: [{ key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 }],
        }),
        enabledTabs: ["basic", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith("contacts.setup.fieldHasContactData", { count: 3 });
  });

  it("blocks with saveFailed when usage API errors", async () => {
    apiJson.mockRejectedValue(new Error("network"));
    const onBlocked = vi.fn();
    const allowed = await preflightContactFieldDelete("customNotes", {
      config: baseConfig({ columnRegistry: [] }),
      contextPrefs: emptyPrefs,
      fieldsDraft: {
        buildFieldsMap: () => ({
          custom: [{ key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 }],
        }),
        enabledTabs: ["basic", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith("contacts.saveFailed", undefined);
  });
});

describe("preflightContactFieldsDelete", () => {
  const fieldsDraft = {
    buildFieldsMap: () => ({
      custom: [
        { key: "a", label: "A", type: "text" as const, enabled: true, order: 0 },
        { key: "b", label: "B", type: "text" as const, enabled: true, order: 1 },
        { key: "c", label: "C", type: "text" as const, enabled: true, order: 2 },
      ],
    }),
    enabledTabs: ["basic", "custom"],
  };

  beforeEach(() => {
    apiJson.mockReset();
  });

  it("uses one batch POST and allows when all counts are zero", async () => {
    apiJson.mockResolvedValue({ counts: { a: 0, b: 0, c: 0 } });
    const onBlocked = vi.fn();
    const allowed = await preflightContactFieldsDelete(["a", "b", "c"], {
      config: baseConfig({ columnRegistry: [] }),
      contextPrefs: emptyPrefs,
      fieldsDraft,
      onBlocked,
    });

    expect(allowed).toBe(true);
    expect(onBlocked).not.toHaveBeenCalled();
    expect(apiJson).toHaveBeenCalledOnce();
    expect(apiJson).toHaveBeenCalledWith(
      expect.stringContaining("/field-usage"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ fieldKeys: ["a", "b", "c"] }),
      }),
    );
  });

  it("notifies once when batch reports a field with contact data", async () => {
    apiJson.mockResolvedValue({ counts: { a: 0, b: 2, c: 0 } });
    const onBlocked = vi.fn();
    const allowed = await preflightContactFieldsDelete(["a", "b", "c"], {
      config: baseConfig({ columnRegistry: [] }),
      contextPrefs: emptyPrefs,
      fieldsDraft,
      onBlocked,
    });

    expect(allowed).toBe(false);
    expect(onBlocked).toHaveBeenCalledTimes(1);
    expect(onBlocked).toHaveBeenCalledWith("contacts.setup.fieldHasContactData", { count: 2 });
  });

  it("blocks on sync deps before any usage API calls", async () => {
    const onBlocked = vi.fn();
    const allowed = await preflightContactFieldsDelete(["firstName", "a"], {
      config: baseConfig({ columnRegistry: [] }),
      contextPrefs: emptyPrefs,
      fieldsDraft: {
        buildFieldsMap: () => ({
          basic: [{ key: "firstName", label: "First", type: "text", enabled: true, order: 0 }],
          custom: [{ key: "a", label: "A", type: "text", enabled: true, order: 0 }],
        }),
        enabledTabs: ["basic", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith("contacts.setup.cannotDeleteSystemField", undefined);
    expect(apiJson).not.toHaveBeenCalled();
  });
});
