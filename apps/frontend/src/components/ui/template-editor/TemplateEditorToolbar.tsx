/**
 * @file TemplateEditorToolbar.tsx
 * @description Top command toolbar providing undo/redo, page geometry, preset selection, Typst/Zoho export, and save actions.
 */

import React from "react";
import {
  Eye,
  EyeOff,
  LayoutTemplate,
  Maximize2,
  Minimize2,
  RectangleHorizontal,
  RectangleVertical,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
  FileCode2,
  CloudUpload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import {
  PAGE_SIZES,
  type DocumentTemplate,
  type DocumentTemplatePreset,
  type TemplateOrientation,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

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
  onUndo: () => void;
  onRedo: () => void;
  onPageSizeChange: (pageSizeKey: string) => void;
  onOrientationChange: (orientation: TemplateOrientation) => void;
  onToggleGuides: () => void;
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
  onUndo,
  onRedo,
  onPageSizeChange,
  onOrientationChange,
  onToggleGuides,
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

      <div className="flex items-center gap-1.5 ms-2">
        <span className="text-xs text-muted-foreground font-semibold">
          {t("templateEditor.pageSize")}
        </span>
        {Object.entries(PAGE_SIZES).map(([pageSizeKey]) => (
          <Button
            type="button"
            key={pageSizeKey}
            onClick={() => onPageSizeChange(pageSizeKey)}
            variant={template.pageSize === pageSizeKey ? "default" : "outline"}
            className={`min-h-11 px-2.5 text-xs font-semibold rounded border transition-colors shadow-none ${
              template.pageSize === pageSizeKey
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {pageSizeKey}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1 ms-2">
        <Button
          type="button"
          onClick={() =>
            onOrientationChange(
              template.orientation === "landscape" ? "portrait" : "landscape"
            )
          }
          variant="outline"
          className="min-h-11 px-2.5 text-xs font-semibold rounded border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
          title={
            template.orientation === "landscape"
              ? t("templateEditor.portrait")
              : t("templateEditor.landscape")
          }
        >
          {template.orientation === "landscape" ? (
            <>
              <RectangleHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("templateEditor.landscape")}</span>
            </>
          ) : (
            <>
              <RectangleVertical className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("templateEditor.portrait")}</span>
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-1 ms-2">
        <Button
          type="button"
          onClick={onToggleGuides}
          variant="outline"
          className={`min-h-11 px-2 text-xs rounded border transition-colors shadow-none ${
            showGuides
              ? "border-primary/40 bg-primary/10 text-primary"
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

      {onExportTypst && (
        <Button
          type="button"
          onClick={onExportTypst}
          variant="outline"
          className="min-h-11 px-2.5 text-xs font-semibold rounded border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
          title={t("templateEditor.exportTypst")}
        >
          <FileCode2 className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
          <span>Typst</span>
        </Button>
      )}

      {onExportZoho && (
        <Button
          type="button"
          onClick={onExportZoho}
          variant="outline"
          className="min-h-11 px-2.5 text-xs font-semibold rounded border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
          title={t("templateEditor.exportZoho")}
        >
          <CloudUpload className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
          <span>Zoho</span>
        </Button>
      )}

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
