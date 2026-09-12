import type React from "react";
import { Eye, EyeOff, LayoutTemplate, Maximize2, Minimize2, RectangleHorizontal, RectangleVertical, Redo2, RotateCcw, Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { PAGE_SIZES, type InvoiceTemplate, type TemplateOrientation } from "@/lib/invoiceTemplateStore";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface InvoiceTemplateToolbarProps {
  template: InvoiceTemplate;
  historyLength: number;
  futureLength: number;
  saved: boolean;
  showGuides: boolean;
  fullscreen: boolean;
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
  t: TranslationFunction;
}

export function InvoiceTemplateToolbar({
  template,
  historyLength,
  futureLength,
  saved,
  showGuides,
  fullscreen,
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
  t,
}: InvoiceTemplateToolbarProps): React.JSX.Element {
  return (
    <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card flex-shrink-0 flex-wrap">
      <h2 className="font-bold text-sm text-foreground m-0">{t("obligations.invoiceTemplate.title")}</h2>
      <div className="flex items-center gap-1 ms-2">
        <Button
          type="button"
          onClick={onUndo}
          disabled={!historyLength}
          title={t("obligations.invoiceTemplate.undo")}
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
          title={t("obligations.invoiceTemplate.redo")}
          variant="ghost"
          size="icon"
          className="rounded hover:bg-muted disabled:opacity-30 transition-colors shadow-none"
        >
          <Redo2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex items-center gap-1.5 ms-2">
        <span className="text-xs text-muted-foreground font-semibold">{t("obligations.invoiceTemplate.page")}</span>
        {Object.entries(PAGE_SIZES).map(([pageSizeKey]) => (
          <Button
            type="button"
            key={pageSizeKey}
            onClick={() => onPageSizeChange(pageSizeKey)}
            variant={template.pageSize === pageSizeKey ? "default" : "outline"}
            className={`min-h-11 px-2.5 text-xs font-semibold rounded border transition-colors shadow-none ${template.pageSize === pageSizeKey ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
          >
            {pageSizeKey}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1 ms-2">
        <Button
          type="button"
          onClick={() => onOrientationChange(template.orientation === "landscape" ? "portrait" : "landscape")}
          variant="outline"
          className="min-h-11 px-2.5 text-xs font-semibold rounded border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
          title={template.orientation === "landscape" ? t("obligations.invoiceTemplate.portrait") : t("obligations.invoiceTemplate.landscape")}
          aria-label={t("obligations.invoiceTemplate.orientation")}
        >
          {template.orientation === "landscape" ? (
            <>
              <RectangleHorizontal className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>{t("obligations.invoiceTemplate.landscape")}</span>
            </>
          ) : (
            <>
              <RectangleVertical className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>{t("obligations.invoiceTemplate.portrait")}</span>
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-1.5 ms-2">
        <LayoutTemplate className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
        <FormSelect
          id="inv-presets-select"
          name="presets"
          aria-label={t("obligations.invoiceTemplate.presets")}
          value=""
          placeholder={t("obligations.invoiceTemplate.presets")}
          onChange={(val) => { if (val) onApplyPreset(val); }}
          className="text-xs h-9 min-h-9 w-40"
          options={[
            { value: "classic_a6", label: t("obligations.invoiceTemplate.presetClassic") },
            { value: "thermal_80mm", label: t("obligations.invoiceTemplate.presetThermal") },
            { value: "formal_a5", label: t("obligations.invoiceTemplate.presetFormal") },
            { value: "modern_a6", label: t("obligations.invoiceTemplate.presetModern") },
          ]}
        />
      </div>

      <Button
        type="button"
        onClick={onToggleGuides}
        title={t("obligations.invoiceTemplate.toggleGuides")}
        variant="ghost"
        size="icon"
        className="rounded hover:bg-muted transition-colors ms-1 shadow-none"
      >
        {showGuides ? <Eye className="w-4 h-4 text-primary" aria-hidden="true" /> : <EyeOff className="w-4 h-4 text-muted-foreground" aria-hidden="true" />}
      </Button>

      <Button
        type="button"
        onClick={onResetDefault}
        title={t("obligations.invoiceTemplate.resetDefault")}
        variant="ghost"
        className="min-h-11 px-2.5 text-xs font-medium rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ms-1 shadow-none flex items-center gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{t("obligations.invoiceTemplate.resetDefault")}</span>
      </Button>

      <div className="ms-auto flex items-center gap-2">
        {onToggleFullscreen && (
          <Button
            type="button"
            onClick={onToggleFullscreen}
            title={fullscreen ? t("obligations.invoiceTemplate.exitFullscreen") : t("obligations.invoiceTemplate.fullscreen")}
            variant="outline"
            className="min-h-11 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
            aria-label={fullscreen ? t("obligations.invoiceTemplate.exitFullscreen") : t("obligations.invoiceTemplate.fullscreen")}
          >
            {fullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t("obligations.invoiceTemplate.exitFullscreen")}</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t("obligations.invoiceTemplate.fullscreen")}</span>
              </>
            )}
          </Button>
        )}
        <Button
          type="button"
          onClick={onSave}
          className="flex min-h-11 items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? t("obligations.invoiceTemplate.saved") : t("obligations.invoiceTemplate.save")}
        </Button>
        {fullscreen && (
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="min-h-11 px-3 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none"
          >
            {t("obligations.invoiceTemplate.close")}
          </Button>
        )}
      </div>
    </header>
  );

}
