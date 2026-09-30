import { describe, expect, it } from "vitest";
import {
  FACULTY_TAB_REGISTRY,
  isFacultyLockedEnabledTab,
  isFacultySeedFormTab,
} from "./moduleFieldSetupFaculty.js";

describe("faculty seed / locked tab helpers", () => {
  it("treats registry keys as seed tabs", () => {
    expect(isFacultySeedFormTab("basic")).toBe(true);
    expect(isFacultySeedFormTab("Employment")).toBe(true);
    expect(isFacultySeedFormTab("custom_foo")).toBe(false);
    expect(FACULTY_TAB_REGISTRY.every((tab) => isFacultySeedFormTab(tab.key))).toBe(true);
  });

  it("locks only basic as always-enabled", () => {
    expect(isFacultyLockedEnabledTab("basic")).toBe(true);
    expect(isFacultyLockedEnabledTab("Basic")).toBe(true);
    expect(isFacultyLockedEnabledTab("employment")).toBe(false);
  });
});
