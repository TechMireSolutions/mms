import type { JSX } from "react";
import { Settings } from "lucide-react";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { type PreviewRow } from "./customReportBuilderFields";

interface CustomReportBuilderPreviewVisualizerProps {
  previewData: PreviewRow[];
  selectedFields: string[];
  resolveFieldLabel: (field: string) => string;
}

export function CustomReportBuilderPreviewVisualizer({
  previewData,
  selectedFields,
  resolveFieldLabel,
}: CustomReportBuilderPreviewVisualizerProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={`${WORK_SURFACE} overflow-hidden flex-1 min-h-[13.75rem]`}>
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
  );
}
