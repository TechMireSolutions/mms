import { describe, expect, it } from "vitest";
import type { Teacher } from "@mms/shared";
import { computeTeachersSelectionTargets } from "@/tenant/features/teachers/hooks/teachersSelectionTargets";

function teacher(partial: Partial<Teacher> & { id: string }): Teacher {
  return {
    contactId: `c-${partial.id}`,
    status: "active",
    ...partial,
  } as Teacher;
}

describe("computeTeachersSelectionTargets", () => {
  it("returns empty buckets when nothing is selected", () => {
    const result = computeTeachersSelectionTargets({
      selectedIds: [],
      workTeachers: [teacher({ id: "1", phone: "+923001234567" })],
    });
    expect(result).toEqual({ waTargets: [], smsReady: [], emailReady: [] });
  });

  it("filters current-page selected rows by channel eligibility", () => {
    const withPhone = teacher({ id: "1", phone: "+923001234567" });
    const withEmail = teacher({ id: "2", email: "teacher@example.com" });
    const neither = teacher({ id: "3" });
    const result = computeTeachersSelectionTargets({
      selectedIds: ["1", "2", "3", "missing"],
      workTeachers: [withPhone, withEmail, neither],
    });

    expect(result.smsReady.map((row) => row.id)).toEqual(["1"]);
    expect(result.waTargets.map((row) => row.id)).toEqual(["1"]);
    expect(result.emailReady.map((row) => row.id)).toEqual(["2"]);
  });

  it("treats a short/landline phone as SMS-ready but not WhatsApp-capable", () => {
    const shortPhone = teacher({ id: "4", phone: "123" });
    const result = computeTeachersSelectionTargets({
      selectedIds: ["4"],
      workTeachers: [shortPhone],
    });

    expect(result.smsReady.map((row) => row.id)).toEqual(["4"]);
    expect(result.waTargets).toEqual([]);
    expect(result.emailReady).toEqual([]);
  });
});
