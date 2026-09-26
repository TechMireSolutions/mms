import { TemplateEditorViewControls } from "./TemplateEditorViewControls";
import type {
  DocumentTemplate,
  DocumentTemplatePreset,
  TemplateOrientation,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { TemplateEditorHistoryControls } from "./TemplateEditorHistoryControls";
import { TemplateEditorPageControls } from "./TemplateEditorPageControls";
import { TemplateEditorZoomControls } from "./TemplateEditorZoomControls";
import { TemplateEditorExportActions } from "./TemplateEditorExportActions";
import { TemplateEditorPresetsControl } from "./TemplateEditorPresetsControl";
import { TemplateEditorHeaderActions } from "./TemplateEditorHeaderActions";

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
    <header className="flex items-center border-b border-border bg-card/95 backdrop-blur-sm flex-shrink-0 min-h-16 print:hidden relative">
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
      <TemplateEditorHistoryControls
        onUndo={onUndo}
        onRedo={onRedo}
        historyLength={historyLength}
        futureLength={futureLength}
        saving={saving}
        t={t}
      />

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
      <TemplateEditorViewControls
        showGuides={showGuides}
        isPreviewMode={isPreviewMode}
        onToggleGuides={onToggleGuides}
        onTogglePreview={onTogglePreview}
        iconButtonClassName={TOOLBAR_ICON_BUTTON}
        t={t}
      />

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
          <TemplateEditorPresetsControl
            presets={presets}
            activePresetKey={activePresetKey}
            saving={saving}
            isDirty={isDirty}
            onApplyPreset={onApplyPreset}
            t={t}
          />
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

      {/* Group 8: Right actions */}
      <TemplateEditorHeaderActions
        onResetDefault={onResetDefault}
        onToggleFullscreen={onToggleFullscreen}
        fullscreen={fullscreen}
        onSave={onSave}
        onClose={onClose}
        saved={saved}
        saving={saving}
        t={t}
      />
    </header>
  );
}
