import React from "react";
import {
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Image,
  Pin,
  PinOff,
  Printer,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { getCollectionLabel, getFieldLabel } from "@/components/ui/reports/reportMetadata";
import type { CollectionMeta } from "@/components/ui/reports/dynamicChartVisualizerTypes";

interface VisualizerPreviewHeaderProps {
  title: string;
  collectionKey: string;
  xAxisField: string;
  activeMeta: CollectionMeta;
  showPdfSettings: boolean;
  pdfOrientation: "p" | "l";
  pdfFormat: string;
  isPinned: boolean;
  canPin: boolean;
  onSaveVisual?: () => void;
  onClose?: () => void;
  onTogglePin: () => void;
  onExportPng: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onTogglePdfSettings: () => void;
  onPdfOrientationChange: (value: "p" | "l") => void;
  onPdfFormatChange: (value: string) => void;
  t: TranslationFunction;
}

export function VisualizerPreviewHeader({
  title,
  collectionKey,
  xAxisField,
  activeMeta,
  showPdfSettings,
  pdfOrientation,
  pdfFormat,
  isPinned,
  canPin,
  onSaveVisual,
  onClose,
  onTogglePin,
  onExportPng,
  onExportExcel,
  onExportPdf,
  onTogglePdfSettings,
  onPdfOrientationChange,
  onPdfFormatChange,
  t,
}: VisualizerPreviewHeaderProps): React.JSX.Element {
  const activeField = activeMeta.fields.find((field) => field.value === xAxisField);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
      <div className="space-y-1">
        <h3 className="text-base font-black text-foreground tracking-tight leading-none">{title}</h3>
        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">
          {t("reports.visualizer.sourceSubtitle", {
            source: getCollectionLabel(collectionKey, activeMeta.name, t),
            axis: getFieldLabel(xAxisField, activeField?.label || xAxisField, t),
          })}
        </p>
      </div>

      <div className="flex items-center gap-2 print:hidden">
        {onSaveVisual && (
          <Button
            type="button"
            variant="capsPrimary"
            size="caps"
            onClick={onSaveVisual}
            className="shadow-md shadow-primary/15 border border-primary/50 bg-primary text-primary-foreground"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("reports.visualizer.saveVisual")}
          </Button>
        )}

        {onClose && (
          <Button
            type="button"
            variant="capsOutline"
            size="caps"
            onClick={onClose}
          >
            {t("reports.visualizer.cancel")}
          </Button>
        )}

        {canPin && (
          <Button
            type="button"
            variant={isPinned ? "capsSuccess" : "capsOutline"}
            size="caps"
            onClick={onTogglePin}
            className={isPinned ? "shadow-md shadow-success/5" : undefined}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            {isPinned ? t("reports.visualizer.pinnedToHome") : t("reports.visualizer.pinToDashboard")}
          </Button>
        )}

        <div className="flex items-center gap-1.5 relative">
          {showPdfSettings && (
            <div className="absolute end-0 bottom-full mb-2 bg-card border border-border rounded-2xl p-4 shadow-xl z-popover flex flex-col gap-3.5 min-w-popover-md backdrop-blur-xl">
              <div className="space-y-1.5">
                <SectionLabel as="label" weight="bold">{t("reports.visualizer.pdfOrientation")}</SectionLabel>
                <div className="flex gap-1 p-1 bg-muted rounded-xl">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onPdfOrientationChange("p")}
                    className={`min-h-11 flex-1 px-2 rounded-lg text-xs font-black uppercase shadow-none ${pdfOrientation === "p" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {t("reports.export.portrait")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onPdfOrientationChange("l")}
                    className={`min-h-11 flex-1 px-2 rounded-lg text-xs font-black uppercase shadow-none ${pdfOrientation === "l" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {t("reports.export.landscape")}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <SectionLabel as="label" weight="bold">{t("reports.visualizer.pdfPageSize")}</SectionLabel>
                <FormSelect
                  value={pdfFormat}
                  onChange={onPdfFormatChange}
                  className="w-full text-xs"
                  options={[
                    { value: "a4", label: t("reports.builder.formatA4") },
                    { value: "letter", label: t("reports.builder.formatLetter") },
                    { value: "a3", label: t("reports.builder.formatA3") },
                    { value: "legal", label: t("reports.builder.formatLegal") },
                  ]}
                />
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => window.print()}
            className="bg-card/60 hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground rounded-xl shadow-none"
            title={t("reports.visualizer.printReport")}
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onExportExcel}
            className="bg-card/60 hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground rounded-xl shadow-none"
            title={t("reports.visualizer.exportExcel")}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-success" />
          </Button>

          <div className="flex bg-card/60 border border-border/50 rounded-xl overflow-x-auto p-0.5 items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onExportPng}
              className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg shadow-none"
              title={t("reports.visualizer.exportPng")}
            >
              <Image className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onExportPdf}
              className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg shadow-none"
              title={t("reports.visualizer.exportPdf")}
            >
              <FileText className="w-3.5 h-3.5 text-destructive" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onTogglePdfSettings}
              className={`hover:bg-muted rounded-lg shadow-none ${showPdfSettings ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
              title={t("reports.visualizer.pdfSettings")}
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
