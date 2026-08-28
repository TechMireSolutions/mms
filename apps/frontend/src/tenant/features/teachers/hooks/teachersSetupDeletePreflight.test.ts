import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TEACHERS_SETTINGS, type TeachersSettings } from "@mms/shared";
import {
  preflightTeacherFieldDelete,
  preflightTeacherFieldsDelete,
} from "@/tenant/features/teachers/hooks/teachersSetupDeletePreflight";

const apiJson = vi.hoisted(() => vi.fn());

vi.mock("@/lib/apiClient", () => ({
  apiJson,
}));

function baseSettings(overrides?: Partial<TeachersSettings>): TeachersSettings {
  return {
    ...DEFAULT_TEACHERS_SETTINGS,
    columnRegistry: [],
    fields: {
      custom: [{ key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 }],
    },
    ...overrides,
  };
}

describe("preflightTeacherFieldDelete", () => {
  beforeEach(() => {
    apiJson.mockReset();
    apiJson.mockResolvedValue({ count: 0 });
  });

  it("blocks seed / system fields without calling usage API", async () => {
    const onBlocked = vi.fn();
    const allowed = await preflightTeacherFieldDelete("employeeId", {
      settings: baseSettings(),
      fieldsDraft: {
        buildFieldsMap: () => ({
          employment: [{ key: "employeeId", label: "Employee ID", type: "text", enabled: true, order: 0 }],
        }),
        enabledTabs: ["employment"],
      },
      onBlocked,
    });

    expect(allowed).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith("teachers.setup.cannotDeleteSystemField", undefined);
    expect(apiJson).not.toHaveBeenCalled();
  });

  it("allows delete when no column deps and usage is zero", async () => {
    const onBlocked = vi.fn();
    const allowed = await preflightTeacherFieldDelete("customNotes", {
      settings: baseSettings(),
      fieldsDraft: {
        buildFieldsMap: () => ({
          custom: [{ key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 }],
        }),
        enabledTabs: ["employment", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(true);
    expect(onBlocked).not.toHaveBeenCalled();
    expect(apiJson).toHaveBeenCalledOnce();
  });

  it("blocks when live usage count is positive", async () => {
    apiJson.mockResolvedValueOnce({ count: 2 });
    const onBlocked = vi.fn();
    const allowed = await preflightTeacherFieldDelete("customNotes", {
      settings: baseSettings(),
      fieldsDraft: {
        buildFieldsMap: () => ({
          custom: [{ key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 }],
        }),
        enabledTabs: ["employment", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith("teachers.setup.fieldHasTeacherData", { count: 2 });
  });

  it("batch preflight posts once for multiple fields", async () => {
    apiJson.mockResolvedValueOnce({ counts: { customNotes: 0, customTag: 0 } });
    const onBlocked = vi.fn();
    const allowed = await preflightTeacherFieldsDelete(["customNotes", "customTag"], {
      settings: baseSettings(),
      fieldsDraft: {
        buildFieldsMap: () => ({
          custom: [
            { key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 },
            { key: "customTag", label: "Tag", type: "text", enabled: true, order: 1 },
          ],
        }),
        enabledTabs: ["employment", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(true);
    expect(apiJson).toHaveBeenCalledOnce();
    expect(String(apiJson.mock.calls[0]?.[0])).toContain("/field-usage");
  });
});
