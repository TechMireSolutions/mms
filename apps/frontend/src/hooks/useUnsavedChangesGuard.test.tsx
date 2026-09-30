import { describe, expect, it } from "vitest";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

describe("useUnsavedChangesGuard smoke test", () => {
  it("exports useUnsavedChangesGuard as a function", () => {
    expect(typeof useUnsavedChangesGuard).toBe("function");
  });
});
