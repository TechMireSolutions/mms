/**
 * @file TemplateEditorMultiSelectPanel.tsx
 * @description Inspector sidebar panel displayed when multiple template canvas elements are selected.
 */

import React from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Layers,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TemplateElement } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { type AlignmentType } from "./templateEditorUtils";

export interface TemplateEditorMultiSelectPanelProps<TPayload = Record<string, unknown>> {
  selectedElements: TemplateElement<keyof TPayload & string>[];
  onAlignSelected?: (alignType: AlignmentType) => void;
  onDistributeSelected?: (axis: "horizontal" | "vertical") => void;
  onCenterSelected?: (axis: "both" | "h" | "v") => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
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
  t,
}: TemplateEditorMultiSelectPanelProps<TPayload>): React.JSX.Element {
  return (
    <aside className="max-h-64 w-full shrink-0 space-y-4 overflow-y-auto border-t border-border bg-card p-3 lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Layers className="w-4 h-4 text-primary" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-wider text-foreground m-0">
          {t("templateEditor.elementsSelected", { count: selectedElements.length })}
        </p>
      </div>

      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">
          {t("templateEditor.alignment")}
        </p>
        <div className="grid grid-cols-3 gap-1.5 mb-1.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onAlignSelected?.("left")}
            title={t("templateEditor.alignLeft")}
            aria-label={t("templateEditor.alignLeft")}
            className="min-h-11 min-w-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <AlignStartHorizontal className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAlignSelected?.("centerH")}
            title={t("templateEditor.alignCenterH")}
            aria-label={t("templateEditor.alignCenterH")}
            className="min-h-11 min-w-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <AlignCenterHorizontal className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAlignSelected?.("right")}
            title={t("templateEditor.alignRight")}
            aria-label={t("templateEditor.alignRight")}
            className="min-h-11 min-w-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <AlignEndHorizontal className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onAlignSelected?.("top")}
            title={t("templateEditor.alignTop")}
            aria-label={t("templateEditor.alignTop")}
            className="min-h-11 min-w-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <AlignStartVertical className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAlignSelected?.("centerV")}
            title={t("templateEditor.alignCenterV")}
            aria-label={t("templateEditor.alignCenterV")}
            className="min-h-11 min-w-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <AlignCenterVertical className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAlignSelected?.("bottom")}
            title={t("templateEditor.alignBottom")}
            aria-label={t("templateEditor.alignBottom")}
            className="min-h-11 min-w-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <AlignEndVertical className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {onDistributeSelected && selectedElements.length >= 3 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-1.5 m-0">
            {t("templateEditor.distributeHorizontally")}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onDistributeSelected("horizontal")}
              title={t("templateEditor.distributeHorizontally")}
              aria-label={t("templateEditor.distributeHorizontally")}
              className="min-h-11 text-xs rounded-lg border-border hover:bg-muted flex items-center justify-center gap-1.5"
            >
              <AlignHorizontalDistributeCenter className="w-4 h-4" aria-hidden="true" />
              <span>{t("templateEditor.distributeHorizontally")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onDistributeSelected("vertical")}
              title={t("templateEditor.distributeVertically")}
              aria-label={t("templateEditor.distributeVertically")}
              className="min-h-11 text-xs rounded-lg border-border hover:bg-muted flex items-center justify-center gap-1.5"
            >
              <AlignVerticalDistributeCenter className="w-4 h-4" aria-hidden="true" />
              <span>{t("templateEditor.distributeVertically")}</span>
            </Button>
          </div>
        </div>
      )}

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

      {onBringToFront && onSendToBack && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-1.5 m-0">
            {t("templateEditor.layerOrdering")}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onBringToFront()}
              className="min-h-11 text-xs rounded-lg border-border hover:bg-muted flex items-center justify-center gap-1.5"
              title={t("templateEditor.bringToFront")}
              aria-label={t("templateEditor.bringToFront")}
            >
              <ArrowUpToLine className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("templateEditor.toFront")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSendToBack()}
              className="min-h-11 text-xs rounded-lg border-border hover:bg-muted flex items-center justify-center gap-1.5"
              title={t("templateEditor.sendToBack")}
              aria-label={t("templateEditor.sendToBack")}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("templateEditor.toBack")}</span>
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
          className="flex-1 text-xs min-h-11 border-border hover:bg-muted flex items-center justify-center gap-1.5 rounded-lg"
          title={t("templateEditor.duplicate")}
          aria-label={t("templateEditor.duplicate")}
        >
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t("templateEditor.duplicate")}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDeleteSelected}
          className="flex-1 text-xs min-h-11 border-destructive/40 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1.5 rounded-lg"
          title={t("templateEditor.delete")}
          aria-label={t("templateEditor.delete")}
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t("templateEditor.delete")}</span>
        </Button>
      </div>
    </aside>
  );
}
