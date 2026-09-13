import React from "react";
import {
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Pencil,
  Redo2,
  RotateCcw,
  Save,
  CheckCheck,
  Undo2,
  LayoutTemplate,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import type {
  DocumentTemplate,
  DocumentTemplatePreset,
  TemplateOrientation,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { TemplateEditorPageControls } from "./TemplateEditorPageControls";
import { TemplateEditorZoomControls } from "./TemplateEditorZoomControls";
import { TemplateEditorExportActions } from "./TemplateEditorExportActions";

export interface TemplateEditorToolbarProps<TPayload = Record<string, unknown>> {
  title?: string;
  template: DocumentTemplate<TPayload>;
  historyLength: number;
  futureLength: number;
  saved: boolean;
  saving?: boolean;
  isDirty?: boolean;
  showGuides: boolean;
  fullscreen?: boolean;
  presets?: DocumentTemplatePreset<TPayload>[];
  canvasScale?: number;
  isPreviewMode?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPageSizeChange: (pageSizeKey: string) => void;
  onOrientationChange: (orientation: TemplateOrientation) => void;
  onToggleGuides: () => void;
  onTogglePreview?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onZoomFit?: () => void;
  onExportJson?: () => void;
  onImportJson?: (file: File) => void;
  onResetDefault: () => void;
  onApplyPreset: (presetKey: string) => void;
  onToggleFullscreen?: () => void;
  onSave: () => void;
  onClose: () => void;
  onExportTypst?: () => void;
  onExportZoho?: () => void;
  onPrint?: () => void;
  isExporting?: boolean;
  t: TranslationFunction;
}

/** Thin vertical separator between toolbar groups */
function Divider() {
  return <div className="h-5 w-px bg-border/60 mx-1 shrink-0" aria-hidden="true" />;
}

export function TemplateEditorToolbar<TPayload = Record<string, unknown>>({
  title,
  template,
  historyLength,
  futureLength,
  saved,
  saving = false,
  isDirty = false,
  showGuides,
  fullscreen = false,
  presets = [],
  canvasScale,
  isPreviewMode = false,
  onUndo,
  onRedo,
  onPageSizeChange,
  onOrientationChange,
  onToggleGuides,
  onTogglePreview,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  onExportJson,
  onImportJson,
  onResetDefault,
  onApplyPreset,
  onToggleFullscreen,
  onSave,
  onClose,
  onExportTypst,
  onExportZoho,
  onPrint,
  isExporting = false,
  t,
}: TemplateEditorToolbarProps<TPayload>): React.JSX.Element {
  return (
    <header
      role="toolbar"
      aria-label={title || t("templateEditor.title")}
      className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-card/95 backdrop-blur-sm flex-shrink-0 overflow-x-auto overflow-y-hidden min-h-[52px] print:hidden"
    >
      {/* Group 1: Title */}
      <div className="flex items-center gap-2 shrink-0">
        <h2 className="font-bold text-sm text-foreground m-0 whitespace-nowrap">
          {title || t("templateEditor.title")}
        </h2>
        {isDirty && !saved && (
          <span
            role="status"
            aria-live="polite"
            className="px-1.5 py-0.5 rounded-full text-3xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 dark:border-amber-500/40 animate-pulse whitespace-nowrap"
            title={t("templateEditor.dirtyNotice")}
          >
            {t("templateEditor.dirtyNotice")}
          </span>
        )}
      </div>

      <Divider />

      {/* Group 2: Undo / Redo */}
      <div
        role="group"
        aria-label={t("templateEditor.undo")}
        className="flex items-center gap-0.5 shrink-0"
      >
        <Button
          type="button"
          onClick={onUndo}
          disabled={!historyLength || saving}
          title={t("templateEditor.undo")}
          aria-label={t("templateEditor.undo")}
          variant="ghost"
          size="icon"
          className="touch-manipulation min-h-10 min-w-10 sm:min-h-9 sm:min-w-9 h-10 w-10 sm:h-9 sm:w-9 rounded-md hover:bg-muted disabled:opacity-30 transition-all shadow-none"
        >
          <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          onClick={onRedo}
          disabled={!futureLength || saving}
          title={t("templateEditor.redo")}
          aria-label={t("templateEditor.redo")}
          variant="ghost"
          size="icon"
          className="touch-manipulation min-h-10 min-w-10 sm:min-h-9 sm:min-w-9 h-10 w-10 sm:h-9 sm:w-9 rounded-md hover:bg-muted disabled:opacity-30 transition-all shadow-none"
        >
          <Redo2 className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      </div>

      <Divider />

      {/* Group 3: Page controls */}
      <div className="shrink-0">
        <TemplateEditorPageControls
          pageSize={template.pageSize}
          orientation={template.orientation || "portrait"}
          onPageSizeChange={onPageSizeChange}
          onOrientationChange={onOrientationChange}
          t={t}
        />
      </div>

      <Divider />

      {/* Group 4: Guides + Preview toggle */}
      <div
        role="group"
        aria-label={t("templateEditor.preview")}
        className="flex items-center gap-0.5 shrink-0"
      >
        <Button
          type="button"
          onClick={onToggleGuides}
          aria-pressed={showGuides}
          aria-label={t("templateEditor.toggleGuides")}
          title={t("templateEditor.toggleGuides")}
          variant="ghost"
          size="icon"
          className={`touch-manipulation min-h-10 min-w-10 sm:min-h-9 sm:min-w-9 h-10 w-10 sm:h-9 sm:w-9 rounded-md transition-all shadow-none ${
            showGuides
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {showGuides ? (
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </Button>

        {onTogglePreview && (
          <Button
            type="button"
            onClick={onTogglePreview}
            aria-pressed={isPreviewMode}
            aria-label={isPreviewMode ? t("templateEditor.switchToEdit") : t("templateEditor.switchToPreview")}
            title={isPreviewMode ? t("templateEditor.switchToEdit") : t("templateEditor.switchToPreview")}
            variant="ghost"
            size="icon"
            className={`touch-manipulation min-h-10 min-w-10 sm:min-h-9 sm:min-w-9 h-10 w-10 sm:h-9 sm:w-9 rounded-md transition-all shadow-none ${
              isPreviewMode
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {isPreviewMode ? (
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>

      {/* Group 5: Zoom controls */}
      {onZoomIn && onZoomOut && (
        <>
          <Divider />
          <div className="shrink-0">
            <TemplateEditorZoomControls
              canvasScale={canvasScale}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onZoomReset={onZoomReset}
              onZoomFit={onZoomFit}
              t={t}
            />
          </div>
        </>
      )}

      {/* Group 6: Presets */}
      {presets.length > 0 && (
        <>
          <Divider />
          <div className="flex items-center gap-1 shrink-0">
            <LayoutTemplate className="w-3 h-3 text-muted-foreground shrink-0" aria-hidden="true" />
            <FormSelect
              aria-label={t("templateEditor.presets")}
              value=""
              disabled={saving}
              onChange={(val) => {
                if (!val) return;
                if (isDirty && !window.confirm(t("templateEditor.discardUnsavedPrompt"))) {
                  return;
                }
                onApplyPreset(val);
              }}
              options={[
                { value: "", label: t("templateEditor.presets") },
                ...presets.map((p) => ({ value: p.key, label: p.label })),
              ]}
              className="h-8 text-xs py-0 min-w-[120px]"
            />
          </div>
        </>
      )}

      {/* Group 7: Export / Import */}
      <div className="shrink-0">
        <TemplateEditorExportActions
          onExportJson={onExportJson}
          onImportJson={onImportJson}
          onExportTypst={onExportTypst}
          onExportZoho={onExportZoho}
          onPrint={onPrint}
          isExporting={isExporting}
          disabled={saving}
          t={t}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Group 8: Right actions — sticky on horizontal scroll */}
      <div
        role="group"
        aria-label={t("templateEditor.save")}
        className="flex items-center gap-1.5 shrink-0 sticky end-0 bg-card/95 ps-2 border-s border-border/50 backdrop-blur-sm z-10"
      >
        <Button
          type="button"
          onClick={onResetDefault}
          disabled={saving}
          variant="ghost"
          size="icon"
          className="touch-manipulation min-h-10 min-w-10 sm:min-h-9 sm:min-w-9 h-10 w-10 sm:h-9 sm:w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-none"
          title={t("templateEditor.resetDefault")}
          aria-label={t("templateEditor.resetDefault")}
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>

        {onToggleFullscreen && (
          <Button
            type="button"
            onClick={onToggleFullscreen}
            aria-pressed={fullscreen}
            variant="ghost"
            size="icon"
            className="touch-manipulation min-h-10 min-w-10 sm:min-h-9 sm:min-w-9 h-10 w-10 sm:h-9 sm:w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-none"
            title={t("templateEditor.toggleFullscreen")}
            aria-label={t("templateEditor.toggleFullscreen")}
          >
            {fullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </Button>
        )}

        <Divider />

        {/* Save button — animated success state & loading spinner */}
        <Button
          type="button"
          onClick={onSave}
          disabled={saving}
          aria-busy={saving}
          aria-label={saving ? t("global.saving") : saved ? t("templateEditor.saved") : t("templateEditor.save")}
          className={`min-h-10 sm:min-h-9 h-10 sm:h-9 px-3.5 text-xs font-semibold rounded-lg transition-all duration-300 shadow-none flex items-center gap-1.5 ${
            saved
              ? "bg-emerald-500 hover:bg-emerald-500 text-white scale-[1.03] shadow-[0_0_12px_rgba(16,185,129,0.35)]"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>{t("global.saving")}</span>
            </>
          ) : saved ? (
            <>
              <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("templateEditor.saved")}</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("templateEditor.save")}</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          onClick={onClose}
          disabled={saving}
          variant="outline"
          title={t("templateEditor.close")}
          aria-label={t("templateEditor.close")}
          className="min-h-10 sm:min-h-9 h-10 sm:h-9 px-3 text-xs font-medium rounded-lg border-border hover:bg-muted transition-all shadow-none"
        >
          {t("templateEditor.close")}
        </Button>
      </div>
    </header>
  );
}
