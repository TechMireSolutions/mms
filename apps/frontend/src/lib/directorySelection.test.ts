import { describe, expect, it } from "vitest";
import {
  getDirectoryPageSelection,
  toggleIdInSelection,
  togglePageIdsInSelection,
} from "@/lib/directorySelection";

describe("directorySelection", () => {
  it("reports page selection flags", () => {
    expect(getDirectoryPageSelection(["a", "b"], ["a"])).toEqual({
      allSelected: false,
      someSelected: true,
      selectedOnPage: 1,
    });
    expect(getDirectoryPageSelection(["a", "b"], ["a", "b", "c"])).toEqual({
      allSelected: true,
      someSelected: false,
      selectedOnPage: 2,
    });
  });

  it("toggles a single id", () => {
    expect(toggleIdInSelection(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleIdInSelection(["a", "b"], "a")).toEqual(["b"]);
  });

  it("merges and removes page ids without dropping other pages", () => {
    expect(togglePageIdsInSelection(["x"], ["a", "b"])).toEqual(["x", "a", "b"]);
    expect(togglePageIdsInSelection(["x", "a", "b"], ["a", "b"])).toEqual(["x"]);
  });
});
