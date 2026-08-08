import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "@mms/shared";
import {
  formatStudentListCustomValue,
  studentCustomFieldKeyFromColumn,
} from "@/tenant/features/students/components/studentListCustomColumns";

const t = (key: "common.yes" | "common.no" | "students.table.emptyDash"): string => {
  switch (key) {
    case "common.yes":
      return "Yes";
    case "common.no":
      return "No";
    default:
      return "—";
  }
};

describe("formatStudentListCustomValue", () => {
  it("returns null for nullish and blank values", () => {
    expect(formatStudentListCustomValue(null, t)).toBeNull();
    expect(formatStudentListCustomValue(undefined, t)).toBeNull();
    expect(formatStudentListCustomValue("", t)).toBeNull();
    expect(formatStudentListCustomValue("   ", t)).toBeNull();
  });

  it("joins array values with a comma", () => {
    expect(formatStudentListCustomValue(["a", "b"], t)).toBe("a, b");
    expect(formatStudentListCustomValue(["a", ""], t)).toBe("a");
    expect(formatStudentListCustomValue([], t)).toBeNull();
  });

  it("renders booleans via translation", () => {
    expect(formatStudentListCustomValue(true, t)).toBe("Yes");
    expect(formatStudentListCustomValue(false, t)).toBe("No");
  });

  it("formats date/datetime strings via regex detection", () => {
    expect(formatStudentListCustomValue("2020-01-02", t)).toBe(formatDate("2020-01-02", true));
    expect(formatStudentListCustomValue("2020-01-02T10:00:00", t)).toBe(
      formatDateTime("2020-01-02T10:00:00", true),
    );
  });

  it("honors an explicit type override", () => {
    expect(formatStudentListCustomValue("2020-01-02", t, "datetime")).toBe(
      formatDateTime("2020-01-02", true),
    );
    expect(formatStudentListCustomValue("plain", t, "text")).toBe("plain");
  });

  it("falls back to String() for other values", () => {
    expect(formatStudentListCustomValue(42, t)).toBe("42");
    expect(formatStudentListCustomValue("hello", t)).toBe("hello");
  });
});

describe("studentCustomFieldKeyFromColumn", () => {
  it("extracts the key from a custom column", () => {
    expect(studentCustomFieldKeyFromColumn("custom:grade")).toBe("grade");
  });

  it("returns null for non-custom columns", () => {
    expect(studentCustomFieldKeyFromColumn("dob")).toBeNull();
    expect(studentCustomFieldKeyFromColumn("custom:")).toBe("");
  });
});
