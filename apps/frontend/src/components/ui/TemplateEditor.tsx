/**
 * @file TemplateEditor.tsx
 * @description Global DRY Single Source of Truth (SSOT) Document Template Editor.
 * Parametric over document payload schemas with native Typst and Zoho sync integrations.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useBranding } from "@/tenant/hooks/useBranding";
import { notify } from "@/lib/notify";
import type {
  DocumentTemplate,
  DocumentTemplatePreset,
  TemplateFieldDefinition,
  ZohoInvoicePayload,
} from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useTemplateEditor } from "./template-editor/useTemplateEditor";
import { useTemplateEditorModal } from "./template-editor/useTemplateEditorModal";
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
  documentType,
  sampleData,
  fullscreen = true,
  onSave,
  onClose,
  onExportTypst,
  onExportZoho,
}: TemplateEditorProps<TPayload>): React.JSX.Element {
  const [isExporting, setIsExporting] = useState(false);
  const branding = useBranding();

  // The editor's Escape/Ctrl-close handler must invoke the modal's close logic,
  // but the modal needs the editor's live `isDirty` — a circular dependency.
  // Break it with a stable indirection so neither value is read a render late
  // (the previous `editorRef.current = editor` pattern made the discard prompt
  // miss the most recent edit, and wrote a ref during render).
  const modalCloseRef = useRef<() => void>(() => {});
  const handleEditorClose = useCallback(() => {
    modalCloseRef.current();
  }, []);

  const editor = useTemplateEditor<TPayload>({
    initialTemplate,
    defaultTemplate,
    availableFields,
    presets,
    documentType,
    onSave,
    onClose: handleEditorClose,
  });

  const confirmDiscardPrompt = useCallback(() => {
    return window.confirm(editor.t("templateEditor.discardUnsavedPrompt"));
  }, [editor.t]);

  const modal = useTemplateEditorModal({
    initialFullscreen: fullscreen,
    isDirty: editor.isDirty,
    onClose,
    confirmDiscardPrompt,
  });

  useEffect(() => {
    modalCloseRef.current = modal.handleClose;
  }, [modal.handleClose]);

  const handleToggleGuides = useCallback(() => {
    editor.setShowGuides((prev) => !prev);
  }, [editor.setShowGuides]);

  const handleTogglePreview = useCallback(() => {
    editor.setIsPreviewMode((prev) => !prev);
  }, [editor.setIsPreviewMode]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportTypst = useCallback(async () => {
    if (!onExportTypst) return;
    setIsExporting(true);
    try {
      const payload = (sampleData || {}) as TPayload;
      await onExportTypst(payload);
    } catch (err) {
      console.error("Typst export failed:", err);
      notify.error(editor.t("templateEditor.exportFailed"));
    } finally {
      setIsExporting(false);
    }
  }, [editor.t, onExportTypst, sampleData]);

  const handleExportZoho = useCallback(async () => {
    if (!onExportZoho) return;
    setIsExporting(true);
    try {
      const zohoPayload = mapToZohoInvoice(
        (sampleData || {}) as Record<string, unknown>,
        editor.template as DocumentTemplate
      );
      await onExportZoho(zohoPayload);
    } catch (err) {
      console.error("Zoho export failed:", err);
      notify.error(editor.t("templateEditor.exportFailed"));
    } finally {
      setIsExporting(false);
    }
  }, [editor.t, editor.template, onExportZoho, sampleData]);

  const editorLabel =
    title ||
    (documentType
      ? `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Template Editor`
      : editor.t("templateEditor.title"));

  return (
    <div
      ref={modal.containerRef}
      tabIndex={-1}
      role={modal.isFullscreen ? "dialog" : "region"}
      aria-modal={modal.isFullscreen ? "true" : undefined}
      aria-label={editorLabel}
      className={
        modal.isFullscreen
          ? "fixed inset-0 z-modal flex flex-col bg-background outline-hidden print:static print:bg-white print:overflow-visible print:border-none print:p-0 print:m-0"
          : "flex flex-col bg-background rounded-xl border border-border overflow-hidden h-[calc(100dvh-14rem)] min-h-[580px] max-h-[860px] outline-hidden print:static print:bg-white print:overflow-visible print:border-none print:p-0 print:m-0"
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
        fullscreen={modal.isFullscreen}
        presets={presets}
        canvasScale={editor.canvasScale}
        isPreviewMode={editor.isPreviewMode}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onPageSizeChange={editor.handlePageSize}
        onOrientationChange={editor.handleOrientationChange}
        onToggleGuides={handleToggleGuides}
        onTogglePreview={handleTogglePreview}
        onZoomIn={editor.zoomIn}
        onZoomOut={editor.zoomOut}
        onZoomReset={editor.zoomReset}
        onZoomFit={editor.zoomFit}
        onExportJson={editor.exportTemplateJson}
        onImportJson={editor.importTemplateJson}
        onResetDefault={editor.resetToDefault}
        onApplyPreset={editor.applyPreset}
        onToggleFullscreen={modal.handleToggleFullscreen}
        onSave={editor.handleSave}
        onClose={modal.handleClose}
        onExportTypst={onExportTypst ? handleExportTypst : undefined}
        onExportZoho={onExportZoho ? handleExportZoho : undefined}
        onPrint={handlePrint}
        isExporting={isExporting}
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
            onAddTable={editor.addTable}
            t={editor.t}
          />
        )}
        <div className="flex-1 min-h-[320px] relative flex flex-col overflow-hidden">
          <ErrorBoundary>
            <TemplateEditorCanvas
              template={editor.template}
              selectedId={editor.selectedId}
              selectedIds={editor.selectedIds}
              size={editor.size}
              canvasScale={editor.canvasScale}
              showGuides={editor.showGuides}
              isPreviewMode={editor.isPreviewMode}
              activeGuides={editor.activeGuides}
              isSpacePressed={editor.isSpacePressed}
              isPanning={editor.isPanning}
              onPointerDownViewport={editor.onPointerDownViewport}
              canvasViewportRef={editor.canvasViewportRef}
              canvasRef={editor.canvasRef}
              branding={branding}
              onDeselect={editor.deselectAll}
              onMouseDownElement={editor.onMouseDownElement}
              onMouseDownResize={editor.onMouseDownResize}
              onDeleteElement={editor.deleteElement}
              onSelectElements={editor.setSelectedIds}
              sampleData={sampleData}
              t={editor.t}
            />
          </ErrorBoundary>
        </div>
        {!editor.isPreviewMode && (
          <TemplateEditorPropertiesPanel
            selectedElement={editor.selectedElement}
            selectedElements={editor.selectedElements}
            onPatchElement={editor.patchElement}
            onPatchStyle={editor.patchStyle}
            onPatchSelectedStyles={editor.patchSelectedStyles}
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
