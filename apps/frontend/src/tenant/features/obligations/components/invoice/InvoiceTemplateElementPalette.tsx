import type React from "react";
import { Minus, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AVAILABLE_FIELDS } from "@/lib/invoiceTemplateStore";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export type InvoiceTemplateFieldOption = (typeof AVAILABLE_FIELDS)[number];

interface InvoiceTemplateElementPaletteProps {
  onAddStaticText: () => void;
  onAddDivider: () => void;
  onAddField: (fieldOption: InvoiceTemplateFieldOption) => void;
  t: TranslationFunction;
}

export function InvoiceTemplateElementPalette({
  onAddStaticText,
  onAddDivider,
  onAddField,
  t,
}: InvoiceTemplateElementPaletteProps): React.JSX.Element {
  return (
    <aside className="max-h-48 w-full shrink-0 space-y-4 overflow-y-auto border-b border-border bg-card p-3 lg:max-h-none lg:w-48 lg:border-b-0 lg:border-e">
      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">{t("obligations.invoiceTemplate.addElements")}</p>
        <div className="space-y-1">
          <Button
            type="button"
            onClick={onAddStaticText}
            variant="outline"
            className="w-full text-start min-h-11 px-2.5 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors flex items-center gap-2 shadow-none justify-start"
          >
            <Type className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> {t("obligations.invoiceTemplate.staticText")}
          </Button>
          <Button
            type="button"
            onClick={onAddDivider}
            variant="outline"
            className="w-full text-start min-h-11 px-2.5 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors flex items-center gap-2 shadow-none justify-start"
          >
            <Minus className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" /> {t("obligations.invoiceTemplate.dividerLine")}
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">{t("obligations.invoiceTemplate.addFields")}</p>
        <div className="space-y-1">
          {AVAILABLE_FIELDS.map((fieldOption) => (
            <Button
              type="button"
              key={fieldOption.field}
              onClick={() => onAddField(fieldOption)}
              variant="outline"
              className="w-full text-start min-h-11 px-2.5 py-2 text-xs font-medium rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors shadow-none justify-start"
            >
              {fieldOption.label}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}
