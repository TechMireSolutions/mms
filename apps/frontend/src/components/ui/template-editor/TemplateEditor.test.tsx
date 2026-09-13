import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TemplateEditor } from "../TemplateEditor";
import { TemplateElementRenderer } from "./TemplateElementRenderer";
import { TemplateEditorPropertiesPanel } from "./TemplateEditorPropertiesPanel";
import type { DocumentTemplate } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

const mockT = ((key: string) => key) as TranslationFunction;

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

  it("renders zoom controls, preview button, and JSON export", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        template={sampleTemplate}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain("templateEditor.switchToPreview");
    expect(html).toContain("JSON");
    expect(html).toContain("100%");
  });

  it("renders populated sample data inside field elements", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        template={sampleTemplate}
        sampleData={{ studentName: "Muhammad Ali" }}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain("Muhammad Ali");
  });

  it("renders keyboard shortcut hints and localized footer controls", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        template={sampleTemplate}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain("templateEditor.shortcuts");
    expect(html).toContain("templateEditor.selectAll");
    expect(html).toContain("templateEditor.undo");
  });

  it("renders enhanced primitives including heading and logo in element palette", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        template={sampleTemplate}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain("templateEditor.heading");
    expect(html).toContain("templateEditor.staticText");
    expect(html).toContain("templateEditor.divider");
    expect(html).toContain("templateEditor.qrCode");
    expect(html).toContain("templateEditor.logo");
  });

  it("renders printable safe margins guide when guides are active", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        template={sampleTemplate}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain("templateEditor.safeMargins");
  });

  it("renders copy and paste hints in the footer shortcuts list", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        template={sampleTemplate}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain("templateEditor.copy / templateEditor.paste");
  });
});

describe("TemplateElementRenderer Component", () => {
  it("renders all 3 directional resize handles when element is selected", () => {
    const html = renderToStaticMarkup(
      <TemplateElementRenderer
        el={{ id: "el_1", type: "static", label: "Invoice Title", x: 20, y: 20, w: 200, h: 20 }}
        isSelected={true}
        isPreviewMode={false}
        branding={{ logoUrl: null }}
        onMouseDownElement={vi.fn()}
        onMouseDownResize={vi.fn()}
        onDeleteElement={vi.fn()}
        t={mockT}
      />
    );

    // Right/East handle
    expect(html).toContain("cursor-ew-resize");
    // Bottom/South handle
    expect(html).toContain("cursor-ns-resize");
    // South-East corner handle
    expect(html).toContain("cursor-se-resize");
    // Dimension badge
    expect(html).toContain("200 × 20");
  });

  it("does not render resize handles when isPreviewMode is true even if selected", () => {
    const html = renderToStaticMarkup(
      <TemplateElementRenderer
        el={{ id: "el_1", type: "static", label: "Invoice Title", x: 20, y: 20, w: 200, h: 20 }}
        isSelected={true}
        isPreviewMode={true}
        branding={{ logoUrl: null }}
        onMouseDownElement={vi.fn()}
        onMouseDownResize={vi.fn()}
        onDeleteElement={vi.fn()}
        t={mockT}
      />
    );

    expect(html).not.toContain("cursor-se-resize");
    expect(html).not.toContain("cursor-ew-resize");
    expect(html).not.toContain("cursor-ns-resize");
  });

  it("applies textDecoration underline and custom border styling", () => {
    const html = renderToStaticMarkup(
      <TemplateElementRenderer
        el={{
          id: "el_1",
          type: "static",
          label: "Underlined Title",
          x: 20,
          y: 20,
          w: 200,
          h: 20,
          style: {
            textDecoration: "underline",
            borderWidth: 2,
            borderColor: "#3b82f6",
            borderRadius: 4,
          },
        }}
        isSelected={false}
        isPreviewMode={false}
        branding={{ logoUrl: null }}
        onMouseDownElement={vi.fn()}
        onMouseDownResize={vi.fn()}
        onDeleteElement={vi.fn()}
        t={mockT}
      />
    );

    expect(html).toContain("text-decoration:underline");
    expect(html).toContain("border:2px solid #3b82f6");
    expect(html).toContain("border-radius:4px");
  });
});

describe("TemplateEditorPropertiesPanel Component", () => {
  it("renders appearance section with background, border width, and corner radius inputs", () => {
    const html = renderToStaticMarkup(
      <TemplateEditorPropertiesPanel
        selectedElement={{
          id: "el_1",
          type: "static",
          label: "Card Title",
          x: 20,
          y: 20,
          w: 200,
          h: 40,
          style: {
            backgroundColor: "#f8fafc",
            borderWidth: 1,
            borderRadius: 8,
          },
        }}
        onPatchElement={vi.fn()}
        onPatchStyle={vi.fn()}
        onDuplicateElement={vi.fn()}
        onDeleteElement={vi.fn()}
        t={mockT}
      />
    );

    expect(html).toContain("templateEditor.appearance");
    expect(html).toContain("templateEditor.backgroundColor");
    expect(html).toContain("templateEditor.borderWidth");
    expect(html).toContain("templateEditor.borderRadius");
    expect(html).toContain("templateEditor.transparent");
  });

  it("renders empty hint when no element is selected", () => {
    const html = renderToStaticMarkup(
      <TemplateEditorPropertiesPanel
        selectedElement={undefined}
        onPatchElement={vi.fn()}
        onPatchStyle={vi.fn()}
        onDuplicateElement={vi.fn()}
        onDeleteElement={vi.fn()}
        t={mockT}
      />
    );

    expect(html).toContain("templateEditor.emptyHint");
    expect(html).toContain("templateEditor.emptyHintDetail");
  });
});
