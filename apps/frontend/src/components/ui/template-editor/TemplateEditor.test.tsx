import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TemplateEditor } from "../TemplateEditor";
import type { DocumentTemplate } from "@mms/shared";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/hooks/useBranding", () => ({
  useBranding: () => ({
    logoUrl: "https://example.com/logo.png",
  }),
}));

describe("TemplateEditor Component", () => {
  const sampleTemplate: DocumentTemplate = {
    pageSize: "A5",
    orientation: "portrait",
    elements: [
      { id: "el_1", type: "static", label: "Invoice Title", x: 20, y: 20, w: 200, h: 20 },
      { id: "el_2", type: "field", field: "studentName", label: "Student Name", x: 20, y: 50, w: 200, h: 20 },
    ],
  };

  it("renders the template editor in fullscreen mode with canvas and toolbar", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        title="Custom Invoice Editor"
        template={sampleTemplate}
        onClose={vi.fn()}
        availableFields={[{ field: "studentName", label: "Student Name" }]}
      />
    );

    expect(html).toContain("Custom Invoice Editor");
    expect(html).toContain("Invoice Title");
    expect(html).toContain("templateEditor.addElements");
    expect(html).toContain("templateEditor.pageSize");
  });

  it("renders export buttons when handlers are provided", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        template={sampleTemplate}
        onClose={vi.fn()}
        onExportTypst={vi.fn()}
        onExportZoho={vi.fn()}
      />
    );

    expect(html).toContain("Typst");
    expect(html).toContain("Zoho");
  });
});
