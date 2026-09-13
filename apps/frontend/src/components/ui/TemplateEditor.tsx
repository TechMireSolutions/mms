/**
 * @file TemplateEditor.tsx
 * @description Global DRY Single Source of Truth (SSOT) Document Template Editor.
 * Parametric over document payload schemas with native Typst and Zoho sync integrations.
 */

import React, { useState } from "react";
import { useBranding } from "@/tenant/hooks/useBranding";
import { getPrintBrandingTokens } from "@/lib/printBrandingTokens";
import type {
  DocumentTemplate,
  DocumentTemplatePreset,
  TemplateFieldDefinition,
  ZohoInvoicePayload,
} from "@mms/shared";
import { useTemplateEditor } from "./template-editor/useTemplateEditor";
import { TemplateEditorToolbar } from "./template-editor/TemplateEditorToolbar";
import { TemplateEditorElementPalette } from "./template-editor/TemplateEditorElementPalette";
import { TemplateEditorCanvas } from "./template-editor/TemplateEditorCanvas";
import { TemplateEditorPropertiesPanel } from "./template-editor/TemplateEditorPropertiesPanel";
import { TemplateEditorKeyboardHints } from "./template-editor/TemplateEditorKeyboardHints";
import { mapToZohoInvoice } from "./template-editor/templatePayloadMappers";

export interface TemplateEditorProps<TPayload = Record<string, unknown>> {
  title?: string;
  template?: DocumentTemplate<TPayload>;
  defaultTemplate?: DocumentTemplate<TPayload>;
  availableFields?: TemplateFieldDefinition<TPayload>[];
  presets?: DocumentTemplatePreset<TPayload>[];
  documentType?: "invoice" | "receipt" | "report-card" | "ledger" | "certificate" | "voucher" | string;
  sampleData?: TPayload;
  fullscreen?: boolean;
  onSave?: (template: DocumentTemplate<TPayload>) => void | Promise<void>;
  onClose: () => void;
  onExportTypst?: (payload: TPayload) => void | Promise<void>;
  onExportZoho?: (payload: ZohoInvoicePayload) => void | Promise<void>;
}

export function TemplateEditor<TPayload = Record<string, unknown>>({
  title,
  template: initialTemplate,
  defaultTemplate,
  availableFields = [],
  presets = [],
  sampleData,
  fullscreen = true,
  onSave,
  onClose,
  onExportTypst,
  onExportZoho,
}: TemplateEditorProps<TPayload>): React.JSX.Element {
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const branding = useBranding();
  const printTokens = getPrintBrandingTokens();

  const editor = useTemplateEditor<TPayload>({
    initialTemplate,
    defaultTemplate,
    availableFields,
    presets,
    onSave,
  });

  const handleClose = () => {
    if (isFullscreen && !fullscreen) {
      setIsFullscreen(false);
    } else {
      onClose();
    }
  };

  const handleExportTypst = onExportTypst
    ? () => {
        const payload = (sampleData || {}) as TPayload;
        onExportTypst(payload)?.catch?.(console.error);
      }
    : undefined;

  const handleExportZoho = onExportZoho
    ? () => {
        const zohoPayload = mapToZohoInvoice(
          (sampleData || {}) as Record<string, unknown>,
          editor.template as DocumentTemplate
        );
        onExportZoho(zohoPayload)?.catch?.(console.error);
      }
    : undefined;

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-modal flex flex-col bg-background"
          : "flex flex-col bg-background rounded-xl border border-border overflow-hidden h-max-h-modal max-h-modal min-h-preview-2xl"
      }
    >
      <TemplateEditorToolbar
        title={title}
        template={editor.template}
        historyLength={editor.history.length}
        futureLength={editor.future.length}
        saved={editor.saved}
        saving={editor.saving}
        isDirty={editor.isDirty}
        showGuides={editor.showGuides}
        fullscreen={isFullscreen}
        presets={presets}
        canvasScale={editor.canvasScale}
        isPreviewMode={editor.isPreviewMode}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onPageSizeChange={editor.handlePageSize}
        onOrientationChange={editor.handleOrientationChange}
        onToggleGuides={() => editor.setShowGuides(!editor.showGuides)}
        onTogglePreview={() => editor.setIsPreviewMode(!editor.isPreviewMode)}
        onZoomIn={editor.zoomIn}
        onZoomOut={editor.zoomOut}
        onZoomReset={editor.zoomReset}
        onZoomFit={editor.zoomFit}
        onExportJson={editor.exportTemplateJson}
        onImportJson={editor.importTemplateJson}
        onResetDefault={editor.resetToDefault}
        onApplyPreset={editor.applyPreset}
        onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
        onSave={editor.handleSave}
        onClose={handleClose}
        onExportTypst={handleExportTypst}
        onExportZoho={handleExportZoho}
        t={editor.t}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {!editor.isPreviewMode && (
          <TemplateEditorElementPalette
            availableFields={availableFields}
            onAddStaticText={editor.addStaticText}
            onAddHeading={editor.addHeading}
            onAddDivider={editor.addDivider}
            onAddQrCode={editor.addQrCode}
            onAddLogo={editor.addLogo}
            onAddField={editor.addField}
            t={editor.t}
          />
        )}
        <TemplateEditorCanvas
          template={editor.template}
          selectedId={editor.selectedId}
          selectedIds={editor.selectedIds}
          size={editor.size}
          canvasScale={editor.canvasScale}
          showGuides={editor.showGuides}
          isPreviewMode={editor.isPreviewMode}
          canvasViewportRef={editor.canvasViewportRef}
          canvasRef={editor.canvasRef}
          branding={branding}
          printTokens={printTokens}
          onDeselect={editor.deselectAll}
          onMouseDownElement={editor.onMouseDownElement}
          onMouseDownResize={editor.onMouseDownResize}
          onDeleteElement={editor.deleteElement}
          onSelectElements={(ids) => editor.setSelectedIds(ids)}
          sampleData={sampleData}
          t={editor.t}
        />
        {!editor.isPreviewMode && (
          <TemplateEditorPropertiesPanel
            selectedElement={editor.selectedElement}
            selectedElements={editor.selectedElements}
            onPatchElement={editor.patchElement}
            onPatchStyle={editor.patchStyle}
            onDuplicateElement={editor.duplicateElement}
            onDeleteElement={editor.deleteElement}
            onDuplicateSelected={editor.duplicateSelected}
            onDeleteSelected={editor.deleteSelected}
            onAlignSelected={editor.alignSelected}
            onDistributeSelected={editor.distributeSelected}
            onCenterSelected={editor.centerSelected}
            onBringToFront={editor.bringToFront}
            onSendToBack={editor.sendToBack}
            onBringSelectedToFront={editor.bringSelectedToFront}
            onSendSelectedToBack={editor.sendSelectedToBack}
            onMoveForward={editor.moveForward}
            onMoveBackward={editor.moveBackward}
            primaryColor={branding.primaryColor}
            secondaryColor={branding.secondaryColor}
            t={editor.t}
          />
        )}
      </div>

      <TemplateEditorKeyboardHints t={editor.t} />
    </div>
  );
}

export default TemplateEditor;
