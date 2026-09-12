import React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Italic,
  Layers,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/FormSelect";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { ElementStyle, TemplateElement } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { StyleBtn, StyleInput } from "./TemplateEditorStyleControls";
import { type AlignmentType } from "./templateEditorUtils";

export interface TemplateEditorPropertiesPanelProps<TPayload = Record<string, unknown>> {
  selectedElement: TemplateElement<keyof TPayload & string> | undefined;
  selectedElements?: TemplateElement<keyof TPayload & string>[];
  onPatchElement: (elementId: string, patch: Partial<TemplateElement<keyof TPayload & string>>) => void;
  onPatchStyle: (elementId: string, stylePatch: Partial<ElementStyle>) => void;
  onDuplicateElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  onAlignSelected?: (alignType: AlignmentType) => void;
  onBringToFront?: (elementId?: string) => void;
  onSendToBack?: (elementId?: string) => void;
  onMoveForward?: (elementId?: string) => void;
  onMoveBackward?: (elementId?: string) => void;
  primaryColor?: string;
  secondaryColor?: string;
  t: TranslationFunction;
}

export function TemplateEditorPropertiesPanel<TPayload = Record<string, unknown>>({
  selectedElement,
  selectedElements = [],
  onPatchElement,
  onPatchStyle,
  onDuplicateElement,
  onDeleteElement,
  onDuplicateSelected,
  onDeleteSelected,
  onAlignSelected,
  onBringToFront,
  onSendToBack,
  onMoveForward,
  onMoveBackward,
  primaryColor,
  secondaryColor,
  t,
}: TemplateEditorPropertiesPanelProps<TPayload>): React.JSX.Element {
  const isMultiSelect = selectedElements.length > 1;

  if (isMultiSelect) {
    return (
      <aside className="max-h-64 w-full shrink-0 space-y-4 overflow-y-auto border-t border-border bg-card p-3 lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Layers className="w-4 h-4 text-primary" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wider text-foreground m-0">
            {selectedElements.length} Elements Selected
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">
            {t("templateEditor.alignment")}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAlignSelected?.("left")}
              title="Align Left"
              className="h-8 p-0 flex items-center justify-center border border-border hover:bg-muted"
            >
              <AlignLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAlignSelected?.("centerH")}
              title="Align Center H"
              className="h-8 p-0 flex items-center justify-center border border-border hover:bg-muted"
            >
              <AlignCenter className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAlignSelected?.("right")}
              title="Align Right"
              className="h-8 p-0 flex items-center justify-center border border-border hover:bg-muted"
            >
              <AlignRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {onBringToFront && onSendToBack && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-1.5 m-0">
              Layer Ordering
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onBringToFront()}
                className="text-xs border-border hover:bg-muted flex items-center justify-center gap-1"
                title="Bring to Front"
              >
                <ArrowUpToLine className="w-3.5 h-3.5" aria-hidden="true" />
                <span>To Front</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSendToBack()}
                className="text-xs border-border hover:bg-muted flex items-center justify-center gap-1"
                title="Send to Back"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" aria-hidden="true" />
                <span>To Back</span>
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDuplicateSelected}
            className="flex-1 text-xs border-border hover:bg-muted flex items-center justify-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t("templateEditor.duplicate")}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDeleteSelected}
            className="flex-1 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t("templateEditor.delete")}</span>
          </Button>
        </div>
      </aside>
    );
  }

  if (!selectedElement) {
    return (
      <aside className="max-h-64 w-full shrink-0 flex flex-col items-center justify-center p-6 text-center border-t border-border bg-card lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s">
        <p className="text-xs text-muted-foreground m-0 font-medium">
          {t("templateEditor.emptyHint")}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-1 m-0">
          {t("templateEditor.emptyHintDetail")}
        </p>
      </aside>
    );
  }

  const elStyle = selectedElement.style || {};
  const isTextLike = selectedElement.type === "static" || selectedElement.type === "field";

  return (
    <aside className="max-h-64 w-full shrink-0 space-y-4 overflow-y-auto border-t border-border bg-card p-3 lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s">
      <div className="pb-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          {selectedElement.type.toUpperCase()} ELEMENT
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDuplicateElement(selectedElement.id)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title={t("templateEditor.duplicate")}
          >
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDeleteElement(selectedElement.id)}
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            title={t("templateEditor.delete")}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
          Label / Text
        </label>
        <input
          type="text"
          value={selectedElement.label}
          onChange={(e) => onPatchElement(selectedElement.id, { label: e.target.value })}
          className="w-full min-h-11 px-2 py-1.5 text-xs border border-border rounded bg-background"
        />
      </div>

      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">
          {t("templateEditor.positionSize")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StyleInput
            label="X"
            type="number"
            value={selectedElement.x}
            onChange={(val) => onPatchElement(selectedElement.id, { x: Number(val) })}
          />
          <StyleInput
            label="Y"
            type="number"
            value={selectedElement.y}
            onChange={(val) => onPatchElement(selectedElement.id, { y: Number(val) })}
          />
          <StyleInput
            label="W"
            type="number"
            value={selectedElement.w}
            onChange={(val) => onPatchElement(selectedElement.id, { w: Math.max(20, Number(val)) })}
          />
          <StyleInput
            label="H"
            type="number"
            value={selectedElement.h}
            onChange={(val) => onPatchElement(selectedElement.id, { h: Math.max(4, Number(val)) })}
          />
        </div>
      </div>

      {onBringToFront && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-1.5 m-0">
            Layer Stacking
          </p>
          <div className="grid grid-cols-4 gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onBringToFront(selectedElement.id)}
              className="h-8 p-0 flex items-center justify-center border border-border hover:bg-muted"
              title="Bring to Front"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMoveForward?.(selectedElement.id)}
              className="h-8 p-0 flex items-center justify-center border border-border hover:bg-muted"
              title="Move Forward"
            >
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMoveBackward?.(selectedElement.id)}
              className="h-8 p-0 flex items-center justify-center border border-border hover:bg-muted"
              title="Move Backward"
            >
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSendToBack?.(selectedElement.id)}
              className="h-8 p-0 flex items-center justify-center border border-border hover:bg-muted"
              title="Send to Back"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {isTextLike && (
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest m-0">
            {t("templateEditor.typography")}
          </p>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
              Font Family
            </label>
            <FormSelect
              aria-label="Font Family"
              value={elStyle.fontFamily || "Inter, sans-serif"}
              onChange={(val) => onPatchStyle(selectedElement.id, { fontFamily: val })}
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
              onChange={(val) => onPatchStyle(selectedElement.id, { fontSize: Number(val) })}
            />
            <div className="flex flex-col gap-0.5">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
                {t("templateEditor.color")}
              </label>
              <input
                type="color"
                value={elStyle.color || PRINT_NEUTRAL.text}
                onChange={(e) => onPatchStyle(selectedElement.id, { color: e.target.value })}
                className="w-full min-h-11 h-11 p-1 border border-border rounded bg-background cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-semibold">Presets:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: "Primary", color: primaryColor || "#059669" },
                { label: "Secondary", color: secondaryColor || "#047857" },
                { label: "Dark", color: "#0f172a" },
                { label: "Muted", color: "#64748b" },
                { label: "Emerald", color: "#10b981" },
                { label: "Amber", color: "#f59e0b" },
                { label: "Red", color: "#ef4444" },
              ].map((swatch) => (
                <button
                  key={swatch.color}
                  type="button"
                  title={swatch.label}
                  onClick={() => onPatchStyle(selectedElement.id, { color: swatch.color })}
                  style={{ backgroundColor: swatch.color }}
                  className="w-5 h-5 rounded-full border border-border hover:scale-110 transition-transform cursor-pointer shadow-xs"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <StyleBtn
              active={elStyle.fontWeight === "bold"}
              onClick={() =>
                onPatchStyle(selectedElement.id, {
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
                onPatchStyle(selectedElement.id, {
                  fontStyle: elStyle.fontStyle === "italic" ? "normal" : "italic",
                })
              }
              title={t("templateEditor.italic")}
            >
              <Italic className="w-3.5 h-3.5" aria-hidden="true" />
            </StyleBtn>
            <StyleBtn
              active={elStyle.textAlign === "left" || !elStyle.textAlign}
              onClick={() => onPatchStyle(selectedElement.id, { textAlign: "left" })}
              title={t("templateEditor.alignLeft")}
            >
              <AlignLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </StyleBtn>
            <StyleBtn
              active={elStyle.textAlign === "center"}
              onClick={() => onPatchStyle(selectedElement.id, { textAlign: "center" })}
              title={t("templateEditor.alignCenter")}
            >
              <AlignCenter className="w-3.5 h-3.5" aria-hidden="true" />
            </StyleBtn>
            <StyleBtn
              active={elStyle.textAlign === "right"}
              onClick={() => onPatchStyle(selectedElement.id, { textAlign: "right" })}
              title={t("templateEditor.alignRight")}
            >
              <AlignRight className="w-3.5 h-3.5" aria-hidden="true" />
            </StyleBtn>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="dir-rtl-toggle"
              checked={elStyle.direction === "rtl"}
              onCheckedChange={(checked) =>
                onPatchStyle(selectedElement.id, { direction: checked ? "rtl" : "ltr" })
              }
            />
            <label htmlFor="dir-rtl-toggle" className="text-xs font-medium cursor-pointer">
              {t("templateEditor.rtl")}
            </label>
          </div>
        </div>
      )}
    </aside>
  );
}
