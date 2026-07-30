import { describe, expect, it } from "vitest";
import {
  ATTENDANCE_TAB_REGISTRY,
  INITIAL_ATTENDANCE_FIELD_SEED,
  INITIAL_STUDENT_FIELD_SEED,
  STUDENT_TAB_REGISTRY,
} from "./moduleFieldSetupDefaults.js";

describe("moduleFieldSetupDefaults", () => {
  it("keeps student setup tabs system-owned with matching field seeds", () => {
    expect(STUDENT_TAB_REGISTRY.every((tab) => tab.isSystem)).toBe(true);
    expect(Object.keys(INITIAL_STUDENT_FIELD_SEED).sort()).toEqual(
      STUDENT_TAB_REGISTRY.map((tab) => tab.key).sort(),
    );
  });

  it("seeds attendance status as a required select field", () => {
    expect(ATTENDANCE_TAB_REGISTRY).toHaveLength(1);
    const status = INITIAL_ATTENDANCE_FIELD_SEED.basic?.find((field) => field.key === "status");
    expect(status?.required).toBe(true);
    expect(status?.type).toBe("select");
  });
});
