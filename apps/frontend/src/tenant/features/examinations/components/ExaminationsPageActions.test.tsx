import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ExaminationsPageActions } from "./ExaminationsPageActions";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ExaminationsPageActions Component", () => {
  it("renders enter marks and new exam buttons when canWrite is true and not deleted", () => {
    const html = renderToStaticMarkup(
      <ExaminationsPageActions
        canWrite={true}
        showDeleted={false}
        onEnterMarks={vi.fn()}
        onCreateExam={vi.fn()}
      />,
    );

    expect(html).toContain("examinations.marks");
    expect(html).toContain("examinations.newExam");
  });

  it("renders empty container when showDeleted is true", () => {
    const html = renderToStaticMarkup(
      <ExaminationsPageActions
        canWrite={true}
        showDeleted={true}
        onEnterMarks={vi.fn()}
        onCreateExam={vi.fn()}
      />,
    );

    expect(html).not.toContain("examinations.newExam");
  });
});
