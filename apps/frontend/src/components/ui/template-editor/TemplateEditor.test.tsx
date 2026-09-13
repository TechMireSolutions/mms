import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TemplateEditor } from "../TemplateEditor";
import { TemplateElementRenderer } from "./TemplateElementRenderer";
import { TemplateEditorPropertiesPanel } from "./TemplateEditorPropertiesPanel";
import { TemplateEditorExportActions } from "./TemplateEditorExportActions";
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

  it("renders enhanced primitives including heading, logo, and table in element palette", () => {
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
    expect(html).toContain("templateEditor.table");
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

  it("renders copy, paste, space-pan, and alt-resize hints in the footer shortcuts list", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        template={sampleTemplate}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain("templateEditor.copy / templateEditor.paste");
    expect(html).toContain("templateEditor.spaceToPan");
    expect(html).toContain("templateEditor.altResize");
  });

  it("renders browser print / PDF export action in toolbar", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        template={sampleTemplate}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain("templateEditor.print");
  });

  it("renders accessible dialog semantics with role, aria-modal, and documentType label", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        template={sampleTemplate}
        documentType="receipt"
        fullscreen={true}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Receipt Template Editor"');
    expect(html).toContain('tabindex="-1"');
  });

  it("renders toolbar with role=toolbar and accessible control states", () => {
    const html = renderToStaticMarkup(
      <TemplateEditor
        template={sampleTemplate}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="templateEditor.toggleGuides"');
    expect(html).toContain('aria-pressed="true"');
  });
});

describe("TemplateElementRenderer Component", () => {
  it("renders all 8 directional resize handles and aria-live dimension badge when element is selected", () => {
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

    // 8-point handles
    expect(html).toContain("cursor-ns-resize");
    expect(html).toContain("cursor-ew-resize");
    expect(html).toContain("cursor-nwse-resize");
    expect(html).toContain("cursor-nesw-resize");
    expect(html).toContain("cursor-se-resize");

    // Dimension badge with aria-live="polite"
    expect(html).toContain('aria-live="polite"');
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
    expect(html).not.toContain("cursor-nwse-resize");
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

  it("renders table element with columns and mock line items", () => {
    const html = renderToStaticMarkup(
      <TemplateElementRenderer
        el={{
          id: "el_table",
          type: "table",
          label: "Items Table",
          x: 20,
          y: 80,
          w: 300,
          h: 120,
          columns: [
            { id: "c1", header: "Description", field: "description", align: "left" },
            { id: "c2", header: "Amount", field: "amount", align: "right" },
          ],
          tableConfig: {
            showHeader: true,
            zebra: true,
            headerBackground: "#f1f5f9",
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

    expect(html).toContain("Items Table (table)");
    expect(html).toContain("Description");
    expect(html).toContain("Amount");
    expect(html).toContain("Tuition / Fee Item 1");
  });

  it("auto-detects Arabic / Urdu script and sets direction rtl and text-align right", () => {
    const html = renderToStaticMarkup(
      <TemplateElementRenderer
        el={{
          id: "el_ar",
          type: "static",
          label: "فاتورة رسوم الطالب",
          x: 20,
          y: 20,
          w: 200,
          h: 30,
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

    expect(html).toContain('dir="rtl"');
    expect(html).toContain("text-align:right");
  });

  it("interpolates mustache tokens in static text with sample data", () => {
    const html = renderToStaticMarkup(
      <TemplateElementRenderer
        el={{
          id: "el_tok",
          type: "static",
          label: "Invoice for {{studentName}} (ID: {{studentId}})",
          x: 20,
          y: 20,
          w: 250,
          h: 30,
        }}
        isSelected={false}
        isPreviewMode={false}
        sampleData={{ studentName: "Ali Raza", studentId: "STD-99" }}
        branding={{ logoUrl: null }}
        onMouseDownElement={vi.fn()}
        onMouseDownResize={vi.fn()}
        onDeleteElement={vi.fn()}
        t={mockT}
      />
    );

    expect(html).toContain("Invoice for Ali Raza (ID: STD-99)");
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

  it("renders table configuration section when a table element is selected", () => {
    const html = renderToStaticMarkup(
      <TemplateEditorPropertiesPanel
        selectedElement={{
          id: "el_tbl",
          type: "table",
          label: "Itemized List",
          x: 20,
          y: 20,
          w: 300,
          h: 120,
          columns: [
            { id: "c1", header: "Item", field: "item", width: 70, align: "left" },
          ],
        }}
        onPatchElement={vi.fn()}
        onPatchStyle={vi.fn()}
        onDuplicateElement={vi.fn()}
        onDeleteElement={vi.fn()}
        t={mockT}
      />
    );

    expect(html).toContain("templateEditor.table");
    expect(html).toContain("templateEditor.addColumn");
    expect(html).toContain("templateEditor.columnHeader");
  });

  it("renders batch appearance controls when multiple elements are selected", () => {
    const html = renderToStaticMarkup(
      <TemplateEditorPropertiesPanel
        selectedElement={{ id: "el_1", type: "static", label: "A", x: 10, y: 10, w: 50, h: 20 }}
        selectedElements={[
          { id: "el_1", type: "static", label: "A", x: 10, y: 10, w: 50, h: 20 },
          { id: "el_2", type: "static", label: "B", x: 20, y: 20, w: 50, h: 20 },
        ]}
        onPatchElement={vi.fn()}
        onPatchStyle={vi.fn()}
        onPatchSelectedStyles={vi.fn()}
        onDuplicateElement={vi.fn()}
        onDeleteElement={vi.fn()}
        t={mockT}
      />
    );

    expect(html).toContain("templateEditor.batchStyle");
    expect(html).toContain("templateEditor.color");
    expect(html).toContain("templateEditor.fontSize");
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

  describe("TemplateEditorExportActions", () => {
    it("renders export group with accessible role, labels, and print isolation", () => {
      const html = renderToStaticMarkup(
        <TemplateEditorExportActions
          onExportJson={vi.fn()}
          onImportJson={vi.fn()}
          onExportTypst={vi.fn()}
          onExportZoho={vi.fn()}
          onPrint={vi.fn()}
          t={mockT}
        />
      );

      expect(html).toContain('role="group"');
      expect(html).toContain('aria-label="common.export"');
      expect(html).toContain("print:hidden");
      expect(html).toContain('aria-label="templateEditor.print"');
      expect(html).toContain('aria-label="templateEditor.exportJson"');
      expect(html).toContain('aria-label="templateEditor.importJson"');
      expect(html).toContain('aria-label="templateEditor.exportTypst"');
      expect(html).toContain('aria-label="templateEditor.exportZoho"');
      expect(html).toContain('accept=".json,application/json"');
    });

    it("disables actions and renders spinner when isExporting is true", () => {
      const html = renderToStaticMarkup(
        <TemplateEditorExportActions
          onExportJson={vi.fn()}
          onImportJson={vi.fn()}
          onExportTypst={vi.fn()}
          onExportZoho={vi.fn()}
          onPrint={vi.fn()}
          isExporting={true}
          t={mockT}
        />
      );

      expect(html).toContain("disabled");
      expect(html).toContain("animate-spin");
    });
  });
});
