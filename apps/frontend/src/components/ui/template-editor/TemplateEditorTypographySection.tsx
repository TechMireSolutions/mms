/**
 * @file TemplateEditorTypographySection.tsx
 * @description Inspector section for font family, size, color swatches, weight, alignment, and RTL.
 */

import React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/FormSelect";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { ElementStyle } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { StyleBtn, StyleInput } from "./TemplateEditorStyleControls";

export interface TemplateEditorTypographySectionProps {
  elementId: string;
  elStyle: ElementStyle;
  onPatchStyle: (elementId: string, stylePatch: Partial<ElementStyle>) => void;
  primaryColor?: string;
  secondaryColor?: string;
  t: TranslationFunction;
}

// Stable outside component — recreating this array on every render is wasteful
const STATIC_SWATCHES = [
  { labelKey: "Dark", color: "#0f172a" },
  { labelKey: "Muted", color: "#64748b" },
  { labelKey: "Emerald", color: "#10b981" },
  { labelKey: "Amber", color: "#f59e0b" },
  { labelKey: "Red", color: "#ef4444" },
] as const;

export function TemplateEditorTypographySection({
  elementId,
  elStyle,
  onPatchStyle,
  primaryColor,
  secondaryColor,
  t,
}: TemplateEditorTypographySectionProps): React.JSX.Element {
  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest m-0">
        {t("templateEditor.typography")}
      </p>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
          {t("templateEditor.fontFamily")}
        </label>
        <FormSelect
          aria-label="Font Family"
          value={elStyle.fontFamily || "Inter, sans-serif"}
          onChange={(val) => onPatchStyle(elementId, { fontFamily: val })}
          options={[
            { value: "Inter, sans-serif", label: "Inter (Modern Sans)" },
            { value: "'Amiri', serif", label: "Amiri (Arabic Serif)" },
            { value: "'Cairo', sans-serif", label: "Cairo (Arabic Modern)" },
            { value: "'Noto Nastaliq Urdu', serif", label: "Nastaliq (Urdu)" },
            { value: "monospace", label: "Monospace (Numbers)" },
          ]}
          className="h-8 text-xs py-0 w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StyleInput
          label={t("templateEditor.fontSize")}
          type="number"
          min={6}
          max={72}
          value={elStyle.fontSize || 10}
          onChange={(val) => onPatchStyle(elementId, { fontSize: Number(val) })}
        />
        <div className="flex flex-col gap-0.5">
          <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
            {t("templateEditor.color")}
          </label>
          <input
            type="color"
            value={elStyle.color || PRINT_NEUTRAL.text}
            onChange={(e) => onPatchStyle(elementId, { color: e.target.value })}
            className="w-full min-h-11 h-11 p-1 border border-border rounded-lg bg-background cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] text-muted-foreground font-semibold">{t("templateEditor.themePalette")}:</span>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { labelKey: "Primary", color: primaryColor || "#059669" },
            { labelKey: "Secondary", color: secondaryColor || "#047857" },
            ...STATIC_SWATCHES,
          ].map((swatch) => {
            const isSelected = (elStyle.color || "").toLowerCase() === swatch.color.toLowerCase();
            return (
              <button
                key={swatch.color}
                type="button"
                title={swatch.labelKey}
                onClick={() => onPatchStyle(elementId, { color: swatch.color })}
                style={{ backgroundColor: swatch.color }}
                className={`w-6 h-6 rounded-full border transition-all cursor-pointer shadow-xs ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 border-transparent"
                    : "border-border/80 hover:scale-110"
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <StyleBtn
          active={elStyle.fontWeight === "bold"}
          onClick={() =>
            onPatchStyle(elementId, {
              fontWeight: elStyle.fontWeight === "bold" ? "normal" : "bold",
            })
          }
          title={t("templateEditor.bold")}
        >
          <Bold className="w-3.5 h-3.5" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={elStyle.fontStyle === "italic"}
          onClick={() =>
            onPatchStyle(elementId, {
              fontStyle: elStyle.fontStyle === "italic" ? "normal" : "italic",
            })
          }
          title={t("templateEditor.italic")}
        >
          <Italic className="w-3.5 h-3.5" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={elStyle.textAlign === "left" || !elStyle.textAlign}
          onClick={() => onPatchStyle(elementId, { textAlign: "left" })}
          title={t("templateEditor.alignLeft")}
        >
          <AlignLeft className="w-3.5 h-3.5" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={elStyle.textAlign === "center"}
          onClick={() => onPatchStyle(elementId, { textAlign: "center" })}
          title={t("templateEditor.alignCenter")}
        >
          <AlignCenter className="w-3.5 h-3.5" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={elStyle.textAlign === "right"}
          onClick={() => onPatchStyle(elementId, { textAlign: "right" })}
          title={t("templateEditor.alignRight")}
        >
          <AlignRight className="w-3.5 h-3.5" aria-hidden="true" />
        </StyleBtn>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id={`dir-rtl-toggle-${elementId}`}
          checked={elStyle.direction === "rtl"}
          onCheckedChange={(checked) =>
            onPatchStyle(elementId, { direction: checked ? "rtl" : "ltr" })
          }
        />
        <label htmlFor={`dir-rtl-toggle-${elementId}`} className="text-xs font-medium cursor-pointer">
          {t("templateEditor.rtl")}
        </label>
      </div>
    </div>
  );
}
