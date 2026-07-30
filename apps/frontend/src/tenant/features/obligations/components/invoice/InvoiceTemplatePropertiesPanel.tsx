import type React from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Copy, Italic, Move, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/FormSelect";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { ElementStyle, TemplateElement } from "@/lib/invoiceTemplateStore";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { StyleBtn, StyleInput } from "./InvoiceTemplateStyleControls";
import { snap, SNAP } from "./invoiceTemplateEditorUtils";

interface InvoiceTemplatePropertiesPanelProps {
  selectedElement: TemplateElement | undefined;
  onPatchElement: (elementId: string, patch: Partial<TemplateElement>) => void;
  onPatchStyle: (elementId: string, stylePatch: Partial<ElementStyle>) => void;
  onDuplicateElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  t: TranslationFunction;
}

export function InvoiceTemplatePropertiesPanel({
  selectedElement,
  onPatchElement,
  onPatchStyle,
  onDuplicateElement,
  onDeleteElement,
  t,
}: InvoiceTemplatePropertiesPanelProps): React.JSX.Element {
  return (
    <aside className="max-h-64 w-full shrink-0 space-y-4 overflow-y-auto border-t border-border bg-card p-3 lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s">
      {!selectedElement ? (
        <div className="text-xs text-muted-foreground text-center pt-10 space-y-1">
          <Move className="w-6 h-6 mx-auto opacity-30" aria-hidden="true" />
          <p className="m-0">{t("obligations.invoiceTemplate.emptyHint")}</p>
          <p className="text-xs opacity-60 m-0">{t("obligations.invoiceTemplate.emptyHintDetail")}</p>
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">
              {selectedElement.type === "field"
                ? t("obligations.invoiceTemplate.propsField")
                : selectedElement.type === "logo"
                ? t("obligations.invoiceTemplate.propsLogo")
                : selectedElement.type === "divider"
                ? t("obligations.invoiceTemplate.propsDivider")
                : t("obligations.invoiceTemplate.propsText")}
            </p>

            {selectedElement.type === "static" && (
              <StyleInput
                label={t("obligations.invoiceTemplate.content")}
                value={selectedElement.label || ""}
                onChange={(nextValue) => onPatchElement(selectedElement.id, { label: String(nextValue) })}
              />
            )}
            {selectedElement.type === "field" && (
              <StyleInput
                label={t("obligations.invoiceTemplate.displayLabel")}
                value={selectedElement.label || ""}
                onChange={(nextValue) => onPatchElement(selectedElement.id, { label: String(nextValue) })}
              />
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">{t("obligations.invoiceTemplate.positionSize")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <StyleInput label="X" type="number" value={selectedElement.x} onChange={(nextValue) => onPatchElement(selectedElement.id, { x: snap(Number(nextValue)) })} step={SNAP} />
              <StyleInput label="Y" type="number" value={selectedElement.y} onChange={(nextValue) => onPatchElement(selectedElement.id, { y: snap(Number(nextValue)) })} step={SNAP} />
              <StyleInput label="W" type="number" value={selectedElement.w || 0} onChange={(nextValue) => onPatchElement(selectedElement.id, { w: snap(Number(nextValue)) })} min={20} step={SNAP} />
              <StyleInput label="H" type="number" value={selectedElement.h || 0} onChange={(nextValue) => onPatchElement(selectedElement.id, { h: snap(Number(nextValue)) })} min={4} step={SNAP} />
            </div>
          </div>

          {selectedElement.type !== "logo" && selectedElement.type !== "divider" && (
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">{t("obligations.invoiceTemplate.typography")}</p>
              <div className="space-y-2">
                <StyleInput
                  label={t("obligations.invoiceTemplate.fontSize")}
                  type="number"
                  value={selectedElement.style?.fontSize || 10}
                  onChange={(nextValue) => onPatchStyle(selectedElement.id, { fontSize: Number(nextValue) })}
                  min={7}
                  max={72}
                />
                <StyleInput
                  label={t("obligations.invoiceTemplate.color")}
                  type="color"
                  value={selectedElement.style?.color || PRINT_NEUTRAL.text}
                  onChange={(nextValue) => onPatchStyle(selectedElement.id, { color: String(nextValue) })}
                />
                <div className="flex gap-1">
                  <StyleBtn
                    title={t("obligations.invoiceTemplate.bold")}
                    active={selectedElement.style?.fontWeight === "bold"}
                    onClick={() => onPatchStyle(selectedElement.id, { fontWeight: selectedElement.style?.fontWeight === "bold" ? "normal" : "bold" })}
                  >
                    <Bold className="w-3 h-3" aria-hidden="true" />
                  </StyleBtn>
                  <StyleBtn
                    title={t("obligations.invoiceTemplate.italic")}
                    active={selectedElement.style?.fontStyle === "italic"}
                    onClick={() => onPatchStyle(selectedElement.id, { fontStyle: selectedElement.style?.fontStyle === "italic" ? "normal" : "italic" })}
                  >
                    <Italic className="w-3 h-3" aria-hidden="true" />
                  </StyleBtn>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">{t("obligations.invoiceTemplate.alignment")}</span>
                  <div className="flex gap-1">
                    <StyleBtn
                      title={t("obligations.invoiceTemplate.alignLeft")}
                      active={selectedElement.style?.textAlign === "left"}
                      onClick={() => onPatchStyle(selectedElement.id, { textAlign: "left" })}
                    >
                      <AlignLeft className="w-3 h-3" aria-hidden="true" />
                    </StyleBtn>
                    <StyleBtn
                      title={t("obligations.invoiceTemplate.alignCenter")}
                      active={selectedElement.style?.textAlign === "center"}
                      onClick={() => onPatchStyle(selectedElement.id, { textAlign: "center" })}
                    >
                      <AlignCenter className="w-3 h-3" aria-hidden="true" />
                    </StyleBtn>
                    <StyleBtn
                      title={t("obligations.invoiceTemplate.alignRight")}
                      active={selectedElement.style?.textAlign === "right"}
                      onClick={() => onPatchStyle(selectedElement.id, { textAlign: "right" })}
                    >
                      <AlignRight className="w-3 h-3" aria-hidden="true" />
                    </StyleBtn>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">{t("obligations.invoiceTemplate.font")}</span>
                  <FormSelect
                    value={selectedElement.style?.fontFamily || "inherit"}
                    onChange={(fontFamily) => onPatchStyle(selectedElement.id, { fontFamily })}
                    className="w-full"
                    options={[
                      { value: "inherit", label: t("obligations.invoiceTemplate.fontDefault") },
                      { value: "serif", label: t("obligations.invoiceTemplate.fontSerif") },
                      { value: "monospace", label: t("obligations.invoiceTemplate.fontMono") },
                      { value: "'Amiri', serif", label: t("obligations.invoiceTemplate.fontAmiri") },
                      { value: "Arial, sans-serif", label: t("obligations.invoiceTemplate.fontArial") },
                      { value: "Georgia, serif", label: t("obligations.invoiceTemplate.fontGeorgia") },
                    ]}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                  <Checkbox
                    checked={selectedElement.style?.direction === "rtl"}
                    onCheckedChange={(checked) => onPatchStyle(selectedElement.id, { direction: checked ? "rtl" : "ltr" })}
                  />
                  {t("obligations.invoiceTemplate.rtl")}
                </label>
              </div>
            </div>
          )}

          {selectedElement.type === "divider" && (
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">{t("obligations.invoiceTemplate.divider")}</p>
              <StyleInput
                label={t("obligations.invoiceTemplate.color")}
                type="color"
                value={selectedElement.style?.color || PRINT_NEUTRAL.border}
                onChange={(nextValue) => onPatchStyle(selectedElement.id, { color: String(nextValue) })}
              />
            </div>
          )}

          <div className="pt-2 border-t border-border flex gap-2">
            <Button
              type="button"
              onClick={() => onDuplicateElement(selectedElement.id)}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-1 min-h-11 px-2 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none"
            >
              <Copy className="w-3 h-3" aria-hidden="true" /> {t("obligations.invoiceTemplate.duplicate")}
            </Button>
            <Button
              type="button"
              onClick={() => onDeleteElement(selectedElement.id)}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-1 min-h-11 px-2 py-2 text-xs font-semibold rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors shadow-none"
            >
              <Trash2 className="w-3 h-3" aria-hidden="true" /> {t("obligations.invoiceTemplate.delete")}
            </Button>
          </div>
        </>
      )}
    </aside>
  );
}
