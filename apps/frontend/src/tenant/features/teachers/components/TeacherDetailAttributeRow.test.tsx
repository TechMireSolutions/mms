import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BookOpen } from "lucide-react";
import { TeacherDetailAttributeRow } from "./TeacherDetailAttributeRow";

describe("TeacherDetailAttributeRow Component", () => {
  it("renders label and value with icon", () => {
    const html = renderToStaticMarkup(
      <TeacherDetailAttributeRow
        icon={BookOpen}
        label="Department"
        value="Islamic Studies"
      />,
    );

    expect(html).toContain("Department");
    expect(html).toContain("Islamic Studies");
  });
});
