import React from "react";
import { useBranding } from "@/tenant/hooks/useBranding";
import { getPrintBrandingTokens } from "@/lib/printBrandingTokens";
import { InvoiceTemplateCanvas } from "./InvoiceTemplateCanvas";
import { InvoiceTemplateElementPalette } from "./InvoiceTemplateElementPalette";
import { InvoiceTemplateKeyboardHints } from "./InvoiceTemplateKeyboardHints";
import { InvoiceTemplatePropertiesPanel } from "./InvoiceTemplatePropertiesPanel";
import { InvoiceTemplateToolbar } from "./InvoiceTemplateToolbar";
import { useInvoiceTemplateEditor } from "./useInvoiceTemplateEditor";

export interface InvoiceTemplateEditorProps {
  onClose: () => void;
  fullscreen?: boolean;
}

export function InvoiceTemplateEditor({ onClose, fullscreen = true }: InvoiceTemplateEditorProps): React.JSX.Element {
  const branding = useBranding();
  const printTokens = getPrintBrandingTokens();
  const editor = useInvoiceTemplateEditor();

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-background" : "flex flex-col bg-background rounded-xl border border-border overflow-hidden"} style={!fullscreen ? { height: "80vh" } : {}}>
      <InvoiceTemplateToolbar
        template={editor.template}
        historyLength={editor.history.length}
        futureLength={editor.future.length}
        saved={editor.saved}
        showGuides={editor.showGuides}
        fullscreen={fullscreen}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onPageSizeChange={editor.handlePageSize}
        onToggleGuides={() => editor.setShowGuides(!editor.showGuides)}
        onSave={editor.handleSave}
        onClose={onClose}
        t={editor.t}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <InvoiceTemplateElementPalette
          onAddStaticText={editor.addStaticText}
          onAddDivider={editor.addDivider}
          onAddField={editor.addField}
          t={editor.t}
        />
        <InvoiceTemplateCanvas
          template={editor.template}
          selectedId={editor.selectedId}
          size={editor.size}
          canvasScale={editor.canvasScale}
          showGuides={editor.showGuides}
          canvasViewportRef={editor.canvasViewportRef}
          canvasRef={editor.canvasRef}
          branding={branding}
          printTokens={printTokens}
          onDeselect={() => editor.setSelectedId(null)}
          onMouseDownElement={editor.onMouseDownElement}
          onMouseDownResize={editor.onMouseDownResize}
          onDuplicateElement={editor.duplicateElement}
          onDeleteElement={editor.deleteElement}
          t={editor.t}
        />
        <InvoiceTemplatePropertiesPanel
          selectedElement={editor.selectedElement}
          onPatchElement={editor.patchElement}
          onPatchStyle={editor.patchStyle}
          onDuplicateElement={editor.duplicateElement}
          onDeleteElement={editor.deleteElement}
          t={editor.t}
        />
      </div>

      <InvoiceTemplateKeyboardHints t={editor.t} />
    </div>
  );
}
