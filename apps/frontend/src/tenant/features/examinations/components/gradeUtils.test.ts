import { describe, expect, it } from "vitest";
import { getGrade, getRankSuffix } from "./gradeUtils";

describe("gradeUtils", () => {
  it("computes grade information from percentage", () => {
    const gradeA = getGrade(95);
    expect(gradeA.label).toBe("A+");

    const gradeF = getGrade(30);
    expect(gradeF.label).toBe("F");
  });

  it("computes ordinal suffix for ranks", () => {
    expect(getRankSuffix(1)).toBe("st");
    expect(getRankSuffix(2)).toBe("nd");
    expect(getRankSuffix(3)).toBe("rd");
    expect(getRankSuffix(4)).toBe("th");
  });
});
