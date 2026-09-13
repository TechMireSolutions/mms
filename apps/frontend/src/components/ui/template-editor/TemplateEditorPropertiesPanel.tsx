/**
 * @file TemplateEditorPropertiesPanel.tsx
 * @description Inspector sidebar panel for configuring element properties, styles, position, alignment, and layers.
 */

import React, { useState } from "react";
import {
  Copy,
  Layers,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronUp,
  ChevronDown,
  Move,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ElementStyle, TemplateElement } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { StyleInput } from "./TemplateEditorStyleControls";
import { normalizeHexColor, type AlignmentType } from "./templateEditorUtils";
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
  onDistributeSelected?: (axis: "horizontal" | "vertical") => void;
  onCenterSelected?: (axis: "both" | "h" | "v") => void;
  onBringToFront?: (elementId?: string) => void;
  onSendToBack?: (elementId?: string) => void;
  onBringSelectedToFront?: () => void;
  onSendSelectedToBack?: () => void;
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
  onDistributeSelected,
  onCenterSelected,
  onBringToFront,
  onSendToBack,
  onBringSelectedToFront,
  onSendSelectedToBack,
  onMoveForward,
  onMoveBackward,
  primaryColor,
  secondaryColor,
  t,
}: TemplateEditorPropertiesPanelProps<TPayload>): React.JSX.Element {
  const [openSections, setOpenSections] = useState({
    position: true,
    layers: true,
    appearance: true,
    typography: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isMultiSelect = selectedElements.length > 1;

  if (isMultiSelect) {
    return (
      <TemplateEditorMultiSelectPanel
        selectedElements={selectedElements}
        onAlignSelected={onAlignSelected}
        onDistributeSelected={onDistributeSelected}
        onCenterSelected={onCenterSelected}
        onBringToFront={onBringSelectedToFront || (onBringToFront ? () => onBringToFront() : undefined)}
        onSendToBack={onSendSelectedToBack || (onSendToBack ? () => onSendToBack() : undefined)}
        onDuplicateSelected={onDuplicateSelected}
        onDeleteSelected={onDeleteSelected}
        t={t}
      />
    );
  }

  if (!selectedElement) {
    return (
      <aside
        aria-label={t("templateEditor.properties")}
        className="max-h-64 w-full shrink-0 flex flex-col items-center justify-center p-6 text-center border-t border-border bg-card lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s select-none"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary shadow-xs">
          <Layers className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-foreground m-0">
          {t("templateEditor.emptyHint")}
        </p>
        <p className="text-3xs text-muted-foreground/80 mt-1.5 max-w-[170px] leading-relaxed m-0">
          {t("templateEditor.emptyHintDetail")}
        </p>
      </aside>
    );
  }

  const elStyle = selectedElement.style || {};
  const isTextLike = selectedElement.type === "static" || selectedElement.type === "field";

  return (
    <aside
      aria-label={t("templateEditor.properties")}
      className="max-h-64 w-full shrink-0 space-y-4 overflow-y-auto border-t border-border bg-card p-3 lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s"
    >
      <div className="pb-2 border-b border-border/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {selectedElement.type}
          </span>
          <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
            {selectedElement.label || t("templateEditor.element")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDuplicateElement(selectedElement.id)}
            className="min-h-11 min-w-11 text-muted-foreground hover:text-foreground rounded"
            title={t("templateEditor.duplicate")}
            aria-label={t("templateEditor.duplicate")}
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDeleteElement(selectedElement.id)}
            className="min-h-11 min-w-11 text-destructive hover:bg-destructive/10 rounded"
            title={t("templateEditor.delete")}
            aria-label={t("templateEditor.delete")}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor={`label-input-${selectedElement.id}`} className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
          {t("templateEditor.labelText")}
        </label>
        <Input
          id={`label-input-${selectedElement.id}`}
          name={`label-input-${selectedElement.id}`}
          type="text"
          value={selectedElement.label}
          onChange={(e) => onPatchElement(selectedElement.id, { label: e.target.value })}
          className="w-full min-h-11 px-2 py-1.5 text-xs border border-border rounded bg-background"
        />
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => toggleSection("position")}
          aria-expanded={openSections.position}
          className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase text-muted-foreground tracking-widest hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-primary/70" />
            <span>{t("templateEditor.positionSize")}</span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              openSections.position ? "" : "-rotate-90 text-muted-foreground/50"
            }`}
          />
        </button>
        {openSections.position && (
          <div className="grid grid-cols-2 gap-2">
            <StyleInput
              label="X"
              type="number"
              value={selectedElement.x}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { x: Math.max(0, num) });
              }}
            />
            <StyleInput
              label="Y"
              type="number"
              value={selectedElement.y}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { y: Math.max(0, num) });
              }}
            />
            <StyleInput
              label="W"
              type="number"
              value={selectedElement.w}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { w: Math.max(20, num) });
              }}
            />
            <StyleInput
              label="H"
              type="number"
              value={selectedElement.h}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { h: Math.max(4, num) });
              }}
            />
          </div>
        )}
      </div>

      {onCenterSelected && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-1.5 m-0">
            {t("templateEditor.centerOnPage")}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onCenterSelected("h")}
              className="min-h-11 text-xs rounded-lg border-border hover:bg-muted flex items-center justify-center gap-1.5"
              title={t("templateEditor.centerHorizontally")}
              aria-label={t("templateEditor.centerHorizontally")}
            >
              <span>{t("templateEditor.centerHorizontally")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onCenterSelected("v")}
              className="min-h-11 text-xs rounded-lg border-border hover:bg-muted flex items-center justify-center gap-1.5"
              title={t("templateEditor.centerVertically")}
              aria-label={t("templateEditor.centerVertically")}
            >
              <span>{t("templateEditor.centerVertically")}</span>
            </Button>
          </div>
        </div>
      )}

      {onBringToFront && (
        <div className="pt-2 border-t border-border space-y-2">
          <button
            type="button"
            onClick={() => toggleSection("layers")}
            aria-expanded={openSections.layers}
            className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase text-muted-foreground tracking-widest hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary/70" />
              <span>{t("templateEditor.layerStacking")}</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                openSections.layers ? "" : "-rotate-90 text-muted-foreground/50"
              }`}
            />
          </button>
          {openSections.layers && (
            <div className="grid grid-cols-4 gap-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onBringToFront(selectedElement.id)}
                className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
                title={t("templateEditor.bringToFront")}
                aria-label={t("templateEditor.bringToFront")}
              >
                <ArrowUpToLine className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onMoveForward?.(selectedElement.id)}
                className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
                title={t("templateEditor.moveForward")}
                aria-label={t("templateEditor.moveForward")}
              >
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onMoveBackward?.(selectedElement.id)}
                className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
                title={t("templateEditor.moveBackward")}
                aria-label={t("templateEditor.moveBackward")}
              >
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onSendToBack?.(selectedElement.id)}
                className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
                title={t("templateEditor.sendToBack")}
                aria-label={t("templateEditor.sendToBack")}
              >
                <ArrowDownToLine className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-border space-y-2">
        <button
          type="button"
          onClick={() => toggleSection("appearance")}
          aria-expanded={openSections.appearance}
          className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase text-muted-foreground tracking-widest hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-primary/70" />
            <span>{t("templateEditor.appearance")}</span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              openSections.appearance ? "" : "-rotate-90 text-muted-foreground/50"
            }`}
          />
        </button>

        {openSections.appearance && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <label htmlFor={`bg-color-${selectedElement.id}`} className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
                  {t("templateEditor.backgroundColor")}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id={`bg-color-${selectedElement.id}`}
                    name={`bg-color-${selectedElement.id}`}
                    aria-label={t("templateEditor.backgroundColor")}
                    type="color"
                    value={normalizeHexColor(elStyle.backgroundColor, "#ffffff")}
                    onChange={(e) => onPatchStyle(selectedElement.id, { backgroundColor: e.target.value })}
                    className="w-8 h-8 p-0.5 border border-border rounded bg-background cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onPatchStyle(selectedElement.id, { backgroundColor: undefined })}
                    className="min-h-11 text-3xs px-2"
                    title={t("templateEditor.transparent")}
                  >
                    {t("templateEditor.transparent")}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <label htmlFor={`border-color-${selectedElement.id}`} className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
                  {t("templateEditor.borderColor")}
                </label>
                <input
                  id={`border-color-${selectedElement.id}`}
                  name={`border-color-${selectedElement.id}`}
                  aria-label={t("templateEditor.borderColor")}
                  type="color"
                  value={normalizeHexColor(elStyle.borderColor, "#cbd5e1")}
                  onChange={(e) => onPatchStyle(selectedElement.id, { borderColor: e.target.value })}
                  className="w-full min-h-11 h-11 p-1 border border-border rounded-lg bg-background cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StyleInput
                label={t("templateEditor.borderWidth")}
                type="number"
                min={0}
                max={12}
                value={elStyle.borderWidth ?? 0}
                onChange={(val) => {
                  const num = Number(val);
                  if (!Number.isNaN(num)) {
                    onPatchStyle(selectedElement.id, { borderWidth: Math.max(0, Math.min(12, num)) });
                  }
                }}
              />
              <StyleInput
                label={t("templateEditor.borderRadius")}
                type="number"
                min={0}
                max={32}
                value={elStyle.borderRadius ?? 0}
                onChange={(val) => {
                  const num = Number(val);
                  if (!Number.isNaN(num)) {
                    onPatchStyle(selectedElement.id, { borderRadius: Math.max(0, Math.min(32, num)) });
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

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
