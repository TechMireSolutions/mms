import React, { useState } from "react";
import { Printer, FileSpreadsheet, FileText, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface ReportExportBarProps {
  title: string;
  onPrint?: () => void;
  data?: unknown[];
  headers?: string[];
}

/**
 * ReportExportBar provides export action triggers (Print, Excel, PDF) for reports.
 * Includes dynamic PDF configuration for size and orientation.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
export default function ReportExportBar({ title, onPrint, data, headers }: ReportExportBarProps): React.JSX.Element {
  const { t } = useTranslation();
  const [orientation, setOrientation] = useState<"p" | "l">("p");
  const [format, setFormat]           = useState<string>("a4");
  const [showPdfSettings, setShowPdfSettings] = useState<boolean>(false);

  const handlePrint = (): void => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  const handleExcel = async (): Promise<void> => {
    if (!data || data.length === 0) return;
    
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePdf = async (): Promise<void> => {
    if (!data || data.length === 0) return;

    const [jsPDFModule, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;

    // Initialize with dynamic orientation and format
    const doc = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: format,
    });

    doc.text(title, 14, 15);
    
    const tableData = data.map((row) => Object.values(row as Record<string, unknown>) as (string | number | boolean)[]);
    const tableHeaders = headers || (data.length > 0 ? Object.keys(data[0] as Record<string, unknown>) : []);

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData as (string | number | boolean)[][],
      startY: 20,
      styles: { fontSize: orientation === "l" ? 8 : 10 }, // smaller font for landscape if needed
    });

    doc.save(`${title.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap py-2 text-left relative">
      <p className="text-xs text-muted-foreground">
        {t("reports.export.title").split("{name}")[0]}
        <span className="font-semibold text-foreground">{title}</span>
        {t("reports.export.title").split("{name}")[1]}
      </p>
      
      <div className="flex items-center gap-2">
        {/* PDF Settings Popover (Simple) */}
        {showPdfSettings && (
          <div className="absolute right-0 bottom-full mb-2 bg-card border border-border rounded-xl p-3 shadow-xl z-50 flex flex-col gap-3 min-w-[200px]">
             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("reports.export.orientation")}</label>
               <div className="flex gap-1 p-1 bg-muted rounded-lg">
                 <button 
                  onClick={() => setOrientation("p")}
                  className={`flex-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${orientation === "p" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                 >
                   {t("reports.export.portrait")}
                 </button>
                 <button 
                  onClick={() => setOrientation("l")}
                  className={`flex-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${orientation === "l" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                 >
                   {t("reports.export.landscape")}
                 </button>
               </div>
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("reports.export.pageSize")}</label>
               <select 
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                className="w-full text-xs rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
               >
                 <option value="a4">{t("reports.builder.formatA4")}</option>
                 <option value="letter">{t("reports.builder.formatLetter")}</option>
                 <option value="a3">{t("reports.builder.formatA3")}</option>
                 <option value="legal">{t("reports.builder.formatLegal")}</option>
               </select>
             </div>
          </div>
        )}

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
        >
          <Printer className="w-3.5 h-3.5" />
          {t("reports.export.print")}
        </button>
        <button 
          onClick={handleExcel}
          disabled={!data || data.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50" 
          type="button"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-success" />
          {t("reports.export.excel")}
        </button>
        
        <div className="flex rounded-lg border border-border bg-card overflow-hidden">
          <button 
            onClick={handlePdf}
            disabled={!data || data.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border-r border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50" 
            type="button"
          >
            <FileText className="w-3.5 h-3.5 text-destructive" />
            {t("reports.export.pdf")}
          </button>
          <button 
            onClick={() => setShowPdfSettings(!showPdfSettings)}
            className={`px-2 py-1.5 hover:bg-muted transition-colors ${showPdfSettings ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
            title={t("reports.export.settings")}
            type="button"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
