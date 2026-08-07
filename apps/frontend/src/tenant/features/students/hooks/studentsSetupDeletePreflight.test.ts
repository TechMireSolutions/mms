import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_STUDENTS_SETTINGS, type StudentsSettings } from "@mms/shared";
import {
  preflightStudentFieldDelete,
  preflightStudentFieldsDelete,
} from "@/tenant/features/students/hooks/studentsSetupDeletePreflight";

const apiJson = vi.hoisted(() => vi.fn());

vi.mock("@/lib/apiClient", () => ({
  apiJson,
}));

function baseSettings(overrides?: Partial<StudentsSettings>): StudentsSettings {
  return {
    ...DEFAULT_STUDENTS_SETTINGS,
    columnRegistry: [],
    fields: {
      custom: [{ key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 }],
    },
    ...overrides,
  };
}

describe("preflightStudentFieldDelete", () => {
  beforeEach(() => {
    apiJson.mockReset();
    apiJson.mockResolvedValue({ count: 0 });
  });

  it("blocks seed / system fields without calling usage API", async () => {
    const onBlocked = vi.fn();
    const allowed = await preflightStudentFieldDelete("dob", {
      settings: baseSettings(),
      fieldsDraft: {
        buildFieldsMap: () => ({
          registration: [{ key: "dob", label: "DOB", type: "date", enabled: true, order: 0 }],
        }),
        enabledTabs: ["registration"],
      },
      onBlocked,
    });

    expect(allowed).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith("students.setup.cannotDeleteSystemField", undefined);
    expect(apiJson).not.toHaveBeenCalled();
  });

  it("allows delete when no column deps and usage is zero", async () => {
    const onBlocked = vi.fn();
    const allowed = await preflightStudentFieldDelete("customNotes", {
      settings: baseSettings(),
      fieldsDraft: {
        buildFieldsMap: () => ({
          custom: [{ key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 }],
        }),
        enabledTabs: ["registration", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(true);
    expect(onBlocked).not.toHaveBeenCalled();
    expect(apiJson).toHaveBeenCalledOnce();
  });

  it("blocks when live usage count is positive", async () => {
    apiJson.mockResolvedValueOnce({ count: 3 });
    const onBlocked = vi.fn();
    const allowed = await preflightStudentFieldDelete("customNotes", {
      settings: baseSettings(),
      fieldsDraft: {
        buildFieldsMap: () => ({
          custom: [{ key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 }],
        }),
        enabledTabs: ["registration", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith("students.setup.fieldHasStudentData", { count: 3 });
  });

  it("batch preflight posts once for multiple fields", async () => {
    apiJson.mockResolvedValueOnce({ counts: { customNotes: 0, customTag: 0 } });
    const onBlocked = vi.fn();
    const allowed = await preflightStudentFieldsDelete(["customNotes", "customTag"], {
      settings: baseSettings(),
      fieldsDraft: {
        buildFieldsMap: () => ({
          custom: [
            { key: "customNotes", label: "Notes", type: "text", enabled: true, order: 0 },
            { key: "customTag", label: "Tag", type: "text", enabled: true, order: 1 },
          ],
        }),
        enabledTabs: ["registration", "custom"],
      },
      onBlocked,
    });

    expect(allowed).toBe(true);
    expect(apiJson).toHaveBeenCalledOnce();
    expect(String(apiJson.mock.calls[0]?.[0])).toContain("/field-usage");
  });
});
