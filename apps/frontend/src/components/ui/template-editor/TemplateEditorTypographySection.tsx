/**
 * @file TemplateEditorTypographySection.tsx
 * @description Inspector section for font family, size, color swatches, weight, alignment, and RTL.
 */

import React, { useId, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Minus,
  Plus,
  Strikethrough,
  Type,
  Underline,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/FormSelect";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { ElementStyle, TemplateElement } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { StyleBtn } from "./TemplateEditorStyleControls";
import { normalizeHexColor } from "./templateEditorUtils";
import { TemplateEditorSection } from "./TemplateEditorSection";

export interface TemplateEditorTypographySectionProps {
  elementId?: string;
  elStyle: Partial<ElementStyle>;
  selectedElements?: TemplateElement[];
  isOpen: boolean;
  onToggle: () => void;
  onPatchStyle: (stylePatch: Partial<ElementStyle>) => void;
  primaryColor?: string;
  secondaryColor?: string;
  /** Whether the *application* is rendered right-to-left (ar/ur/fa). */
  isRtl?: boolean;
  t: TranslationFunction;
}

/*
 * Swatch colours stay literal hex on purpose: they are print-ink colours, so they
 * must not follow the dark/light UI theme. The names are translated, the values are
 * not derived from tokens.
 */
export const SWATCHES = [
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
export const FONT_OPTIONS = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "'Amiri', serif", label: "Amiri" },
  { value: "'Cairo', sans-serif", label: "Cairo" },
  { value: "'Noto Nastaliq Urdu', serif", label: "Noto Nastaliq Urdu" },
  { value: "monospace", label: "Monospace" },
];

