import type React from "react";
import { Eye, EyeOff, Redo2, Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAGE_SIZES, type InvoiceTemplate } from "@/lib/invoiceTemplateStore";
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
  onToggleGuides: () => void;
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
  onToggleGuides,
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

      <div className="ms-auto flex items-center gap-2">
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
