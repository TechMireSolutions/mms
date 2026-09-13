import React from "react";
import {
  Eye,
  EyeOff,
  LayoutTemplate,
  Maximize2,
  Minimize2,
  Pencil,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
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
  t: TranslationFunction;
}

export function TemplateEditorToolbar<TPayload = Record<string, unknown>>({
  title,
  template,
  historyLength,
  futureLength,
  saved,
  saving = false,
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
  t,
}: TemplateEditorToolbarProps<TPayload>): React.JSX.Element {
  return (
    <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card flex-shrink-0 flex-wrap">
      <h2 className="font-bold text-sm text-foreground m-0">
        {title || t("templateEditor.title")}
      </h2>

      <div className="flex items-center gap-1 ms-2">
        <Button
          type="button"
          onClick={onUndo}
          disabled={!historyLength}
          title={t("templateEditor.undo")}
          variant="ghost"
          size="icon"
          className="rounded hover:bg-muted disabled:opacity-30 transition-colors shadow-none"
        >
          <Undo2 className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          onClick={onRedo}
          disabled={!futureLength}
          title={t("templateEditor.redo")}
          variant="ghost"
          size="icon"
          className="rounded hover:bg-muted disabled:opacity-30 transition-colors shadow-none"
        >
          <Redo2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>

      <TemplateEditorPageControls
        pageSize={template.pageSize}
        orientation={template.orientation || "portrait"}
        onPageSizeChange={onPageSizeChange}
        onOrientationChange={onOrientationChange}
        t={t}
      />

      <div className="flex items-center gap-1 ms-2">
        <Button
          type="button"
          onClick={onToggleGuides}
          variant="outline"
          className={`min-h-11 px-2.5 text-xs rounded-lg border transition-all shadow-none ${
            showGuides
              ? "border-primary/40 bg-primary/10 text-primary font-medium"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
          title={t("templateEditor.toggleGuides")}
        >
          {showGuides ? (
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </Button>
      </div>

      {onTogglePreview && (
        <Button
          type="button"
          onClick={onTogglePreview}
          variant={isPreviewMode ? "default" : "outline"}
          className={`min-h-11 px-3 text-xs font-semibold rounded-lg border transition-all shadow-none flex items-center gap-1.5 ms-2 ${
            isPreviewMode
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "border-border hover:bg-muted"
          }`}
          title={isPreviewMode ? "Switch to Edit Mode" : "Switch to Live Preview"}
        >
          {isPreviewMode ? (
            <>
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Edit Mode</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Preview</span>
            </>
          )}
        </Button>
      )}

      {onZoomIn && onZoomOut && (
        <TemplateEditorZoomControls
          canvasScale={canvasScale}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
          onZoomFit={onZoomFit}
        />
      )}

      {presets.length > 0 && (
        <div className="flex items-center gap-1 ms-2">
          <LayoutTemplate className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          <FormSelect
            aria-label={t("templateEditor.presets")}
            value=""
            onChange={(val) => {
              if (val) onApplyPreset(val);
            }}
            options={[
              { value: "", label: t("templateEditor.presets") },
              ...presets.map((p) => ({ value: p.key, label: p.label })),
            ]}
            className="h-8 text-xs py-0 min-w-[130px]"
          />
        </div>
      )}

      <TemplateEditorExportActions
        onExportJson={onExportJson}
        onImportJson={onImportJson}
        onExportTypst={onExportTypst}
        onExportZoho={onExportZoho}
        t={t}
      />

      <div className="ms-auto flex items-center gap-2">
        <Button
          type="button"
          onClick={onResetDefault}
          variant="outline"
          className="min-h-11 px-2.5 text-xs font-semibold rounded border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t("templateEditor.resetDefault")}</span>
        </Button>

        {onToggleFullscreen && (
          <Button
            type="button"
            onClick={onToggleFullscreen}
            variant="outline"
            className="min-h-11 px-2 text-xs rounded border border-border hover:bg-muted transition-colors shadow-none"
            title={t("templateEditor.toggleFullscreen")}
          >
            {fullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </Button>
        )}

        <Button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`min-h-11 px-4 text-xs font-semibold rounded transition-colors shadow-none flex items-center gap-1.5 ${
            saved
              ? "bg-emerald-600 hover:bg-emerald-600 text-white"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            {saved ? t("templateEditor.saved") : t("templateEditor.save")}
          </span>
        </Button>

        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          className="min-h-11 px-3 text-xs font-semibold rounded border-border hover:bg-muted transition-colors shadow-none"
        >
          {t("templateEditor.close")}
        </Button>
      </div>
    </header>
  );
}
