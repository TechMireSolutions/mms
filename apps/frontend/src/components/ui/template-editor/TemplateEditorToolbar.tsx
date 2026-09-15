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
  /** Id of the visible `<h2>`, so the dialog can use `aria-labelledby`. */
  titleId?: string;
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
  /** Key of the currently active preset (set by applyPreset, cleared by any edit). */
  activePresetKey?: string | null;
  t: TranslationFunction;
}

/** Thin vertical separator between toolbar groups */
function Divider() {
  return <div className="h-6 w-px bg-border/60 mx-1 shrink-0" aria-hidden="true" />;
}

/** Shared sizing for every control in the toolbar — one 44px row, no exceptions. */
const TOOLBAR_ICON_BUTTON =
  "touch-manipulation rounded-md transition-all shadow-none min-h-11 min-w-11";

/**
 * Toolbar for the shared document template editor.
 *
 * Deliberately NOT `role="toolbar"`: the WAI-ARIA toolbar pattern requires a
 * single tab stop plus arrow-key navigation, and half-implementing it (a toolbar
 * role with ~15 independent tab stops and a `<select>` in the middle) is worse for
 * screen-reader users than an honest, labelled container. Each control cluster is
 * exposed as its own labelled `role="group"` instead, and the visible `<h2>` is the
 * dialog's accessible name via `aria-labelledby`.
 */
export function TemplateEditorToolbar<TPayload = Record<string, unknown>>({
  title,
  titleId,
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
  activePresetKey = null,
  t,
}: TemplateEditorToolbarProps<TPayload>): React.JSX.Element {
  return (
    <header className="flex items-center border-b border-border bg-card/95 backdrop-blur-sm flex-shrink-0 min-h-[60px] print:hidden relative">
      {/*
       * Scrollable region: all controls left of the spacer.
       * The right-edge fade mask signals there are more controls to the right
       * without obscuring the sticky right group (which lives outside this div).
       */}
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto overflow-y-hidden flex-1 min-w-0
        [mask-image:linear-gradient(to_right,black_calc(100%-48px),transparent_100%)]
        rtl:[mask-image:linear-gradient(to_left,black_calc(100%-48px),transparent_100%)]">
      {/* Group 1: Title */}
      <div className="flex items-center gap-2 shrink-0">
        <h2
          id={titleId}
          className="font-bold text-sm text-foreground m-0 whitespace-nowrap max-w-[38ch] truncate"
        >
          {title || t("templateEditor.title")}
        </h2>
        {isDirty && !saved && (
          <span
            role="status"
            aria-live="polite"
            className="px-1.5 py-0.5 rounded-full text-3xs font-bold border border-warning/30 bg-warning/10 text-warning whitespace-nowrap animate-pulse"
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
        aria-label={t("templateEditor.history")}
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
          className={`${TOOLBAR_ICON_BUTTON} hover:bg-muted disabled:opacity-30`}
        >
          <Undo2 className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          onClick={onRedo}
          disabled={!futureLength || saving}
          title={t("templateEditor.redo")}
          aria-label={t("templateEditor.redo")}
          variant="ghost"
          size="icon"
          className={`${TOOLBAR_ICON_BUTTON} hover:bg-muted disabled:opacity-30`}
        >
          <Redo2 className="w-4 h-4" aria-hidden="true" />
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
        aria-label={t("templateEditor.viewOptions")}
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
          className={`${TOOLBAR_ICON_BUTTON} ${
            showGuides
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {showGuides ? (
            <Eye className="w-4 h-4" aria-hidden="true" />
          ) : (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          )}
        </Button>

        {onTogglePreview && (
          <Button
            type="button"
            onClick={onTogglePreview}
            aria-pressed={isPreviewMode}
            aria-label={
              isPreviewMode ? t("templateEditor.switchToEdit") : t("templateEditor.switchToPreview")
            }
            title={
              isPreviewMode ? t("templateEditor.switchToEdit") : t("templateEditor.switchToPreview")
            }
            variant="ghost"
            size="icon"
            className={`${TOOLBAR_ICON_BUTTON} ${
              isPreviewMode
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {isPreviewMode ? (
              <Pencil className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
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

      {/* Group 6: Presets — value reflects the active preset so the user knows what's loaded */}
      {presets.length > 0 && (
        <>
          <Divider />
          <div className="flex items-center gap-1 shrink-0">
            <LayoutTemplate className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <FormSelect
              aria-label={t("templateEditor.presets")}
              value={activePresetKey ?? ""}
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
              className={`h-11 text-xs py-0 min-w-[130px] ${
                activePresetKey ? "border-primary/50 text-primary" : ""
              }`}
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
      </div>{/* end scrollable region */}

      {/* Group 8: Right actions — always visible, outside the scroll + fade region */}
      <div
        role="group"
        aria-label={t("templateEditor.documentActions")}
        className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 border-s border-border/50 bg-card/95 backdrop-blur-sm"
      >
        <Button
          type="button"
          onClick={onResetDefault}
          disabled={saving}
          variant="ghost"
          size="icon"
          className={`${TOOLBAR_ICON_BUTTON} text-muted-foreground hover:text-foreground hover:bg-muted`}
          title={t("templateEditor.resetDefault")}
          aria-label={t("templateEditor.resetDefault")}
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </Button>

        {onToggleFullscreen && (
          <Button
            type="button"
            onClick={onToggleFullscreen}
            aria-pressed={fullscreen}
            variant="ghost"
            size="icon"
            className={`${TOOLBAR_ICON_BUTTON} text-muted-foreground hover:text-foreground hover:bg-muted`}
            title={t("templateEditor.toggleFullscreen")}
            aria-label={t("templateEditor.toggleFullscreen")}
          >
            {fullscreen ? (
              <Minimize2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
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
          className={`min-h-11 h-11 px-3.5 text-xs font-semibold rounded-lg transition-all duration-300 shadow-none flex items-center gap-1.5 ${
            saved
              ? "bg-success hover:bg-success text-success-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>{t("global.saving")}</span>
            </>
          ) : saved ? (
            <>
              <CheckCheck className="w-4 h-4" aria-hidden="true" />
              <span>{t("templateEditor.saved")}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" aria-hidden="true" />
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
          className="min-h-11 h-11 px-3 text-xs font-medium rounded-lg border-border hover:bg-muted transition-all shadow-none"
        >
          {t("templateEditor.close")}
        </Button>
      </div>
    </header>
  );
}
