import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, 
  Plus, Trash2, Image, FileText, Pin, 
  PinOff, Filter, CheckCircle2, ChevronDown, ChevronUp, 
  Table, Sparkles, Printer, FileSpreadsheet, Settings
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, 
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  Legend, Tooltip, XAxis, YAxis, CartesianGrid
} from "recharts";
import SafeResponsiveContainer from "@/tenant/features/reports/components/SafeResponsiveContainer";
import {
  CHART_PALETTE_DEFS,
  DEFAULT_CHART_PALETTE_ID,
  getChartPaletteColors,
  isColorblindSafeChartPalette,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { getBrandingChartPalette } from "@/lib/brandingChartPalette";
import { getCollection, getObject, saveObject } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { METADATA_FIELDS, VisualizerConfig, type ReportCollection } from "@/tenant/features/reports/components/reportMetadata";

interface CollectionMeta {
  name: string;
  dbKey: string;
  defaultData: readonly unknown[];
  fields: readonly { readonly value: string; readonly label: string; readonly isNumeric?: boolean }[];
  numericFields: readonly { readonly value: string; readonly label: string }[];
}

const METADATA_CONFIGS: Record<string, CollectionMeta> = METADATA_FIELDS as unknown as Record<string, CollectionMeta>;

interface FilterRule {
  id: string;
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "startsWith";
  value: string;
}

interface CustomWidget {
  id: string;
  title: string;
  category: string;
  collection: ReportCollection;
  chartType: "bar" | "line" | "area" | "pie" | "radar";
  xAxisField: string;
  operation: "count" | "sum" | "avg";
  targetField?: string;
  filterField?: string;
  filterOperator: "equals" | "contains" | "gt" | "lt";
  filterValue?: string;
  color: string;
  isPinnedToDashboard: boolean;
}

interface AggregatedItem {
  name: string;
  value: number;
  count: number;
}

interface DynamicChartVisualizerProps {
  initialConfig?: VisualizerConfig;
  onSave?: (config: VisualizerConfig) => void;
  onClose?: () => void;
}

/**
 * DynamicChartVisualizer Component
 * Provides a state-of-the-art interface to design, filter, analyze, export,
 * and pin dynamic charts built from live client databases in real-time.
 */
export default function DynamicChartVisualizer({
  initialConfig,
  onSave,
  onClose
}: DynamicChartVisualizerProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const chartRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Builder config states
  const [title, setTitle] = useState(() => initialConfig?.title || t("reports.visualizer.defaultTitle"));
  const [collectionKey, setCollectionKey] = useState<keyof typeof METADATA_CONFIGS>(initialConfig?.collection || "students");
  const [chartType, setChartType] = useState<"bar" | "line" | "area" | "pie" | "radar">(initialConfig?.chartType || "bar");
  const [xAxisField, setXAxisField] = useState(initialConfig?.xAxisField || "status");
  const [operation, setOperation] = useState<"count" | "sum" | "avg" | "min" | "max">(initialConfig?.operation || "count");
  const [targetField, setTargetField] = useState(initialConfig?.targetField || "");
  const [activePalette, setActivePalette] = useState(initialConfig?.activePalette || DEFAULT_CHART_PALETTE_ID);
  
  // Advanced settings toggles
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showDataTable, setShowDataTable] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<"p" | "l">("p");
  const [pdfFormat, setPdfFormat] = useState<string>("a4");
  const [showPdfSettings, setShowPdfSettings] = useState<boolean>(false);

  // Advanced Multi-Filtering rules state
  const [filters, setFilters] = useState<FilterRule[]>([]);

  // Pinned widgets checking state
  const [dashboardWidgets, setDashboardWidgets] = useState<CustomWidget[]>(() => {
    return getObject<CustomWidget[]>("kpi_custom_widgets", []);
  });

  // Responsive scaling container observer
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver((resizeEntries) => {
      for (const resizeEntry of resizeEntries) {
        if (resizeEntry.contentRect.width > 0) {
          setContainerWidth(resizeEntry.contentRect.width);
        }
      }
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const axisFontSize = useMemo(() => {
    return Math.max(9, Math.min(13, Math.round(containerWidth / 60)));
  }, [containerWidth]);

  const legendFontSize = useMemo(() => {
    return Math.max(10, Math.min(13, Math.round(containerWidth / 55)));
  }, [containerWidth]);

  const tickGap = useMemo(() => {
    return Math.max(10, Math.min(30, Math.round(containerWidth / 25)));
  }, [containerWidth]);

  const activeMeta = METADATA_CONFIGS[collectionKey];

  // Sync state on collection key change + auto-map default chart
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }
    const meta = METADATA_CONFIGS[collectionKey];
    if (meta) {
      if (meta.fields[0]) {
        const defaultField = meta.fields[0].value;
        setXAxisField(defaultField);
        // Auto-mapping check
        const isDateField = /date|time|created|updated|issued|registered/i.test(defaultField);
        setChartType(isDateField ? "line" : "bar");
      }
      if (meta.numericFields[0]) {
        setTargetField(meta.numericFields[0].value);
      } else {
        setTargetField("");
        setOperation("count");
      }
    }
    setFilters([]);
  }, [collectionKey]);

  // Sync chart type on xAxisField change (User selects another dimension)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const isDateField = /date|time|created|updated|issued|registered/i.test(xAxisField);
    setChartType(isDateField ? "line" : "bar");
  }, [xAxisField]);

  // Adjust operation if numeric fields are missing
  useEffect(() => {
    if (activeMeta.numericFields.length === 0 && operation !== "count") {
      setOperation("count");
    }
  }, [operation, activeMeta]);

  // Read data from DB and apply queries with smart sorting/grouping
  const processedData = useMemo<AggregatedItem[]>(() => {
    const collectionRows = getCollection(activeMeta.dbKey, activeMeta.defaultData as unknown[]) as Record<string, unknown>[];
    const denominations = getCollection<any>("hasanat_denoms", []);
    const pointsMap = new Map<string, number>();
    denominations.forEach((denomination) => pointsMap.set(denomination.id, denomination.points));
    
    // 1. Apply multiple filters
    const filteredRows = collectionRows.filter((collectionRow) => {
      if (!collectionRow) return false;
      return filters.every((rule) => {
        if (!rule.field || !rule.value) return true;
        const fieldValue = collectionRow[rule.field];
        if (fieldValue === undefined || fieldValue === null) return false;
        
        const stringValue = String(fieldValue).toLowerCase();
        const ruleValue = String(rule.value).toLowerCase();

        switch (rule.operator) {
          case "equals":
            return stringValue === ruleValue;
          case "contains":
            return stringValue.includes(ruleValue);
          case "startsWith":
            return stringValue.startsWith(ruleValue);
          case "gt":
            return Number(fieldValue) > Number(rule.value);
          case "lt":
            return Number(fieldValue) < Number(rule.value);
          default:
            return true;
        }
      });
    });

    // 2. Group records by xAxisField dimension
    const groups: Record<string, Record<string, unknown>[]> = {};
    filteredRows.forEach((filteredRow) => {
      const xAxisValue = filteredRow[xAxisField];
      const groupKey = xAxisValue === undefined || xAxisValue === null || xAxisValue === "" ? "Unknown / Null" : String(xAxisValue);
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(filteredRow);
    });

    // 3. Compute Aggregations
    const aggregatedRows = Object.entries(groups).map(([name, groupItems]) => {
      let finalValue = 0;
      const count = groupItems.length;

      if (operation === "count") {
        finalValue = count;
      } else {
        const targetMetricField = targetField || "";
        const values: number[] = [];

        groupItems.forEach((groupItem) => {
          // Special Hasanat points calculation
          if (collectionKey === "hasanat_distributions" && targetMetricField === "points") {
            const denominationName = String(groupItem.denominationName || "").toLowerCase();
            const points = pointsMap.get(groupItem.denominationId as string) || (
              denominationName.includes("silver") ? 150 :
              denominationName.includes("gold") ? 500 :
              denominationName.includes("platinum") ? 1000 :
              denominationName.includes("diamond") ? 2500 : 50
            );
            values.push(Number(groupItem.quantity || 1) * points);
          } else {
            const numericValue = Number(groupItem[targetMetricField]);
            if (!isNaN(numericValue)) {
              values.push(numericValue);
            }
          }
        });

        if (values.length > 0) {
          switch (operation) {
            case "sum":
              finalValue = values.reduce((sum, value) => sum + value, 0);
              break;
            case "avg":
              finalValue = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
              break;
            case "min":
              finalValue = Math.min(...values);
              break;
            case "max":
              finalValue = Math.max(...values);
              break;
            default:
              finalValue = 0;
          }
        }
      }

      return {
        name,
        value: finalValue,
        count
      };
    });

    // 4. Clutter Control: Smart sorting & grouping
    const isDateField = /date|time|created|updated|issued|registered/i.test(xAxisField);
    if (isDateField) {
      // Sort chronologically
      const sortedRows = aggregatedRows.sort((firstItem, secondItem) => {
        const timeA = new Date(firstItem.name).getTime();
        const timeB = new Date(secondItem.name).getTime();
        if (isNaN(timeA) || isNaN(timeB)) {
          return firstItem.name.localeCompare(secondItem.name);
        }
        return timeA - timeB;
      });
      // Cap timeline at most recent 20 dates to stay readable
      if (sortedRows.length > 20) {
        return sortedRows.slice(-20);
      }
      return sortedRows;
    } else {
      // Sort categories descending by value
      const sortedRows = aggregatedRows.sort((firstItem, secondItem) => secondItem.value - firstItem.value);
      if (sortedRows.length > 10) {
        const topRows = sortedRows.slice(0, 9);
        const remainingRows = sortedRows.slice(9);
        
        const othersValue = remainingRows.reduce((sum, remainingRow) => sum + remainingRow.value, 0);
        const othersCount = remainingRows.reduce((sum, remainingRow) => sum + remainingRow.count, 0);
        
        let finalOthersValue = othersValue;
        if (operation === "avg") {
          const totalCount = remainingRows.reduce((sum, remainingRow) => sum + remainingRow.count, 0);
          if (totalCount > 0) {
            const weightedSum = remainingRows.reduce((sum, remainingRow) => sum + (remainingRow.value * remainingRow.count), 0);
            finalOthersValue = Math.round(weightedSum / totalCount);
          }
        } else if (operation === "min") {
          finalOthersValue = Math.min(...remainingRows.map((remainingRow) => remainingRow.value));
        } else if (operation === "max") {
          finalOthersValue = Math.max(...remainingRows.map((remainingRow) => remainingRow.value));
        }

        return [
          ...topRows,
          {
            name: `Others (${remainingRows.length} fields)`,
            value: finalOthersValue,
            count: othersCount
          }
        ];
      }
      return sortedRows;
    }
  }, [collectionKey, xAxisField, operation, targetField, filters, activeMeta]);

  // Checks if this chart configuration is pinned to dashboard
  const isPinned = useMemo(() => {
    return dashboardWidgets.some(
      (widget) =>
        widget.collection === collectionKey &&
        widget.xAxisField === xAxisField &&
        widget.operation === (operation === "min" || operation === "max" ? "count" : operation) && // map compatibility
        widget.chartType === chartType &&
        widget.isPinnedToDashboard
    );
  }, [dashboardWidgets, collectionKey, xAxisField, operation, chartType]);

  // Toggles pin state in localStorage
  const handleTogglePin = () => {
    const nextWidgets = [...dashboardWidgets];
    const matchingIndex = nextWidgets.findIndex(
      (widget) =>
        widget.collection === collectionKey &&
        widget.xAxisField === xAxisField &&
        widget.operation === (operation === "min" || operation === "max" ? "count" : operation)
    );

    if (matchingIndex > -1) {
      nextWidgets[matchingIndex].isPinnedToDashboard = !nextWidgets[matchingIndex].isPinnedToDashboard;
    } else {
      // Create new custom widget
      const newWidget: CustomWidget = {
        id: "widget-" + Date.now(),
        title: title,
        category: collectionKey === "finance_invoices" ? "financial" : (collectionKey === "attendance_records" ? "attendance" : String(collectionKey)),
        collection: collectionKey as CustomWidget["collection"],
        chartType: chartType,
        xAxisField: xAxisField,
        operation: operation === "min" || operation === "max" ? "count" : operation,
        targetField: targetField,
        color: (activePalette === "emeraldForest" || activePalette.startsWith("tol")) ? "emerald" : (activePalette === "oceanBreeze" || activePalette === "accessibleColorblind" ? "blue" : (activePalette === "cosmicViolet" ? "violet" : "amber")),
        isPinnedToDashboard: true,
        filterOperator: "equals"
      };
      nextWidgets.push(newWidget);
    }

    setDashboardWidgets(nextWidgets);
    saveObject("kpi_custom_widgets", nextWidgets);
    window.dispatchEvent(new Event("local-database-update"));
  };

  // Add a filter rule
  const handleAddFilter = () => {
    const defaultField = activeMeta.fields[0]?.value || "";
    const newRule: FilterRule = {
      id: "filter-" + Date.now() + Math.random().toString(36).slice(2, 5),
      field: defaultField,
      operator: "equals",
      value: ""
    };
    setFilters([...filters, newRule]);
  };

  // Update a filter rule
  const handleUpdateFilter = (id: string, updates: Partial<FilterRule>) => {
    const updatedFilters = filters.map((rule) => {
      if (rule.id === id) {
        return { ...rule, ...updates };
      }
      return rule;
    });
    setFilters(updatedFilters);
  };

  // Delete a filter rule
  const handleDeleteFilter = (id: string) => {
    setFilters(filters.filter((rule) => rule.id !== id));
  };

  // Export chart to PNG image file
  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "rgba(255, 255, 255, 1)",
        scale: 2,
        logging: false
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${title.toLowerCase().replace(/\s+/g, "-")}-chart.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export chart image", error);
    }
  };

  // Export summary database values to Excel file
  const handleExportExcel = async () => {
    if (processedData.length === 0) return;
    try {
      const XLSX = await import("xlsx");
      const sheetData = processedData.map((aggregatedItem) => ({
        "Grouping Key": aggregatedItem.name,
        "Aggregated Value": aggregatedItem.value,
        "Count": aggregatedItem.count
      }));
      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Analytics");
      XLSX.writeFile(workbook, `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Failed to export Excel spreadsheet", error);
    }
  };

  // Export report with chart + data grid to PDF
  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    try {
      const [html2canvasModule, jsPDFModule, autoTableModule] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "rgba(255, 255, 255, 1)",
        scale: 2,
        logging: false
      });
      const dataUrl = canvas.toDataURL("image/png");

      let formatWidth = 210;
      let formatHeight = 297;
      if (pdfFormat === "a3") {
        formatWidth = 297;
        formatHeight = 420;
      } else if (pdfFormat === "legal") {
        formatWidth = 215.9;
        formatHeight = 355.6;
      } else if (pdfFormat === "letter") {
        formatWidth = 215.9;
        formatHeight = 279.4;
      }

      if (pdfOrientation === "l") {
        const previousFormatWidth = formatWidth;
        formatWidth = formatHeight;
        formatHeight = previousFormatWidth;
      }

      const doc = new jsPDF({
        orientation: pdfOrientation,
        unit: "mm",
        format: pdfFormat
      });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text("MMS - Analytics Report", 14, 20);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${formatDateTime(new Date())}`, 14, 26);
      doc.text(`Subject Dataset: ${activeMeta.name} (${operation.toUpperCase()} of ${xAxisField})`, 14, 31);
      
      doc.line(14, 34, formatWidth - 14, 34);

      // Margins
      const margin = 14;
      const printableWidth = formatWidth - (margin * 2);
      const chartWidth = printableWidth;
      const chartHeight = (canvas.height / canvas.width) * chartWidth;

      // Render chart image
      doc.addImage(dataUrl, "PNG", margin, 38, chartWidth, chartHeight);

      // Render tabular data
      autoTable(doc, {
        head: [["Grouping Key (X-Axis)", `Aggregated Value (${operation.toUpperCase()})`, "Record Count"]],
        body: processedData.map((row) => [row.name, row.value.toLocaleString(), row.count]),
        startY: chartHeight + 48,
        styles: { fontSize: pdfOrientation === "l" ? 9 : 10 },
        headStyles: { fillColor: [16, 185, 129] }, // emerald theme color
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}-report.pdf`);
    } catch (error) {
      console.error("Failed to export PDF report", error);
    }
  };

  const currentColors = [...getChartPaletteColors(activePalette)];

  // Recharts custom tooltips and widgets
  const renderChart = () => {
    if (processedData.length === 0) {
      return (
        <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded-3xl bg-card/20">
          <Info className="w-6 h-6 mb-2 opacity-40 animate-bounce" />
          <p className="text-xs font-bold text-foreground">{t("reports.visualizer.noData")}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t("reports.visualizer.noDataSubtitle")}</p>
        </div>
      );
    }

    const firstColor = currentColors[0] || getBrandingChartPalette().primary;

    switch (chartType) {
      case "bar":
        return (
          <SafeResponsiveContainer width="100%" height={260}>
            <BarChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />}
              <XAxis dataKey="name" tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveEnd" minTickGap={tickGap} />
              <YAxis tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              {showTooltip && <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: `${axisFontSize}px` }} />}
              {showLegend && <Legend wrapperStyle={{ fontSize: `${legendFontSize}px`, paddingTop: "12px" }} />}
              <Bar dataKey="value" name={t(`reports.visualizer.op${operation === "avg" ? "Avg" : (operation === "count" ? "Count" : operation.charAt(0).toUpperCase() + operation.slice(1))}` as any)} radius={[4, 4, 0, 0]} maxBarSize={30}>
                {processedData.map((_, index) => (
                  <Cell key={index} fill={currentColors[index % currentColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </SafeResponsiveContainer>
        );

      case "line":
        return (
          <SafeResponsiveContainer width="100%" height={260}>
            <LineChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />}
              <XAxis dataKey="name" tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveEnd" minTickGap={tickGap} />
              <YAxis tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              {showTooltip && <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: `${axisFontSize}px` }} />}
              {showLegend && <Legend wrapperStyle={{ fontSize: `${legendFontSize}px`, paddingTop: "12px" }} />}
              <Line type="monotone" dataKey="value" name={t(`reports.visualizer.op${operation === "avg" ? "Avg" : (operation === "count" ? "Count" : operation.charAt(0).toUpperCase() + operation.slice(1))}` as any)} stroke={firstColor} strokeWidth={3} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
            </LineChart>
          </SafeResponsiveContainer>
        );

      case "area":
        return (
          <SafeResponsiveContainer width="100%" height={260}>
            <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={firstColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={firstColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />}
              <XAxis dataKey="name" tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveEnd" minTickGap={tickGap} />
              <YAxis tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              {showTooltip && <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: `${axisFontSize}px` }} />}
              {showLegend && <Legend wrapperStyle={{ fontSize: `${legendFontSize}px`, paddingTop: "12px" }} />}
              <Area type="monotone" dataKey="value" name={t(`reports.visualizer.op${operation === "avg" ? "Avg" : (operation === "count" ? "Count" : operation.charAt(0).toUpperCase() + operation.slice(1))}` as any)} stroke={firstColor} fill="url(#visGrad)" strokeWidth={2.5} />
            </AreaChart>
          </SafeResponsiveContainer>
        );

      case "pie":
        return (
          <SafeResponsiveContainer width="100%" height={260}>
            <PieChart>
              {showTooltip && <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: `${axisFontSize}px` }} />}
              {showLegend && (
                <Legend 
                  wrapperStyle={{ fontSize: `${legendFontSize}px` }} 
                  layout={containerWidth < 450 ? "horizontal" : "vertical"} 
                  align={containerWidth < 450 ? "center" : "right"} 
                  verticalAlign={containerWidth < 450 ? "bottom" : "middle"} 
                />
              )}
              <Pie
                data={processedData}
                dataKey="value"
                nameKey="name"
                cx={containerWidth < 450 ? "50%" : "40%"}
                cy="50%"
                innerRadius={Math.min(50, Math.round(containerWidth / 10))}
                outerRadius={Math.min(80, Math.round(containerWidth / 6))}
                paddingAngle={3}
                label={containerWidth >= 400 ? ({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%` : false}
                labelLine={false}
              >
                {processedData.map((_, index) => (
                  <Cell key={index} fill={currentColors[index % currentColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </SafeResponsiveContainer>
        );

      case "radar":
        return (
          <SafeResponsiveContainer width="100%" height={260}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={processedData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: Math.max(8, axisFontSize - 1) }} />
              <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fontSize: Math.max(7, axisFontSize - 2) }} />
              <Radar name={t(`reports.visualizer.op${operation === "avg" ? "Avg" : (operation === "count" ? "Count" : operation.charAt(0).toUpperCase() + operation.slice(1))}` as any)} dataKey="value" stroke={firstColor} fill={firstColor} fillOpacity={0.25} />
              {showTooltip && <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: `${axisFontSize}px` }} />}
            </RadarChart>
          </SafeResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const totalValue = processedData.reduce((sum, aggregatedItem) => sum + aggregatedItem.value, 0);
  const avgGroupValue = processedData.length ? Math.round(totalValue / processedData.length) : 0;
  const topGroup = processedData[0]?.name || "N/A";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left font-sans">
      
      {/* 1. Left Configurator Panel (5 cols) */}
      <div className="lg:col-span-5 space-y-5 print:hidden">
        <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">{t("reports.visualizer.configTitle")}</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("reports.visualizer.configSubtitle")}</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Widget Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.chartTitleLabel")}</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("reports.visualizer.titlePlaceholder")}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
              />
            </div>

            {/* Collection source selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.dataCollection")}</label>
                <select
                  value={collectionKey}
                  onChange={(event) => setCollectionKey(event.target.value as keyof typeof METADATA_CONFIGS)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                >
                  {Object.entries(METADATA_CONFIGS).map(([metadataKey, metadataConfig]) => {
                    const transKey = `reports.collections.${metadataKey}`;
                    const translated = t(transKey as any);
                    return (
                      <option key={metadataKey} value={metadataKey}>
                        {translated === transKey ? metadataConfig.name : translated}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.xAxisDimension")}</label>
                <select
                  value={xAxisField}
                  onChange={(event) => setXAxisField(event.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                >
                  {activeMeta.fields.map((metadataField) => {
                    const transKey = `reports.fields.${metadataField.value}`;
                    const translated = t(transKey as any);
                    return (
                      <option key={metadataField.value} value={metadataField.value}>
                        {translated === transKey ? metadataField.label : translated}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Formula operation & target */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.operation")}</label>
                <select
                  value={operation}
                  onChange={(event) => setOperation(event.target.value as "count" | "sum" | "avg" | "min" | "max")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                >
                  <option value="count">{t("reports.visualizer.opCount")}</option>
                  {activeMeta.numericFields.length > 0 && (
                    <>
                      <option value="sum">{t("reports.visualizer.opSum")}</option>
                      <option value="avg">{t("reports.visualizer.opAvg")}</option>
                      <option value="min">{t("reports.visualizer.opMin")}</option>
                      <option value="max">{t("reports.visualizer.opMax")}</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.targetField")}</label>
                <select
                  disabled={operation === "count"}
                  value={targetField}
                  onChange={(event) => setTargetField(event.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold disabled:opacity-40"
                >
                  {activeMeta.numericFields.length === 0 ? (
                    <option value="">{t("reports.widgets.builder.noNumericFields")}</option>
                  ) : (
                    activeMeta.numericFields.map((numericField) => {
                      const transKey = `reports.fields.${numericField.value}`;
                      const translated = t(transKey as any);
                      return (
                        <option key={numericField.value} value={numericField.value}>
                          {translated === transKey ? numericField.label : translated}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
            </div>

            {/* Visualizer Type & Color Palette Theme */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.chartType")}</label>
                <select
                  value={chartType}
                  onChange={(event) => setChartType(event.target.value as "bar" | "line" | "area" | "pie" | "radar")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                >
                  <option value="bar">{t("reports.visualizer.chartBar")}</option>
                  <option value="line">{t("reports.visualizer.chartLine")}</option>
                  <option value="area">{t("reports.visualizer.chartArea")}</option>
                  <option value="pie">{t("reports.visualizer.chartPie")}</option>
                  <option value="radar">{t("reports.visualizer.chartRadar")}</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.colorPalette")}</label>
                  {(isColorblindSafeChartPalette(activePalette)) && (
                    <span className="text-[8px] bg-success/15 text-success px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest leading-none">{t('charts.accessibleBadge')}</span>
                  )}
                </div>
                <select
                  value={activePalette}
                  onChange={(event) => setActivePalette(event.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                >
                  {CHART_PALETTE_DEFS.filter((def) => def.id !== 'brand' && def.colors.length > 0).map((def) => (
                    <option key={def.id} value={def.id}>{t(def.labelKey)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Styling options */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">{t("reports.visualizer.displayCustomizations")}</span>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card/25 hover:bg-card/45 transition-colors cursor-pointer select-none text-[11px] font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(event) => setShowGrid(event.target.checked)}
                    className="rounded text-primary focus:ring-primary/10 cursor-pointer"
                  />
                  {t("reports.visualizer.gridLines")}
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card/25 hover:bg-card/45 transition-colors cursor-pointer select-none text-[11px] font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={showLegend}
                    onChange={(event) => setShowLegend(event.target.checked)}
                    className="rounded text-primary focus:ring-primary/10 cursor-pointer"
                  />
                  {t("reports.visualizer.legends")}
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card/25 hover:bg-card/45 transition-colors cursor-pointer select-none text-[11px] font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={showTooltip}
                    onChange={(event) => setShowTooltip(event.target.checked)}
                    className="rounded text-primary focus:ring-primary/10 cursor-pointer"
                  />
                  {t("reports.visualizer.tooltips")}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Filters builder inside panel */}
        <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">{t("reports.visualizer.queryFilters")}</h4>
                <p className="text-[9px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("reports.visualizer.filtersSubtitle")}</p>
              </div>
            </div>
            <button
              onClick={handleAddFilter}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all cursor-pointer"
              type="button"
            >
              <Plus className="w-3 h-3" />
              {t("reports.visualizer.addRule")}
            </button>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {filters.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center bg-card/10 rounded-2xl border border-dashed border-border/40">{t("reports.visualizer.noFilters")}</p>
            ) : (
              filters.map((rule) => (
                <div key={rule.id} className="flex gap-2 items-center bg-card/30 border border-border p-2.5 rounded-2xl">
                  {/* Field Selector */}
                  <select
                    value={rule.field}
                    onChange={(event) => handleUpdateFilter(rule.id, { field: event.target.value })}
                    className="flex-1 min-w-0 px-2 py-1 text-[11px] rounded-lg border border-border bg-card/60 text-foreground focus:outline-none"
                  >
                    {activeMeta.fields.map((metadataField) => {
                      const transKey = `reports.fields.${metadataField.value}`;
                      const translated = t(transKey as any);
                      return (
                        <option key={metadataField.value} value={metadataField.value}>
                          {translated === transKey ? metadataField.label : translated}
                        </option>
                      );
                    })}
                  </select>

                  {/* Operator */}
                  <select
                    value={rule.operator}
                    onChange={(event) => handleUpdateFilter(rule.id, { operator: event.target.value as FilterRule["operator"] })}
                    className="w-20 px-1 py-1 text-[11px] rounded-lg border border-border bg-card/60 text-foreground focus:outline-none font-medium"
                  >
                    <option value="equals">=</option>
                    <option value="contains">like</option>
                    <option value="startsWith">starts</option>
                    {activeMeta.fields.find((field) => field.value === rule.field)?.isNumeric && (
                      <>
                        <option value="gt">&gt;</option>
                        <option value="lt">&lt;</option>
                      </>
                    )}
                  </select>

                  {/* Input value */}
                  <input
                    type="text"
                    value={rule.value}
                    onChange={(event) => handleUpdateFilter(rule.id, { value: event.target.value })}
                    placeholder={t("reports.visualizer.filterValuePlaceholder")}
                    className="flex-1 min-w-0 px-2 py-1 text-[11px] rounded-lg border border-border bg-card/60 text-foreground focus:outline-none font-semibold"
                  />

                  {/* Remove */}
                  <button
                    onClick={() => handleDeleteFilter(rule.id)}
                    className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                    type="button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Right Visual Render Panel (7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        <div className="rounded-3xl border border-border/50 bg-card/45 backdrop-blur-2xl p-6 shadow-xl space-y-6">
          
          {/* Header metadata row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground tracking-tight leading-none">{title}</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                {(() => {
                  const collTransKey = `reports.collections.${collectionKey}`;
                  const collTranslated = t(collTransKey as any);
                  const collName = collTranslated === collTransKey ? activeMeta.name : collTranslated;

                  const axisTransKey = `reports.fields.${xAxisField}`;
                  const axisTranslated = t(axisTransKey as any);
                  const axisName = axisTranslated === axisTransKey ? xAxisField : axisTranslated;

                  return t("reports.visualizer.sourceSubtitle", {
                    source: collName,
                    axis: axisName
                  });
                })()}
              </p>
            </div>
            
            <div className="flex items-center gap-2 print:hidden">
              {onSave && (
                <button
                  onClick={() => {
                    onSave({
                      id: initialConfig?.id || "visual-" + Date.now(),
                      title,
                      collection: collectionKey as VisualizerConfig["collection"],
                      chartType,
                      xAxisField,
                      operation,
                      targetField,
                      activePalette
                    });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-primary text-primary-foreground border border-primary/50 text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-md shadow-primary/15"
                  type="button"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t("reports.visualizer.saveVisual")}
                </button>
              )}

              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-border bg-card/50 text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  type="button"
                >
                  {t("reports.visualizer.cancel")}
                </button>
              )}

              {/* Pin widget to home dashboard */}
              <button
                onClick={handleTogglePin}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isPinned
                    ? "border-success/30 bg-success/10 text-success shadow-md shadow-success/5"
                    : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
                }`}
                type="button"
              >
                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                {isPinned ? t("reports.visualizer.pinnedToHome") : t("reports.visualizer.pinToDashboard")}
              </button>

              {/* Exports button group */}
              <div className="flex items-center gap-1.5 relative">
                {showPdfSettings && (
                  <div className="absolute right-0 bottom-full mb-2 bg-card border border-border rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-3.5 min-w-[200px] backdrop-blur-xl">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("reports.visualizer.pdfOrientation")}</label>
                      <div className="flex gap-1 p-1 bg-muted rounded-xl">
                        <button 
                          onClick={() => setPdfOrientation("p")}
                          className={`flex-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${pdfOrientation === "p" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                          type="button"
                        >
                          {t("reports.export.portrait")}
                        </button>
                        <button 
                          onClick={() => setPdfOrientation("l")}
                          className={`flex-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${pdfOrientation === "l" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                          type="button"
                        >
                          {t("reports.export.landscape")}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("reports.visualizer.pdfPageSize")}</label>
                      <select 
                        value={pdfFormat}
                        onChange={(event) => setPdfFormat(event.target.value)}
                        className="w-full text-xs rounded-xl border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
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
                  onClick={() => window.print()}
                  className="p-1.5 bg-card/60 hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
                  title={t("reports.visualizer.printReport")}
                  type="button"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleExportExcel}
                  className="p-1.5 bg-card/60 hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
                  title={t("reports.visualizer.exportExcel")}
                  type="button"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-success" />
                </button>

                <div className="flex bg-card/60 border border-border/50 rounded-xl overflow-hidden p-0.5 items-center">
                  <button
                    onClick={handleExportPNG}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                    title={t("reports.visualizer.exportPng")}
                    type="button"
                  >
                    <Image className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                    title={t("reports.visualizer.exportPdf")}
                    type="button"
                  >
                    <FileText className="w-3.5 h-3.5 text-destructive" />
                  </button>
                  <button
                    onClick={() => setShowPdfSettings(!showPdfSettings)}
                    className={`p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer ${showPdfSettings ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                    title={t("reports.visualizer.pdfSettings")}
                    type="button"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts wrapper */}
          <div ref={chartRef} className="relative overflow-hidden rounded-3xl border border-border/30 bg-card/5 p-4 shadow-inner backdrop-blur-md">
            {renderChart()}
          </div>

          {/* Interactive KPI overview boxes */}
          {processedData.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.totalAggregated")}</span>
                <span className="text-sm font-black text-foreground mt-1 leading-none">
                  {totalValue.toLocaleString()}
                </span>
              </div>
              <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.avgPerGroup")}</span>
                <span className="text-sm font-black text-foreground mt-1 leading-none">
                  {avgGroupValue.toLocaleString()}
                </span>
              </div>
              <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.topGroup")}</span>
                <span className="text-sm font-black text-foreground mt-1 leading-none truncate block max-w-full">
                  {topGroup}
                </span>
              </div>
            </div>
          )}

          {/* Toggle Table Panel */}
          <div className="border-t border-border/40 pt-4 flex flex-col gap-3">
            <button
              onClick={() => setShowDataTable(!showDataTable)}
              className="flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer select-none"
              type="button"
            >
              <span className="flex items-center gap-1.5">
                <Table className="w-4 h-4 text-primary" />
                {t("reports.visualizer.dataMatrix")}
              </span>
              {showDataTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showDataTable && processedData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border border-border/60 bg-card/25 rounded-2xl overflow-hidden mt-1 max-h-[220px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 border-b border-border/50 text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">{t("reports.visualizer.xAxisCategory")}</th>
                          <th className="px-4 py-2.5">{t("reports.visualizer.aggregatedValue", { op: operation.toUpperCase() })}</th>
                          <th className="px-4 py-2.5">{t("reports.visualizer.recordCount")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        {processedData.map((processedRow, index) => (
                          <tr key={index} className="hover:bg-muted/20">
                            <td className="px-4 py-2.5 text-foreground font-semibold">{processedRow.name}</td>
                            <td className="px-4 py-2.5 text-primary font-bold">{processedRow.value.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{processedRow.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

    </div>
  );
}
