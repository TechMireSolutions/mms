/**
 * @file TemplateEditorMultiSelectPanel.tsx
 * @description Inspector sidebar panel displayed when multiple template canvas elements are selected.
 */

import React, { useId, useState } from "react";
import {
  AlignCenterHorizontal,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Layers,
  Move,
  Palette,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ElementStyle, TemplateElement } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { StyleInput } from "./TemplateEditorStyleControls";
import { normalizeHexColor, type AlignmentType } from "./templateEditorUtils";
import { TemplateEditorSection } from "./TemplateEditorSection";
import { TemplateEditorAlignmentGrid } from "./TemplateEditorAlignmentGrid";

export interface TemplateEditorMultiSelectPanelProps<TPayload = Record<string, unknown>> {
  selectedElements: TemplateElement<keyof TPayload & string>[];
  onAlignSelected?: (alignType: AlignmentType) => void;
  onDistributeSelected?: (axis: "horizontal" | "vertical") => void;
  onCenterSelected?: (axis: "both" | "h" | "v") => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  onPatchSelectedStyles?: (stylePatch: Partial<ElementStyle>) => void;
  t: TranslationFunction;
}

export function TemplateEditorMultiSelectPanel<TPayload = Record<string, unknown>>({
  selectedElements,
  onAlignSelected,
  onDistributeSelected,
  onCenterSelected,
  onBringToFront,
  onSendToBack,
  onDuplicateSelected,
  onDeleteSelected,
  onPatchSelectedStyles,
  t,
}: TemplateEditorMultiSelectPanelProps<TPayload>): React.JSX.Element {
  const [openSections, setOpenSections] = useState({
    alignment: true,
    distribute: true,
    center: true,
    layers: true,
    batchStyle: true,
  });
  const toggleSection = (section: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const colorId = useId();
  const bgColorId = useId();

  const sampleStyle = selectedElements[0]?.style || {};
  const initialColor = normalizeHexColor(sampleStyle.color, "#0f172a");
  const initialBgColor = normalizeHexColor(sampleStyle.backgroundColor, "#ffffff");
  const initialFontSize = sampleStyle.fontSize ?? 12;
  const initialBorderRadius = sampleStyle.borderRadius ?? 0;

  /*
   * Alignment here is deliberately physical (left/right edge of the selection), not
   * logical start/end: element coordinates are absolute left-origin values on an
   * LTR canvas, so "align left edge" means the same edge in every locale.
   */
  return (
    <aside
      aria-label={t("templateEditor.elementsSelected", { count: selectedElements.length })}
      className="max-h-64 w-full shrink-0 space-y-3 overflow-y-auto border-t border-border bg-card p-3 lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s print:hidden"
    >
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Layers className="w-4 h-4 text-primary" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-wider text-foreground m-0">
          {t("templateEditor.elementsSelected", { count: selectedElements.length })}
        </p>
      </div>

      <TemplateEditorSection
        titleKey="templateEditor.alignment"
        icon={Move}
        isOpen={openSections.alignment}
        onToggle={() => toggleSection("alignment")}
        t={t}
        panelClassName="space-y-1.5"
      >
        <TemplateEditorAlignmentGrid onAlignSelected={(a) => onAlignSelected?.(a)} t={t} />
      </TemplateEditorSection>

      {onDistributeSelected && selectedElements.length >= 3 && (
        <TemplateEditorSection
          titleKey="templateEditor.distribute"
          icon={AlignHorizontalDistributeCenter}
          isOpen={openSections.distribute}
          onToggle={() => toggleSection("distribute")}
          t={t}
          panelClassName="space-y-1.5"
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onDistributeSelected("horizontal")}
              title={t("templateEditor.distributeHorizontally")}
              aria-label={t("templateEditor.distributeHorizontally")}
              className="min-h-11 min-w-11 p-0 rounded-lg border-border hover:bg-muted flex items-center justify-center"
            >
              <AlignHorizontalDistributeCenter className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onDistributeSelected("vertical")}
              title={t("templateEditor.distributeVertically")}
              aria-label={t("templateEditor.distributeVertically")}
              className="min-h-11 min-w-11 p-0 rounded-lg border-border hover:bg-muted flex items-center justify-center"
            >
              <AlignVerticalDistributeCenter className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </TemplateEditorSection>
      )}

      {onCenterSelected && (
        <TemplateEditorSection
          titleKey="templateEditor.centerOnPage"
          icon={AlignCenterHorizontal}
          isOpen={openSections.center}
          onToggle={() => toggleSection("center")}
          t={t}
          panelClassName="space-y-1.5"
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onCenterSelected("h")}
              className="min-h-11 text-xs rounded-lg border-border hover:bg-muted flex items-center justify-center"
              title={t("templateEditor.centerHorizontally")}
              aria-label={t("templateEditor.centerHorizontally")}
            >
              <span className="truncate">{t("templateEditor.centerHorizontally")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onCenterSelected("v")}
              className="min-h-11 text-xs rounded-lg border-border hover:bg-muted flex items-center justify-center"
              title={t("templateEditor.centerVertically")}
              aria-label={t("templateEditor.centerVertically")}
            >
              <span className="truncate">{t("templateEditor.centerVertically")}</span>
            </Button>
          </div>
        </TemplateEditorSection>
      )}

      {onBringToFront && onSendToBack && (
        <TemplateEditorSection
          titleKey="templateEditor.layerOrdering"
          icon={Layers}
          isOpen={openSections.layers}
          onToggle={() => toggleSection("layers")}
          t={t}
          panelClassName="space-y-1.5"
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onBringToFront()}
              className="min-h-11 min-w-11 p-0 rounded-lg border-border hover:bg-muted flex items-center justify-center"
              title={t("templateEditor.bringToFront")}
              aria-label={t("templateEditor.bringToFront")}
            >
              <ArrowUpToLine className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSendToBack()}
              className="min-h-11 min-w-11 p-0 rounded-lg border-border hover:bg-muted flex items-center justify-center"
              title={t("templateEditor.sendToBack")}
              aria-label={t("templateEditor.sendToBack")}
            >
              <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </TemplateEditorSection>
      )}

      {onPatchSelectedStyles && (
        <TemplateEditorSection
          titleKey="templateEditor.batchStyle"
          icon={Palette}
          isOpen={openSections.batchStyle}
          onToggle={() => toggleSection("batchStyle")}
          t={t}
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <label htmlFor={colorId} className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
                {t("templateEditor.color")}
              </label>
              <input
                id={colorId}
                name={colorId}
                type="color"
                /* Controlled, not defaultValue: the panel stays mounted while the
                   selection changes, so an uncontrolled swatch kept showing the
                   previous selection's colour. */
                value={initialColor}
                onChange={(e) => onPatchSelectedStyles({ color: e.target.value })}
                className="w-full min-h-11 h-11 p-1 border border-border rounded-lg bg-background cursor-pointer"
                title={t("templateEditor.color")}
                aria-label={t("templateEditor.color")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label htmlFor={bgColorId} className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
                {t("templateEditor.backgroundColor")}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id={bgColorId}
                  name={bgColorId}
                  type="color"
                  value={initialBgColor}
                  onChange={(e) => onPatchSelectedStyles({ backgroundColor: e.target.value })}
                  className="w-11 h-11 p-0.5 border border-border rounded-md bg-background cursor-pointer touch-manipulation min-h-11 min-w-11"
                  title={t("templateEditor.backgroundColor")}
                  aria-label={t("templateEditor.backgroundColor")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onPatchSelectedStyles({ backgroundColor: undefined })}
                  className="min-h-11 text-3xs px-2"
                  title={t("templateEditor.transparent")}
                  aria-label={t("templateEditor.transparent")}
                >
                  {t("templateEditor.transparent")}
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StyleInput
              label={t("templateEditor.fontSize")}
              type="number"
              min={6}
              max={72}
              value={initialFontSize}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) onPatchSelectedStyles({ fontSize: Math.max(6, Math.min(72, num)) });
              }}
            />
            <StyleInput
              label={t("templateEditor.borderRadius")}
              type="number"
              min={0}
              max={32}
              value={initialBorderRadius}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) onPatchSelectedStyles({ borderRadius: Math.max(0, Math.min(32, num)) });
              }}
            />
          </div>
        </TemplateEditorSection>
      )}

      <div role="group" aria-label={t("common.actions")} className="flex gap-2 pt-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onDuplicateSelected}
          className="flex-1 text-xs min-h-11 border-border hover:bg-muted flex items-center justify-center gap-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden"
          title={t("templateEditor.duplicate")}
          aria-label={t("templateEditor.duplicate")}
        >
          <Copy className="w-4 h-4" aria-hidden="true" />
          <span>{t("templateEditor.duplicate")}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onDeleteSelected}
          className="flex-1 text-xs min-h-11 border-destructive/40 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden"
          title={t("templateEditor.delete")}
          aria-label={t("templateEditor.delete")}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          <span>{t("templateEditor.delete")}</span>
        </Button>
      </div>
    </aside>
  );
}
