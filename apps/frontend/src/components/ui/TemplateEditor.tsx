/**
 * @file TemplateEditor.tsx
 * @description Global DRY Single Source of Truth (SSOT) Document Template Editor.
 * Parametric over document payload schemas with native Typst and Zoho sync integrations.
 */

import React, { useCallback, useEffect, useState } from "react";
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
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  // Track whether the user has toggled fullscreen manually (vs launched with fullscreen=true)
  const [isUserToggled, setIsUserToggled] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const branding = useBranding();

  const handleClose = useCallback(() => {
    if (editorRef.current?.isDirty) {
      const confirmed = window.confirm(
        editorRef.current.t("templateEditor.discardUnsavedPrompt")
      );
      if (!confirmed) return;
    }
    // If user toggled into fullscreen manually, collapse first instead of closing
    if (isFullscreen && isUserToggled) {
      setIsFullscreen(false);
      setIsUserToggled(false);
    } else {
      onClose();
    }
  }, [isFullscreen, isUserToggled, onClose]);

  const editor = useTemplateEditor<TPayload>({
    initialTemplate,
    defaultTemplate,
    availableFields,
    presets,
    documentType,
    onSave,
    onClose: handleClose,
  });

  const editorRef = React.useRef(editor);
  React.useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Protect against accidental browser tab closure/reload when changes are unsaved
  useEffect(() => {
    if (!editor.isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editor.isDirty]);

  // Focus management: capture previous focus on mount, focus dialog container, restore focus on unmount
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    if (isFullscreen && containerRef.current) {
      containerRef.current.focus();
    }
    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, [isFullscreen]);

  // Lock background page scroll when fullscreen modal is active
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setIsUserToggled(true);
  };

  const handleExportTypst = onExportTypst
    ? async () => {
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
      }
    : undefined;

  const handleExportZoho = onExportZoho
    ? async () => {
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
      }
    : undefined;

  const editorLabel =
    title ||
    (documentType
      ? `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Template Editor`
      : editor.t("templateEditor.title"));

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role={isFullscreen ? "dialog" : "region"}
      aria-modal={isFullscreen ? "true" : undefined}
      aria-label={editorLabel}
      className={
        isFullscreen
          ? "fixed inset-0 z-modal flex flex-col bg-background outline-hidden print:static print:bg-white print:overflow-visible print:border-none print:p-0 print:m-0"
          : "flex flex-col bg-background rounded-xl border border-border overflow-hidden h-max-h-modal max-h-modal min-h-preview-2xl outline-hidden print:static print:bg-white print:overflow-visible print:border-none print:p-0 print:m-0"
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
        onToggleFullscreen={handleToggleFullscreen}
        onSave={editor.handleSave}
        onClose={handleClose}
        onExportTypst={handleExportTypst}
        onExportZoho={handleExportZoho}
        onPrint={() => window.print()}
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
              onSelectElements={(ids) => editor.setSelectedIds(ids)}
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
