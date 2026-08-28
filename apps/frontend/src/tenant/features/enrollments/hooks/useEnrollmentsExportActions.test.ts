import { describe, expect, it } from "vitest";
import { defaultEnrollmentsExportColumns } from "./useEnrollmentsExportActions";

describe("useEnrollmentsExportActions utilities", () => {
  it("generates default export columns correctly", () => {
    const columns = defaultEnrollmentsExportColumns((key) => key);
    expect(columns.length).toBe(7);
    expect(columns[0]).toEqual({
      id: "studentName",
      label: "enrollments.columns.student",
    });
  });
});
