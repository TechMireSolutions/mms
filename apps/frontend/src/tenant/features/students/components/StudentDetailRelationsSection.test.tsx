import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StudentDetailRelationsSection } from "./StudentDetailRelationsSection";
import type { StudentRelationshipCardData } from "./StudentRelationshipCard";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockRel: StudentRelationshipCardData = {
  key: "rel-1",
  contactId: "cnt-guardian-1",
  name: "Ibrahim Harith",
  gender: "male",
  relationship: "father",
  relationshipLabel: "Father",
  badgeCode: "FAT",
  badgeTone: "bg-blue-100 text-blue-800",
  phones: [{ number: "+1 555-0199", isPrimary: true, label: "Mobile" }],
  emails: [],
};

describe("StudentDetailRelationsSection Component", () => {
  it("renders relationships list section with total count", () => {
    const html = renderToStaticMarkup(
      <StudentDetailRelationsSection
        relationships={[mockRel]}
        canMessage={true}
      />,
    );

    expect(html).toContain("students.detail.allRelationships");
    expect(html).toContain("Ibrahim Harith");
    expect(html).toContain("FAT");
  });

  it("returns null when relationships array is empty", () => {
    const html = renderToStaticMarkup(
      <StudentDetailRelationsSection
        relationships={[]}
      />,
    );

    expect(html).toBe("");
  });
});
