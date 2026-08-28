import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeachersPageHeaderActions } from "./TeachersPageHeaderActions";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TeachersPageHeaderActions Component", () => {
  it("renders export and add teacher buttons when canExport and canWrite are true", () => {
    const html = renderToStaticMarkup(
      <TeachersPageHeaderActions
        canExport={true}
        canWrite={true}
        viewingDeleted={false}
        onExport={vi.fn()}
        onAddTeacher={vi.fn()}
      />,
    );

    expect(html).toContain("common.export");
    expect(html).toContain("action.addTeacher");
  });

  it("hides buttons when viewingDeleted is true", () => {
    const html = renderToStaticMarkup(
      <TeachersPageHeaderActions
        canExport={true}
        canWrite={true}
        viewingDeleted={true}
        onExport={vi.fn()}
        onAddTeacher={vi.fn()}
      />,
    );

    expect(html).not.toContain("common.export");
    expect(html).not.toContain("action.addTeacher");
  });
});
