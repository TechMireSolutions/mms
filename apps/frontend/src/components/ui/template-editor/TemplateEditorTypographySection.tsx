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
  Underline,
  Type,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/FormSelect";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { ElementStyle } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { StyleBtn, StyleInput } from "./TemplateEditorStyleControls";
import { normalizeHexColor } from "./templateEditorUtils";
import { TemplateEditorSection } from "./TemplateEditorSection";

export interface TemplateEditorTypographySectionProps {
  elementId: string;
  elStyle: ElementStyle;
  isOpen: boolean;
  onToggle: () => void;
  onPatchStyle: (elementId: string, stylePatch: Partial<ElementStyle>) => void;
  primaryColor?: string;
  secondaryColor?: string;
  /** Whether the *application* is rendered right-to-left (ar/ur/fa). */
  isRtl: boolean;
  t: TranslationFunction;
}

/*
 * Swatch colours stay literal hex on purpose: they are print-ink colours, so they
 * must not follow the dark/light UI theme. The names are translated, the values are
 * not derived from tokens.
 */
const SWATCHES = [
  { labelKey: "templateEditor.swatchText", color: PRINT_NEUTRAL.text },
  { labelKey: "templateEditor.swatchMuted", color: PRINT_NEUTRAL.muted },
  { labelKey: "templateEditor.swatchSuccess", color: "#10b981" },
  { labelKey: "templateEditor.swatchWarning", color: "#f59e0b" },
  { labelKey: "templateEditor.swatchDestructive", color: "#ef4444" },
] as const;

/*
 * Font stacks are invariant proper nouns — the descriptor that used to follow each
 * name ("Modern Sans", "Arabic Serif", …) was English prose in a translated menu and
 * has been dropped rather than left untranslated.
 */
const FONT_OPTIONS = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "'Amiri', serif", label: "Amiri" },
  { value: "'Cairo', sans-serif", label: "Cairo" },
  { value: "'Noto Nastaliq Urdu', serif", label: "Noto Nastaliq Urdu" },
  { value: "monospace", label: "Monospace" },
];

export function TemplateEditorTypographySection({
  elementId,
  elStyle,
  isOpen,
  onToggle,
  onPatchStyle,
  primaryColor,
  secondaryColor,
  isRtl,
  t,
}: TemplateEditorTypographySectionProps): React.JSX.Element {
  const startAlign = isRtl ? "right" : "left";
  const endAlign = isRtl ? "left" : "right";

  const swatches = [
    { label: t("templateEditor.swatchBrandPrimary"), color: primaryColor || "#059669" },
    { label: t("templateEditor.swatchBrandSecondary"), color: secondaryColor || "#047857" },
    ...SWATCHES.map((s) => ({ label: t(s.labelKey), color: s.color })),
  ];

  return (
    <TemplateEditorSection
      titleKey="templateEditor.typography"
      icon={Type}
      isOpen={isOpen}
      onToggle={onToggle}
      t={t}
    >
      <div className="space-y-1">
        <label htmlFor={`font-family-${elementId}`} className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
          {t("templateEditor.fontFamily")}
        </label>
        <FormSelect
          id={`font-family-${elementId}`}
          aria-label={t("templateEditor.fontFamily")}
          value={elStyle.fontFamily || "Inter, sans-serif"}
          onChange={(val) => onPatchStyle(elementId, { fontFamily: val })}
          options={FONT_OPTIONS}
          className="h-11 text-xs py-0 w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StyleInput
          label={t("templateEditor.fontSize")}
          type="number"
          min={6}
          max={72}
          value={elStyle.fontSize || 10}
          onChange={(val) => {
            const num = Number(val);
            if (!Number.isNaN(num)) {
              onPatchStyle(elementId, { fontSize: Math.max(6, Math.min(72, num)) });
            }
          }}
        />
        <div className="flex flex-col gap-0.5">
          <label htmlFor={`font-color-${elementId}`} className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
            {t("templateEditor.color")}
          </label>
          <input
            id={`font-color-${elementId}`}
            name={`font-color-${elementId}`}
            aria-label={t("templateEditor.color")}
            type="color"
            value={normalizeHexColor(elStyle.color, PRINT_NEUTRAL.text)}
            onChange={(e) => onPatchStyle(elementId, { color: e.target.value })}
            className="w-full min-h-11 h-11 p-1 border border-border rounded-lg bg-background cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-3xs text-muted-foreground font-semibold">{t("templateEditor.themePalette")}:</span>
        <div className="flex items-center gap-0.5 flex-wrap">
          {swatches.map((swatch) => {
            const isSelected = (elStyle.color || "").toLowerCase() === swatch.color.toLowerCase();
            return (
              <button
                key={swatch.color}
                type="button"
                title={swatch.label}
                aria-label={swatch.label}
                aria-pressed={isSelected}
                onClick={() => onPatchStyle(elementId, { color: swatch.color })}
                className="min-h-11 min-w-11 flex items-center justify-center p-1 rounded-lg hover:bg-muted/40 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              >
                <span
                  style={{ backgroundColor: swatch.color }}
                  className={`w-6 h-6 rounded-full border transition-all shadow-xs ${
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 border-transparent"
                      : "border-border/80 hover:scale-110"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div role="group" aria-label={t("templateEditor.textStyle")} className="flex flex-wrap items-center gap-1.5">
        <StyleBtn
          active={elStyle.fontWeight === "bold"}
          onClick={() =>
            onPatchStyle(elementId, {
              fontWeight: elStyle.fontWeight === "bold" ? "normal" : "bold",
            })
          }
          title={t("templateEditor.bold")}
        >
          <Bold className="w-4 h-4" aria-hidden="true" />
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
          <Italic className="w-4 h-4" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={elStyle.textDecoration === "underline"}
          onClick={() =>
            onPatchStyle(elementId, {
              textDecoration: elStyle.textDecoration === "underline" ? "none" : "underline",
            })
          }
          title={t("templateEditor.underline")}
        >
          <Underline className="w-4 h-4" aria-hidden="true" />
        </StyleBtn>

        {/*
         * Alignment is presented as start/end, not left/right: in an Urdu or Arabic
         * workspace "align left" is the *end* of the line, and the icons mirror with
         * `rtl:-scale-x-100` so the glyph points at the edge it actually aligns to.
         */}
        <StyleBtn
          active={elStyle.textAlign === startAlign || !elStyle.textAlign}
          onClick={() => onPatchStyle(elementId, { textAlign: startAlign })}
          title={t("templateEditor.alignStart")}
        >
          <AlignLeft className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={elStyle.textAlign === "center"}
          onClick={() => onPatchStyle(elementId, { textAlign: "center" })}
          title={t("templateEditor.alignCenter")}
        >
          <AlignCenter className="w-4 h-4" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={elStyle.textAlign === endAlign}
          onClick={() => onPatchStyle(elementId, { textAlign: endAlign })}
          title={t("templateEditor.alignEnd")}
        >
          <AlignRight className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
        </StyleBtn>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id={`dir-rtl-toggle-${elementId}`}
          checked={elStyle.direction === "rtl"}
          onCheckedChange={(checked) =>
            onPatchStyle(elementId, { direction: checked === true ? "rtl" : "ltr" })
          }
        />
        <label htmlFor={`dir-rtl-toggle-${elementId}`} className="text-xs font-medium cursor-pointer">
          {t("templateEditor.rtl")}
        </label>
      </div>
    </TemplateEditorSection>
  );
}
