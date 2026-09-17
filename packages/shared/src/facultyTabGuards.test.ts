import { describe, expect, it } from "vitest";
import {
  TEACHERS_TAB_REGISTRY,
  isTeacherLockedEnabledTab,
  isTeacherSeedFormTab,
} from "./moduleFieldSetupPersons.js";

describe("teacher seed / locked tab helpers", () => {
  it("treats registry keys as seed tabs", () => {
    expect(isTeacherSeedFormTab("basic")).toBe(true);
    expect(isTeacherSeedFormTab("Employment")).toBe(true);
    expect(isTeacherSeedFormTab("custom_foo")).toBe(false);
    expect(TEACHERS_TAB_REGISTRY.every((tab) => isTeacherSeedFormTab(tab.key))).toBe(true);
  });

  it("locks only basic as always-enabled", () => {
    expect(isTeacherLockedEnabledTab("basic")).toBe(true);
    expect(isTeacherLockedEnabledTab("Basic")).toBe(true);
    expect(isTeacherLockedEnabledTab("employment")).toBe(false);
  });
});
