/**
 * @file TemplateEditor.tsx
 * @description Global DRY Single Source of Truth (SSOT) Document Template Editor.
 * Parametric over document payload schemas with native Typst and Zoho sync integrations.
 */

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { useBranding } from "@/tenant/hooks/useBranding";
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
import { useTemplateEditorExport } from "./template-editor/useTemplateEditorExport";
import { TemplateEditorPrintRules } from "./template-editor/TemplateEditorPrintRules";
import {
  TemplateEditorPaneSwitcher,
  type EditorPane,
} from "./template-editor/TemplateEditorPaneSwitcher";

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
  /** Overrides the built-in browser print of the editing surface. */
  onPrint?: () => void;
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
  onPrint,
}: TemplateEditorProps<TPayload>): React.JSX.Element {
  const [pane, setPane] = useState<EditorPane>("canvas");
  const branding = useBranding();
  const titleId = useId();

  // The editor's Escape/Ctrl-close handler must invoke the modal's close logic,
  // but the modal needs the editor's live `isDirty` — a circular dependency.
  // Break it with a stable indirection so neither value is read a render late.
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

  const hasSelection = editor.selectedIds.length > 0;
  const modal = useTemplateEditorModal({
    initialFullscreen: fullscreen,
    isDirty: editor.isDirty,
    onClose,
    confirmDiscardPrompt,
    // Escape clears the selection first (the shortcut layer owns that press); only a
    // second Escape with nothing selected leaves the editor.
    ignoreEscapeWhen: () => hasSelection,
  });

  useEffect(() => {
    modalCloseRef.current = modal.handleClose;
  }, [modal.handleClose]);

  /* Deleting unmounts the activated control, so recover focus and announce the change. */
  const deletionNonce = editor.deletionNotice?.nonce ?? 0;
  useEffect(() => {
    if (!deletionNonce) return;
    editor.canvasViewportRef.current?.focus();
  }, [deletionNonce, editor.canvasViewportRef]);

  const { isExporting, handlePrint, handleExportTypst, handleExportZoho } = useTemplateEditorExport({
    template: editor.template,
    sampleData,
    onExportTypst,
    onExportZoho,
    onPrint,
    t: editor.t,
  });

  const handleToggleGuides = useCallback(() => {
    editor.setShowGuides((prev) => !prev);
  }, [editor.setShowGuides]);

  const handleTogglePreview = useCallback(() => {
    editor.setIsPreviewMode((prev) => !prev);
  }, [editor.setIsPreviewMode]);

  const documentLabel = documentType ? documentType.charAt(0).toUpperCase() + documentType.slice(1) : "";
  const editorLabel =
    title ||
    (documentLabel
      ? editor.t("templateEditor.documentTitle", { document: documentLabel })
      : editor.t("templateEditor.title"));


  /** Visible when it is the selected mobile pane, and always visible from `lg` up. */
  const paneClass = (candidate: EditorPane) => (pane === candidate ? "flex" : "hidden");

  return (
    <div
      ref={modal.containerRef}
      tabIndex={-1}
      role={modal.isFullscreen ? "dialog" : "region"}
      aria-modal={modal.isFullscreen ? "true" : undefined}
      aria-labelledby={titleId}
      data-print-unclamp
      className={
        modal.isFullscreen
          ? "fixed inset-0 z-modal flex flex-col bg-background outline-hidden print:static print:bg-white print:overflow-visible print:border-none print:p-0 print:m-0"
          : "flex flex-col bg-background rounded-xl border border-border overflow-hidden h-[calc(100dvh-14rem)] min-h-[580px] max-h-[860px] outline-hidden print:static print:bg-white print:h-auto print:max-h-none print:overflow-visible print:border-none print:p-0 print:m-0"
      }
    >
      <TemplateEditorPrintRules
        width={editor.size.width}
        height={editor.size.height}
        orientation={editor.orientation}
      />

      <TemplateEditorToolbar
        /* `editorLabel` already applies the title → documentType → generic fallbacks. */
        title={editorLabel}
        titleId={titleId}
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

      <TemplateEditorPaneSwitcher value={pane} onChange={setPane} t={editor.t} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {!editor.isPreviewMode && (
          /* `lg:contents` restores flex stretch at lg — see TemplateEditorPaneSwitcher. */
          <div className={`${paneClass("elements")} lg:contents`}>
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
          </div>
        )}
        <div
          /* `print:flex`: below lg an inactive pane is `hidden`, and print is not a screen. */
          className={`${paneClass("canvas")} lg:flex print:flex flex-1 min-h-[320px] relative flex-col overflow-hidden`}
        >
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
              onSelectElement={editor.selectElement}
              flashElementId={editor.flashElementId}
              appDir={editor.isRtl ? "rtl" : "ltr"}
              sampleData={sampleData}
              t={editor.t}
            />
          </ErrorBoundary>
        </div>
        {!editor.isPreviewMode && (
          <div className={`${paneClass("properties")} lg:contents`}>
            <TemplateEditorPropertiesPanel
              selectedElement={editor.selectedElement}
              selectedElements={editor.selectedElements}
              elements={editor.template.elements}
              availableFields={availableFields}
              onSelectElement={editor.selectElement}
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
              isRtl={editor.isRtl}
              t={editor.t}
            />
          </div>
        )}
      </div>

      <TemplateEditorKeyboardHints t={editor.t} />

      {/* Polite status region: deletions only. Visually hidden, announced on change. */}
      <div role="status" aria-live="polite" className="sr-only">
        {editor.deletionNotice?.message ?? ""}
      </div>
    </div>
  );
}

export default TemplateEditor;
