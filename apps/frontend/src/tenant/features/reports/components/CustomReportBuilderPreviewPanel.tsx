import type { Dispatch, JSX, SetStateAction } from "react";
import { AnimatePresence } from "framer-motion";
import { Database, FileSpreadsheet, FileText, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { type AppTranslationKey } from "@mms/shared";
import { DraggableField } from "./CustomReportBuilderDraggableField";
import { type AggregateFn, type PreviewRow } from "./customReportBuilderFields";

interface CustomReportBuilderPreviewPanelProps {
  selectedFields: string[];
  setSelectedFields: Dispatch<SetStateAction<string[]>>;
  previewData: PreviewRow[];
  aggregate: AggregateFn;
  groupBy: string;
  reportName: string;
  orientation: "p" | "l";
  pageSize: string;
  removeField: (field: string) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  resolveFieldLabel: (field: string) => string;
}

export function CustomReportBuilderPreviewPanel({
  selectedFields,
  setSelectedFields,
  previewData,
  aggregate,
  groupBy,
  reportName,
  orientation,
  pageSize,
  removeField,
  moveUp,
  moveDown,
  resolveFieldLabel,
}: CustomReportBuilderPreviewPanelProps): JSX.Element {
  const { t } = useTranslation();

  const handleExportExcel = async (): Promise<void> => {
    if (previewData.length === 0) return;
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(previewData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Custom Report");
    XLSX.writeFile(workbook, `${reportName.replace(/\s+/g, "_")}.xlsx`);
  };

  const handleExportPdf = async (): Promise<void> => {
    if (previewData.length === 0) return;
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;

    const doc = new jsPDF({
      orientation,
      unit: "mm",
      format: pageSize,
    });
    doc.text(reportName, 14, 15);
    const tableData = previewData.map((previewRow) => selectedFields.map((selectedField) => previewRow[selectedField]));
    autoTable(doc, {
      head: [selectedFields],
      body: tableData as string[][],
      startY: 20,
      styles: { fontSize: orientation === "l" ? 8 : 10 },
    });
    doc.save(`${reportName.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 ms-1">
          <label className="min-w-0 text-xs font-bold text-muted-foreground uppercase tracking-widest block">
            {t("reports.builder.selectedColumns", { count: selectedFields.length })}
          </label>
          {selectedFields.length > 0 && (
            <Button
              onClick={() => setSelectedFields([])}
              variant="link"
              className="min-h-11 shrink-0 text-xs font-bold uppercase tracking-wider text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1 cursor-pointer px-2 hover:no-underline"
              type="button"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t("reports.builder.clearColumns")}
            </Button>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-background/30 p-3 shadow-inner">
          {selectedFields.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground italic flex flex-col items-center justify-center gap-1.5">
              <Database className="w-6 h-6 opacity-40 text-muted-foreground" />
              {t("reports.builder.emptyColumns")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pe-1 custom-scrollbar text-start">
              <AnimatePresence>
                {selectedFields.map((selectedField, index) => (
                  <DraggableField
                    key={selectedField}
                    field={resolveFieldLabel(selectedField)}
                    onRemove={() => removeField(selectedField)}
                    onMoveUp={() => moveUp(index)}
                    onMoveDown={() => moveDown(index)}
                    isFirst={index === 0}
                    isLast={index === selectedFields.length - 1}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-end mt-4">
        <div className="flex items-center justify-between ms-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
              {t("reports.builder.liveVisualizer", { count: previewData.length })}
            </label>
            {groupBy && (
              <span className="text-xs font-bold uppercase bg-primary/15 text-primary px-1.5 py-0.5 rounded-md">
                {t("reports.builder.groupedBadge")}
              </span>
            )}
            {aggregate !== "None" && (
              <span className="text-xs font-bold uppercase bg-success/15 text-success px-1.5 py-0.5 rounded-md">
                {t(`reports.visualizer.op${aggregate === "Average" ? "Avg" : aggregate}` as AppTranslationKey)}
              </span>
            )}
          </div>

          {previewData.length > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-success hover:text-success px-3 rounded-xl border border-success/30 bg-success/10 hover:bg-success/15 transition-all shadow-sm cursor-pointer"
                type="button"
                title={t("reports.builder.exportExcelTooltip")}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> {t("reports.builder.sheet")}
              </Button>
              <Button
                onClick={handleExportPdf}
                variant="outline"
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-destructive hover:text-destructive px-3 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/15 transition-all shadow-sm cursor-pointer"
                type="button"
                title={t("reports.builder.exportPdfTooltip")}
              >
                <FileText className="w-3.5 h-3.5" /> {t("reports.builder.document")}
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border/80 overflow-hidden shadow-xl bg-card/65 backdrop-blur-md flex-1 min-h-[13.75rem]">
          {previewData.length === 0 ? (
            <div className="w-full h-full flex flex-col justify-center items-center gap-2 py-12 text-muted-foreground text-xs italic">
              <Settings className="w-7 h-7 animate-spin text-muted-foreground opacity-30" />
              {t("reports.builder.waitingData")}
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {previewData.map((previewRow, rowIndex) => (
                  <article
                    key={rowIndex}
                    className="space-y-2 rounded-xl border border-border bg-card p-3"
                  >
                    <dl className="grid grid-cols-1 gap-2 text-sm">
                      {selectedFields.map((selectedField) => {
                        const fieldLabel = resolveFieldLabel(selectedField);
                        const cellValue = previewRow[fieldLabel];
                        return (
                          <div key={selectedField}>
                            <dt className="text-xs font-semibold text-muted-foreground">{fieldLabel}</dt>
                            <dd className="text-foreground font-semibold">
                              {cellValue !== undefined && cellValue !== null
                                ? String(cellValue)
                                : <span className="text-muted-foreground/30 text-xs italic">—</span>
                              }
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-auto max-h-72 custom-scrollbar md:block">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border/70 sticky top-0 z-10 backdrop-blur-lg">
                    <tr>
                      {selectedFields.map((selectedField) => (
                        <th key={selectedField} className="px-4 py-3.5 text-start text-xs font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                          {resolveFieldLabel(selectedField)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {previewData.map((previewRow, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-primary/[0.02] transition-colors group">
                        {selectedFields.map((selectedField) => {
                          const fieldLabel = resolveFieldLabel(selectedField);
                          const cellValue = previewRow[fieldLabel];
                          return (
                            <td key={selectedField} className="px-4 py-3 text-foreground font-semibold whitespace-nowrap group-hover:text-primary transition-colors">
                              {cellValue !== undefined && cellValue !== null
                                ? String(cellValue)
                                : <span className="text-muted-foreground/30 text-xs italic">—</span>
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {previewData.length > 0 && (
          <div className="flex items-center justify-between px-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>{t("reports.builder.autoFetched")}</span>
            <span>{groupBy ? t("reports.builder.groupedBy", { field: resolveFieldLabel(groupBy) }) : t("reports.builder.flatLayout")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
