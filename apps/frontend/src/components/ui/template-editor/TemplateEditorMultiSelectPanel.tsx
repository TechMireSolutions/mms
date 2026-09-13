/**
 * @file TemplateEditorMultiSelectPanel.tsx
 * @description Inspector sidebar panel displayed when multiple template canvas elements are selected.
 */

import React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Layers,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TemplateElement } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { type AlignmentType } from "./templateEditorUtils";

export interface TemplateEditorMultiSelectPanelProps<TPayload = Record<string, unknown>> {
  selectedElements: TemplateElement<keyof TPayload & string>[];
  onAlignSelected?: (alignType: AlignmentType) => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  t: TranslationFunction;
}

export function TemplateEditorMultiSelectPanel<TPayload = Record<string, unknown>>({
  selectedElements,
  onAlignSelected,
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
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onAlignSelected?.("left")}
            title="Align Left"
            className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <AlignLeft className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAlignSelected?.("centerH")}
            title="Align Center H"
            className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <AlignCenter className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAlignSelected?.("right")}
            title="Align Right"
            className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <AlignRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

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
              title="Bring to Front"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("templateEditor.toFront")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSendToBack()}
              className="min-h-11 text-xs rounded-lg border-border hover:bg-muted flex items-center justify-center gap-1.5"
              title="Send to Back"
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
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t("templateEditor.delete")}</span>
        </Button>
      </div>
    </aside>
  );
}
