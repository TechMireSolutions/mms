import React from "react";
import {
  Copy,
  Layers,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ElementStyle, TemplateElement } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { StyleInput } from "./TemplateEditorStyleControls";
import { type AlignmentType } from "./templateEditorUtils";
import { TemplateEditorMultiSelectPanel } from "./TemplateEditorMultiSelectPanel";
import { TemplateEditorTypographySection } from "./TemplateEditorTypographySection";

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
      <TemplateEditorMultiSelectPanel
        selectedElements={selectedElements}
        onAlignSelected={onAlignSelected}
        onBringToFront={onBringToFront ? () => onBringToFront() : undefined}
        onSendToBack={onSendToBack ? () => onSendToBack() : undefined}
        onDuplicateSelected={onDuplicateSelected}
        onDeleteSelected={onDeleteSelected}
        t={t}
      />
    );
  }

  if (!selectedElement) {
    return (
      <aside className="max-h-64 w-full shrink-0 flex flex-col items-center justify-center p-6 text-center border-t border-border bg-card lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s select-none">
        <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mb-2 text-muted-foreground">
          <Layers className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-foreground m-0">
          {t("templateEditor.emptyHint")}
        </p>
        <p className="text-[11px] text-muted-foreground/80 mt-1 m-0">
          {t("templateEditor.emptyHintDetail")}
        </p>
      </aside>
    );
  }

  const elStyle = selectedElement.style || {};
  const isTextLike = selectedElement.type === "static" || selectedElement.type === "field";

  return (
    <aside className="max-h-64 w-full shrink-0 space-y-4 overflow-y-auto border-t border-border bg-card p-3 lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s">
      <div className="pb-2 border-b border-border/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {selectedElement.type}
          </span>
          <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
            {selectedElement.label || "Element"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDuplicateElement(selectedElement.id)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded"
            title={t("templateEditor.duplicate")}
          >
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDeleteElement(selectedElement.id)}
            className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded"
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
              onClick={() => onBringToFront(selectedElement.id)}
              className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
              title="Bring to Front"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onMoveForward?.(selectedElement.id)}
              className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
              title="Move Forward"
            >
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onMoveBackward?.(selectedElement.id)}
              className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
              title="Move Backward"
            >
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSendToBack?.(selectedElement.id)}
              className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
              title="Send to Back"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {isTextLike && (
        <TemplateEditorTypographySection
          elementId={selectedElement.id}
          elStyle={elStyle}
          onPatchStyle={onPatchStyle}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          t={t}
        />
      )}
    </aside>
  );
}
