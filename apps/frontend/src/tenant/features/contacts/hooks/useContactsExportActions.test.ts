import { describe, expect, it } from "vitest";
import {
  defaultContactsExportColumns,
  resolveContactsExportColumns,
} from "./useContactsExportActions";

describe("contacts export column helpers", () => {
  const fakeT = (key: string) => `translated:${key}`;

  it("defaultContactsExportColumns returns translated default columns", () => {
    const columns = defaultContactsExportColumns(fakeT);
    expect(columns.length).toBeGreaterThan(0);
    expect(columns[0]).toEqual({
      id: "name",
      label: "translated:contacts.columns.name",
    });
  });

  it("resolveContactsExportColumns maps valid columns and sanitizes labels", () => {
    const input = [
      { id: "name", label: "Full Name" },
      { key: "phone", label: "Mobile" },
      { id: "city", labelKey: "contacts.columns.city" as const },
      { id: "   ", label: "Empty ID" },
      { id: "valid", label: "   " },
    ];

    const result = resolveContactsExportColumns(input, fakeT);
    expect(result).toEqual([
      { id: "name", label: "Full Name" },
      { id: "phone", label: "Mobile" },
      { id: "city", label: "translated:contacts.columns.city" },
      { id: "valid", label: "valid" },
    ]);
  });

  it("resolveContactsExportColumns falls back to defaults when list is empty", () => {
    const result = resolveContactsExportColumns([], fakeT);
    expect(result).toEqual(defaultContactsExportColumns(fakeT));
  });

  it("resolveContactsExportColumns caps columns at 50", () => {
    const input = Array.from({ length: 60 }, (_, i) => ({
      id: `col_${i}`,
      label: `Col ${i}`,
    }));
    const result = resolveContactsExportColumns(input, fakeT);
    expect(result).toHaveLength(50);
  });
});
