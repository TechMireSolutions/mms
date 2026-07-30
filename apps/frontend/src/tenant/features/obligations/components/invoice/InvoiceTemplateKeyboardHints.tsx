import type React from "react";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface InvoiceTemplateKeyboardHintsProps {
  t: TranslationFunction;
}

export function InvoiceTemplateKeyboardHints({ t }: InvoiceTemplateKeyboardHintsProps): React.JSX.Element {
  return (
    <footer className="flex-shrink-0 border-t border-border bg-card px-4 py-1.5 flex items-center gap-4 flex-wrap">
      {[
        ["Ctrl+Z", t("obligations.invoiceTemplate.hintUndo")],
        ["Ctrl+Y", t("obligations.invoiceTemplate.hintRedo")],
        ["Ctrl+D", t("obligations.invoiceTemplate.hintDuplicate")],
        ["Del", t("obligations.invoiceTemplate.hintDelete")],
        ["Esc", t("obligations.invoiceTemplate.hintDeselect")],
      ].map(([shortcutKey, shortcutLabel]) => (
        <span key={shortcutKey} className="text-xs text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-foreground font-mono text-xs">{shortcutKey}</kbd> {shortcutLabel}
        </span>
      ))}
    </footer>
  );
}
