/**
 * @file TemplateEditorMultiSelectPanel.tsx
 * @description Inspector sidebar panel displayed when multiple template canvas elements are selected.
 */

import React, { useState } from "react";
import {
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Layers,
  Move,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ElementStyle, TemplateElement } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { normalizeHexColor, type AlignmentType } from "./templateEditorUtils";
import { TemplateEditorSection } from "./TemplateEditorSection";
import { TemplateEditorAlignmentGrid } from "./TemplateEditorAlignmentGrid";
import { TemplateEditorTypographySection } from "./TemplateEditorTypographySection";
import { TemplateEditorMultiSelectCenterSnap } from "./TemplateEditorMultiSelectCenterSnap";
import { TemplateEditorMultiSelectAppearance } from "./TemplateEditorMultiSelectAppearance";

export interface TemplateEditorMultiSelectPanelProps<TPayload = Record<string, unknown>> {
  selectedElements: TemplateElement<keyof TPayload & string>[];
  onAlignSelected?: (alignType: AlignmentType) => void;
  onDistributeSelected?: (axis: "horizontal" | "vertical") => void;
  onCenterSelected?: (axis: "both" | "h" | "v") => void;
  onSnapSelected?: (edge: "top" | "bottom" | "left" | "right") => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  onPatchSelectedStyles?: (stylePatch: Partial<ElementStyle>) => void;
  primaryColor?: string;
  secondaryColor?: string;
  isRtl?: boolean;
  t: TranslationFunction;
}

export function TemplateEditorMultiSelectPanel<TPayload = Record<string, unknown>>({
  selectedElements,
  onAlignSelected,
  onDistributeSelected,
  onCenterSelected,
  onSnapSelected,
  onBringToFront,
  onSendToBack,
  onDuplicateSelected,
  onDeleteSelected,
  onPatchSelectedStyles,
  primaryColor,
  secondaryColor,
  isRtl = false,
  t,
}: TemplateEditorMultiSelectPanelProps<TPayload>): React.JSX.Element {
  const [openSections, setOpenSections] = useState({
    alignment: true,
    distribute: true,
    center: true,
    layers: true,
    typography: true,
    appearance: true,
  });
  const toggleSection = (section: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const hasTextLike = selectedElements.some(
    (el) => el.type === "static" || el.type === "field"
  );

  const sampleStyle = selectedElements[0]?.style || {};
  const initialBgColor = normalizeHexColor(sampleStyle.backgroundColor, "#ffffff");
  const initialBorderColor = normalizeHexColor(sampleStyle.borderColor, "#cbd5e1");
  const initialBorderRadius = sampleStyle.borderRadius ?? 0;
  const initialBorderWidth = sampleStyle.borderWidth ?? 0;

  const bounds = React.useMemo(() => {
    if (selectedElements.length === 0) return null;
    const minX = Math.min(...selectedElements.map((el) => el.x));
    const minY = Math.min(...selectedElements.map((el) => el.y));
    const maxX = Math.max(...selectedElements.map((el) => el.x + el.w));
    const maxY = Math.max(...selectedElements.map((el) => el.y + el.h));
    return { w: Math.round(maxX - minX), h: Math.round(maxY - minY) };
  }, [selectedElements]);

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
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground m-0 truncate">
            {t("templateEditor.elementsSelected", { count: selectedElements.length })}
          </h2>
        </div>
        {bounds && (
          <span
            aria-label={`${bounds.w} by ${bounds.h} px`}
            className="text-3xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0"
          >
            {bounds.w} × {bounds.h} px
          </span>
        )}
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
          <div role="group" aria-label={t("templateEditor.distribute")} className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onDistributeSelected("horizontal")}
              title={t("templateEditor.distributeHorizontally")}
              aria-label={t("templateEditor.distributeHorizontally")}
              className="min-h-11 min-w-11 p-0 rounded-lg border-border hover:bg-muted flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden"
            >
              <AlignHorizontalDistributeCenter className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onDistributeSelected("vertical")}
              title={t("templateEditor.distributeVertically")}
              aria-label={t("templateEditor.distributeVertically")}
              className="min-h-11 min-w-11 p-0 rounded-lg border-border hover:bg-muted flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden"
            >
              <AlignVerticalDistributeCenter className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </TemplateEditorSection>
      )}

      <TemplateEditorMultiSelectCenterSnap
        isOpen={openSections.center}
        onToggle={() => toggleSection("center")}
        onCenterSelected={onCenterSelected}
        onSnapSelected={onSnapSelected}
        t={t}
      />

      {onBringToFront && onSendToBack && (
        <TemplateEditorSection
          titleKey="templateEditor.layerOrdering"
          icon={Layers}
          isOpen={openSections.layers}
          onToggle={() => toggleSection("layers")}
          t={t}
          panelClassName="space-y-1.5"
        >
          <div role="group" aria-label={t("templateEditor.layerOrdering")} className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onBringToFront()}
              className="min-h-11 min-w-11 p-0 rounded-lg border-border hover:bg-muted flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden"
              title={t("templateEditor.bringToFront")}
              aria-label={t("templateEditor.bringToFront")}
            >
              <ArrowUpToLine className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSendToBack()}
              className="min-h-11 min-w-11 p-0 rounded-lg border-border hover:bg-muted flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden"
              title={t("templateEditor.sendToBack")}
              aria-label={t("templateEditor.sendToBack")}
            >
              <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </TemplateEditorSection>
      )}

      {hasTextLike && onPatchSelectedStyles && (
        <TemplateEditorTypographySection
          elStyle={sampleStyle}
          selectedElements={selectedElements}
          isOpen={openSections.typography}
          onToggle={() => toggleSection("typography")}
          onPatchStyle={onPatchSelectedStyles}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          isRtl={isRtl}
          t={t}
        />
      )}

      {onPatchSelectedStyles && (
        <TemplateEditorMultiSelectAppearance
          isOpen={openSections.appearance}
          onToggle={() => toggleSection("appearance")}
          initialBgColor={initialBgColor}
          initialBorderColor={initialBorderColor}
          initialBorderRadius={initialBorderRadius}
          initialBorderWidth={initialBorderWidth}
          onPatchSelectedStyles={onPatchSelectedStyles}
          t={t}
        />
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
          title={`${t("templateEditor.delete")} (${selectedElements.length})`}
          aria-label={`${t("templateEditor.delete")} (${selectedElements.length})`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          <span>
            {t("templateEditor.delete")} ({selectedElements.length})
          </span>
        </Button>
      </div>
    </aside>
  );
}
