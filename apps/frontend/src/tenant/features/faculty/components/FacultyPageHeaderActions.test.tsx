import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyPageHeaderActions } from "./FacultyPageHeaderActions";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FacultyPageHeaderActions Component", () => {
  it("renders export and add faculty buttons when canExport and canWrite are true", () => {
    const html = renderToStaticMarkup(
      <FacultyPageHeaderActions
        canExport={true}
        canWrite={true}
        viewingDeleted={false}
        onExport={vi.fn()}
        onAddFaculty={vi.fn()}
      />,
    );

    expect(html).toContain("common.export");
    expect(html).toContain("action.addFaculty");
  });

  it("hides buttons when viewingDeleted is true", () => {
    const html = renderToStaticMarkup(
      <FacultyPageHeaderActions
        canExport={true}
        canWrite={true}
        viewingDeleted={true}
        onExport={vi.fn()}
        onAddFaculty={vi.fn()}
      />,
    );

    expect(html).not.toContain("common.export");
    expect(html).not.toContain("action.addFaculty");
  });
});