export function TemplateEditorTypographySection({
  elStyle,
  selectedElements,
  isOpen,
  onToggle,
  onPatchStyle,
  primaryColor,
  secondaryColor,
  isRtl = false,
  t,
}: TemplateEditorTypographySectionProps): React.JSX.Element {
  const fontFamilyId = useId();
  const fontSizeId = useId();
  const fontColorId = useId();
  const rtlToggleId = useId();

  const handlePatch = onPatchStyle;

  const isMulti = Boolean(selectedElements && selectedElements.length > 1);
  const textElements = isMulti
    ? selectedElements!.filter((el) => el.type === "static" || el.type === "field")
    : [];
  const targetElements = textElements.length > 0 ? textElements : (selectedElements ?? []);

  const allBold = isMulti
    ? targetElements.length > 0 && targetElements.every((el) => el.style?.fontWeight === "bold")
    : elStyle.fontWeight === "bold";

  const allItalic = isMulti
    ? targetElements.length > 0 && targetElements.every((el) => el.style?.fontStyle === "italic")
    : elStyle.fontStyle === "italic";

  const allUnderline = isMulti
    ? targetElements.length > 0 && targetElements.every((el) => el.style?.textDecoration === "underline")
    : elStyle.textDecoration === "underline";

  const allStrikethrough = isMulti
    ? targetElements.length > 0 && targetElements.every((el) => el.style?.textDecoration === "line-through")
    : elStyle.textDecoration === "line-through";

  const hasRtl = isMulti && targetElements.some((el) => el.style?.direction === "rtl");
  const allRtl = isMulti
    ? targetElements.length > 0 && targetElements.every((el) => el.style?.direction === "rtl")
    : elStyle.direction === "rtl";
  const isMixedRtl = isMulti && hasRtl && !allRtl;

  const startAlign = isRtl ? "right" : "left";
  const endAlign = isRtl ? "left" : "right";

  const allAlignStart = isMulti
    ? targetElements.length > 0 &&
      targetElements.every((el) => (el.style?.textAlign || startAlign) === startAlign)
    : (elStyle.textAlign === startAlign || !elStyle.textAlign);

  const allAlignCenter = isMulti
    ? targetElements.length > 0 &&
      targetElements.every((el) => el.style?.textAlign === "center")
    : elStyle.textAlign === "center";

  const allAlignEnd = isMulti
    ? targetElements.length > 0 &&
      targetElements.every((el) => el.style?.textAlign === endAlign)
    : elStyle.textAlign === endAlign;

  const allAlignJustify = isMulti
    ? targetElements.length > 0 &&
      targetElements.every((el) => el.style?.textAlign === "justify")
    : elStyle.textAlign === "justify";

  const effectiveColor = normalizeHexColor(elStyle.color, PRINT_NEUTRAL.text).toLowerCase();
  const allSameColor = isMulti
    ? targetElements.length > 0 &&
      targetElements.every(
        (el) => normalizeHexColor(el.style?.color, PRINT_NEUTRAL.text).toLowerCase() === effectiveColor
      )
    : true;

  const currentFontSize = Number(elStyle.fontSize ?? 10) || 10;
  const [fontSizeDraft, setFontSizeDraft] = useState<string | null>(null);
  const displayFontSize = fontSizeDraft ?? String(currentFontSize);

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFontSizeDraft(val);
    const num = Number(val);
    if (!Number.isNaN(num) && num >= 6 && num <= 72) {
      handlePatch({ fontSize: num });
    }
  };

  const handleFontSizeBlur = () => {
    if (fontSizeDraft !== null) {
      const num = Number(fontSizeDraft);
      if (!Number.isNaN(num) && num > 0) {
        handlePatch({ fontSize: Math.max(6, Math.min(72, num)) });
      }
      setFontSizeDraft(null);
    }
  };

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
      panelClassName="space-y-3"
    >
      <div className="space-y-1">
        <label htmlFor={fontFamilyId} className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
          {t("templateEditor.fontFamily")}
        </label>
        <FormSelect
          id={fontFamilyId}
          aria-label={t("templateEditor.fontFamily")}
          value={elStyle.fontFamily || "Inter, sans-serif"}
          onChange={(val) => handlePatch({ fontFamily: val })}
          options={FONT_OPTIONS}
          className="h-11 text-xs py-0 w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <label htmlFor={fontSizeId} className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
            {t("templateEditor.fontSize")}
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setFontSizeDraft(null);
                handlePatch({ fontSize: Math.max(6, currentFontSize - 1) });
              }}
              disabled={currentFontSize <= 6}
              title={t("templateEditor.decreaseFontSize")}
              aria-label={t("templateEditor.decreaseFontSize")}
              className="min-h-11 min-w-8 h-11 px-2 border border-border rounded-lg bg-background hover:bg-muted text-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
              id={fontSizeId}
              name={fontSizeId}
              aria-label={t("templateEditor.fontSize")}
              type="number"
              min={6}
              max={72}
              value={displayFontSize}
              onChange={handleFontSizeChange}
              onBlur={handleFontSizeBlur}
              className="w-full min-h-11 h-11 p-1 text-center border border-border rounded-lg bg-background text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            />
            <button
              type="button"
              onClick={() => {
                setFontSizeDraft(null);
                handlePatch({ fontSize: Math.min(72, currentFontSize + 1) });
              }}
              disabled={currentFontSize >= 72}
              title={t("templateEditor.increaseFontSize")}
              aria-label={t("templateEditor.increaseFontSize")}
              className="min-h-11 min-w-8 h-11 px-2 border border-border rounded-lg bg-background hover:bg-muted text-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <label htmlFor={fontColorId} className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
            {t("templateEditor.color")}
          </label>
          <input
            id={fontColorId}
            name={fontColorId}
            aria-label={t("templateEditor.color")}
            type="color"
            value={normalizeHexColor(elStyle.color, PRINT_NEUTRAL.text)}
            onChange={(e) => handlePatch({ color: e.target.value })}
            className="w-full min-h-11 h-11 p-1 border border-border rounded-lg bg-background cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-3xs text-muted-foreground font-semibold">{t("templateEditor.themePalette")}:</span>
        <div className="flex items-center gap-0.5 flex-wrap">
          {swatches.map((swatch) => {
            const isSelected = allSameColor && effectiveColor === swatch.color.toLowerCase();
            return (
              <button
                key={swatch.color}
                type="button"
                title={swatch.label}
                aria-label={swatch.label}
                aria-pressed={isSelected}
                onClick={() => handlePatch({ color: swatch.color })}
                className="min-h-11 min-w-11 flex items-center justify-center p-1 rounded-lg hover:bg-muted/40 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden"
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
          active={allBold}
          onClick={() => handlePatch({ fontWeight: allBold ? "normal" : "bold" })}
          title={t("templateEditor.bold")}
        >
          <Bold className="w-4 h-4" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={allItalic}
          onClick={() => handlePatch({ fontStyle: allItalic ? "normal" : "italic" })}
          title={t("templateEditor.italic")}
        >
          <Italic className="w-4 h-4" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={allUnderline}
          onClick={() => handlePatch({ textDecoration: allUnderline ? "none" : "underline" })}
          title={t("templateEditor.underline")}
        >
          <Underline className="w-4 h-4" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={allStrikethrough}
          onClick={() => handlePatch({ textDecoration: allStrikethrough ? "none" : "line-through" })}
          title={t("templateEditor.strikethrough")}
        >
          <Strikethrough className="w-4 h-4" aria-hidden="true" />
        </StyleBtn>

        {/*
         * Alignment is presented as start/end, not left/right: in an Urdu or Arabic
         * workspace "align left" is the *end* of the line, and the icons mirror with
         * `rtl:-scale-x-100` so the glyph points at the edge it actually aligns to.
         */}
        <StyleBtn
          active={allAlignStart}
          onClick={() => handlePatch({ textAlign: startAlign })}
          title={t("templateEditor.alignStart")}
        >
          <AlignLeft className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={allAlignCenter}
          onClick={() => handlePatch({ textAlign: "center" })}
          title={t("templateEditor.alignCenter")}
        >
          <AlignCenter className="w-4 h-4" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={allAlignEnd}
          onClick={() => handlePatch({ textAlign: endAlign })}
          title={t("templateEditor.alignEnd")}
        >
          <AlignRight className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
        </StyleBtn>
        <StyleBtn
          active={allAlignJustify}
          onClick={() => handlePatch({ textAlign: "justify" })}
          title={t("templateEditor.alignJustify")}
        >
          <AlignJustify className="w-4 h-4" aria-hidden="true" />
        </StyleBtn>
      </div>

      <div className="pt-1">
        <label
          htmlFor={rtlToggleId}
          className="min-h-11 flex items-center gap-2.5 cursor-pointer select-none"
        >
          <Checkbox
            id={rtlToggleId}
            checked={isMixedRtl ? "indeterminate" : allRtl}
            onCheckedChange={(checked) =>
              handlePatch({ direction: checked === true ? "rtl" : "ltr" })
            }
          />
          <span className="text-xs font-medium text-foreground">
            {t("templateEditor.rtl")}
          </span>
        </label>
      </div>
    </TemplateEditorSection>
  );
}
