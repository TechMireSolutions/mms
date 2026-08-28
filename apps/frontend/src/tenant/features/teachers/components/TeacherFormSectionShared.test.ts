import { describe, expect, it } from "vitest";
import { resolveTeacherFieldLabel } from "./TeacherFormSectionShared";

describe("TeacherFormSectionShared", () => {
  it("resolves teacher field label from custom/tab fields or seed fields", () => {
    const fields = {
      employment: [
        {
          key: "specialization",
          label: "Specialization",
          type: "text" as const,
          enabled: true,
          order: 0,
        },
      ],
    };
    const t = (key: string) => key;

    expect(
      resolveTeacherFieldLabel(fields, "employment", "specialization", t as never),
    ).toBe("Specialization");

    expect(
      resolveTeacherFieldLabel(fields, "employment", "employeeId", t as never),
    ).toBe("teachers.field.employeeId");
  });
});
