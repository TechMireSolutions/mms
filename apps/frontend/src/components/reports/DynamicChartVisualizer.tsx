import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, 
  Plus, Trash2, Image, FileText, Pin, 
  PinOff, Filter, CheckCircle2, ChevronDown, ChevronUp, 
  Table, Sparkles, Printer, FileSpreadsheet, Settings
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  Legend, Tooltip, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  CHART_PALETTE_DEFS,
  DEFAULT_CHART_PALETTE_ID,
  getChartPaletteColors,
  isColorblindSafeChartPalette,
} from "@mms/shared";
import useTranslation from "@/hooks/useTranslation";
import { getCollection } from "../../lib/db";
import { METADATA_FIELDS, VisualizerConfig, type ReportCollection } from "./reportMetadata";

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
  const [title, setTitle] = useState(initialConfig?.title || "Live Metrics Distribution");
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

  // Dynamic Multi-Filtering rules state
  const [filters, setFilters] = useState<FilterRule[]>([]);

  // Pinned widgets checking state
  const [dashboardWidgets, setDashboardWidgets] = useState<CustomWidget[]>(() => {
    try {
      const saved = localStorage.getItem("kpi_custom_widgets");
      return saved ? JSON.parse(saved) as CustomWidget[] : [];
    } catch {
      return [];
    }
  });

  // Responsive scaling container observer
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
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
    const dataList = getCollection(activeMeta.dbKey, activeMeta.defaultData as unknown[]) as Record<string, unknown>[];
    
    // 1. Apply multiple filters
    const filteredList = dataList.filter((item) => {
      if (!item) return false;
      return filters.every((rule) => {
        if (!rule.field || !rule.value) return true;
        const val = item[rule.field];
        if (val === undefined || val === null) return false;
        
        const strVal = String(val).toLowerCase();
        const ruleVal = String(rule.value).toLowerCase();

        switch (rule.operator) {
          case "equals":
            return strVal === ruleVal;
          case "contains":
            return strVal.includes(ruleVal);
          case "startsWith":
            return strVal.startsWith(ruleVal);
          case "gt":
            return Number(val) > Number(rule.value);
          case "lt":
            return Number(val) < Number(rule.value);
          default:
            return true;
        }
      });
    });

    // 2. Group records by xAxisField dimension
    const groups: Record<string, Record<string, unknown>[]> = {};
    filteredList.forEach((item) => {
      const xVal = item[xAxisField];
      const key = xVal === undefined || xVal === null || xVal === "" ? "Unknown / Null" : String(xVal);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    // 3. Compute Aggregations
    const result = Object.entries(groups).map(([name, groupItems]) => {
      let finalValue = 0;
      const count = groupItems.length;

      if (operation === "count") {
        finalValue = count;
      } else {
        const field = targetField || "";
        const values: number[] = [];

        groupItems.forEach((item) => {
          // Special Hasanat points calculation
          if (collectionKey === "hasanat_distributions" && field === "points") {
            let pts = 50;
            const denom = String(item.denominationName || "").toLowerCase();
            if (denom.includes("silver")) pts = 150;
            else if (denom.includes("gold")) pts = 500;
            else if (denom.includes("platinum")) pts = 1000;
            else if (denom.includes("diamond")) pts = 2500;
            values.push(Number(item.quantity || 1) * pts);
          } else {
            const num = Number(item[field]);
            if (!isNaN(num)) {
              values.push(num);
            }
          }
        });

        if (values.length > 0) {
          switch (operation) {
            case "sum":
              finalValue = values.reduce((sum, v) => sum + v, 0);
              break;
            case "avg":
              finalValue = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
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
      const sorted = result.sort((a, b) => {
        const timeA = new Date(a.name).getTime();
        const timeB = new Date(b.name).getTime();
        if (isNaN(timeA) || isNaN(timeB)) {
          return a.name.localeCompare(b.name);
        }
        return timeA - timeB;
      });
      // Cap timeline at most recent 20 dates to stay readable
      if (sorted.length > 20) {
        return sorted.slice(-20);
      }
      return sorted;
    } else {
      // Sort categories descending by value
      const sortedResult = result.sort((a, b) => b.value - a.value);
      if (sortedResult.length > 10) {
        const top9 = sortedResult.slice(0, 9);
        const remaining = sortedResult.slice(9);
        
        const othersValue = remaining.reduce((sum, item) => sum + item.value, 0);
        const othersCount = remaining.reduce((sum, item) => sum + item.count, 0);
        
        let finalOthersValue = othersValue;
        if (operation === "avg") {
          const totalCount = remaining.reduce((sum, item) => sum + item.count, 0);
          if (totalCount > 0) {
            const weightedSum = remaining.reduce((sum, item) => sum + (item.value * item.count), 0);
            finalOthersValue = Math.round(weightedSum / totalCount);
          }
        } else if (operation === "min") {
          finalOthersValue = Math.min(...remaining.map(item => item.value));
        } else if (operation === "max") {
          finalOthersValue = Math.max(...remaining.map(item => item.value));
        }

        return [
          ...top9,
          {
            name: `Others (${remaining.length} fields)`,
            value: finalOthersValue,
            count: othersCount
          }
        ];
      }
      return sortedResult;
    }
  }, [collectionKey, xAxisField, operation, targetField, filters, activeMeta]);

  // Checks if this chart configuration is pinned to dashboard
  const isPinned = useMemo(() => {
    return dashboardWidgets.some(
      (w) =>
        w.collection === collectionKey &&
        w.xAxisField === xAxisField &&
        w.operation === (operation === "min" || operation === "max" ? "count" : operation) && // map compatibility
        w.chartType === chartType &&
        w.isPinnedToDashboard
    );
  }, [dashboardWidgets, collectionKey, xAxisField, operation, chartType]);

  // Toggles pin state in localStorage
  const handleTogglePin = () => {
    const nextWidgets = [...dashboardWidgets];
    const matchingIdx = nextWidgets.findIndex(
      (w) =>
        w.collection === collectionKey &&
        w.xAxisField === xAxisField &&
        w.operation === (operation === "min" || operation === "max" ? "count" : operation)
    );

    if (matchingIdx > -1) {
      nextWidgets[matchingIdx].isPinnedToDashboard = !nextWidgets[matchingIdx].isPinnedToDashboard;
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
    localStorage.setItem("kpi_custom_widgets", JSON.stringify(nextWidgets));
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
    const updated = filters.map((rule) => {
      if (rule.id === id) {
        return { ...rule, ...updates };
      }
      return rule;
    });
    setFilters(updated);
  };

  // Delete a filter rule
  const handleDeleteFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
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
    } catch (e) {
      console.error("Failed to export chart image", e);
    }
  };

  // Export summary database values to Excel file
  const handleExportExcel = async () => {
    if (processedData.length === 0) return;
    try {
      const XLSX = await import("xlsx");
      const sheetData = processedData.map(d => ({
        "Grouping Key": d.name,
        "Aggregated Value": d.value,
        "Count": d.count
      }));
      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Analytics");
      XLSX.writeFile(workbook, `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error("Failed to export Excel spreadsheet", e);
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
        const tmp = formatWidth;
        formatWidth = formatHeight;
        formatHeight = tmp;
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
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 26);
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
        body: processedData.map(row => [row.name, row.value.toLocaleString(), row.count]),
        startY: chartHeight + 48,
        styles: { fontSize: pdfOrientation === "l" ? 9 : 10 },
        headStyles: { fillColor: [16, 185, 129] }, // emerald theme color
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}-report.pdf`);
    } catch (e) {
      console.error("Failed to export PDF report", e);
    }
  };

  const currentColors = [...getChartPaletteColors(activePalette)];

  // Recharts custom tooltips and widgets
  const renderChart = () => {
    if (processedData.length === 0) {
      return (
        <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded-3xl bg-card/20">
          <Info className="w-6 h-6 mb-2 opacity-40 animate-bounce" />
          <p className="text-xs font-bold text-foreground">No Grouped Data Matches the Criteria</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Modify filter rules or change X-axis grouping dimensions</p>
        </div>
      );
    }

    const firstColor = currentColors[0] || "#3b82f6";

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />}
              <XAxis dataKey="name" tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveEnd" minTickGap={tickGap} />
              <YAxis tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              {showTooltip && <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: `${axisFontSize}px` }} />}
              {showLegend && <Legend wrapperStyle={{ fontSize: `${legendFontSize}px`, paddingTop: "12px" }} />}
              <Bar dataKey="value" name={operation.toUpperCase() + " Value"} radius={[4, 4, 0, 0]} maxBarSize={30}>
                {processedData.map((_, index) => (
                  <Cell key={index} fill={currentColors[index % currentColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />}
              <XAxis dataKey="name" tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveEnd" minTickGap={tickGap} />
              <YAxis tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              {showTooltip && <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: `${axisFontSize}px` }} />}
              {showLegend && <Legend wrapperStyle={{ fontSize: `${legendFontSize}px`, paddingTop: "12px" }} />}
              <Line type="monotone" dataKey="value" name={operation.toUpperCase() + " Value"} stroke={firstColor} strokeWidth={3} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={260}>
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
              <Area type="monotone" dataKey="value" name={operation.toUpperCase() + " Value"} stroke={firstColor} fill="url(#visGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={260}>
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
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={processedData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: Math.max(8, axisFontSize - 1) }} />
              <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fontSize: Math.max(7, axisFontSize - 2) }} />
              <Radar name={operation.toUpperCase() + " Value"} dataKey="value" stroke={firstColor} fill={firstColor} fillOpacity={0.25} />
              {showTooltip && <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: `${axisFontSize}px` }} />}
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const totalValue = processedData.reduce((s, item) => s + item.value, 0);
  const avgGroupValue = processedData.length ? Math.round(totalValue / processedData.length) : 0;
  const topGroup = processedData[0]?.name || "N/A";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left font-sans">
      
      {/* 1. Left Configurator Panel (5 cols) */}
      <div className="lg:col-span-5 space-y-5 print:hidden">
        <div className="rounded-[2rem] border border-border/50 bg-card/45 backdrop-blur-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">Chart Configurator</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">Configure dynamic visual metrics</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Widget Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Widget Chart Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter visualizer title..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
              />
            </div>

            {/* Collection source selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Data Collection</label>
                <select
                  value={collectionKey}
                  onChange={(e) => setCollectionKey(e.target.value as keyof typeof METADATA_CONFIGS)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                >
                  {Object.entries(METADATA_CONFIGS).map(([key, item]) => (
                    <option key={key} value={key}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">X-Axis Dimension</label>
                <select
                  value={xAxisField}
                  onChange={(e) => setXAxisField(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                >
                  {activeMeta.fields.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Formula operation & target */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Operation / Aggregate</label>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as "count" | "sum" | "avg" | "min" | "max")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                >
                  <option value="count">Count (Records)</option>
                  {activeMeta.numericFields.length > 0 && (
                    <>
                      <option value="sum">Sum (Total Value)</option>
                      <option value="avg">Average (Mean)</option>
                      <option value="min">Minimum Value</option>
                      <option value="max">Maximum Value</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Value Field</label>
                <select
                  disabled={operation === "count"}
                  value={targetField}
                  onChange={(e) => setTargetField(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold disabled:opacity-40"
                >
                  {activeMeta.numericFields.length === 0 ? (
                    <option value="">No Numeric Value Fields</option>
                  ) : (
                    activeMeta.numericFields.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Visualizer Type & Color Palette Theme */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Chart Type</label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as "bar" | "line" | "area" | "pie" | "radar")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie/Donut Chart</option>
                  <option value="radar">Radar Chart</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Color Palette</label>
                  {(isColorblindSafeChartPalette(activePalette)) && (
                    <span className="text-[8px] bg-success/15 text-success px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest leading-none">{t('charts.accessibleBadge')}</span>
                  )}
                </div>
                <select
                  value={activePalette}
                  onChange={(e) => setActivePalette(e.target.value)}
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
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Display Customizations</span>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card/25 hover:bg-card/45 transition-colors cursor-pointer select-none text-[11px] font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded text-primary focus:ring-primary/10 cursor-pointer"
                  />
                  Grid Lines
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card/25 hover:bg-card/45 transition-colors cursor-pointer select-none text-[11px] font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={showLegend}
                    onChange={(e) => setShowLegend(e.target.checked)}
                    className="rounded text-primary focus:ring-primary/10 cursor-pointer"
                  />
                  Legends
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card/25 hover:bg-card/45 transition-colors cursor-pointer select-none text-[11px] font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={showTooltip}
                    onChange={(e) => setShowTooltip(e.target.checked)}
                    className="rounded text-primary focus:ring-primary/10 cursor-pointer"
                  />
                  Tooltips
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Filters builder inside panel */}
        <div className="rounded-[2rem] border border-border/50 bg-card/45 backdrop-blur-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">Query Filters</h4>
                <p className="text-[9px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">Query conditions logic</p>
              </div>
            </div>
            <button
              onClick={handleAddFilter}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all cursor-pointer"
              type="button"
            >
              <Plus className="w-3 h-3" />
              Add rule
            </button>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {filters.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center bg-card/10 rounded-2xl border border-dashed border-border/40">No filters applied. Analyzing full collection.</p>
            ) : (
              filters.map((rule) => (
                <div key={rule.id} className="flex gap-2 items-center bg-card/30 border border-border p-2.5 rounded-2xl">
                  {/* Field Selector */}
                  <select
                    value={rule.field}
                    onChange={(e) => handleUpdateFilter(rule.id, { field: e.target.value })}
                    className="flex-1 min-w-0 px-2 py-1 text-[11px] rounded-lg border border-border bg-card/60 text-foreground focus:outline-none"
                  >
                    {activeMeta.fields.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>

                  {/* Operator */}
                  <select
                    value={rule.operator}
                    onChange={(e) => handleUpdateFilter(rule.id, { operator: e.target.value as FilterRule["operator"] })}
                    className="w-20 px-1 py-1 text-[11px] rounded-lg border border-border bg-card/60 text-foreground focus:outline-none font-medium"
                  >
                    <option value="equals">=</option>
                    <option value="contains">like</option>
                    <option value="startsWith">starts</option>
                    {activeMeta.fields.find(f => f.value === rule.field)?.isNumeric && (
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
                    onChange={(e) => handleUpdateFilter(rule.id, { value: e.target.value })}
                    placeholder="Value..."
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
        <div className="rounded-[2.5rem] border border-border/50 bg-card/45 backdrop-blur-2xl p-6 shadow-xl space-y-6">
          
          {/* Header metadata row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground tracking-tight leading-none">{title}</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                Source: {activeMeta.name} · Aggregated by {xAxisField}
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
                  Save Visual
                </button>
              )}

              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-border bg-card/50 text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  type="button"
                >
                  Cancel
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
                {isPinned ? "Pinned to Home" : "Pin to Dashboard"}
              </button>

              {/* Exports button group */}
              <div className="flex items-center gap-1.5 relative">
                {showPdfSettings && (
                  <div className="absolute right-0 bottom-full mb-2 bg-card border border-border rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-3.5 min-w-[200px] backdrop-blur-xl">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PDF Orientation</label>
                      <div className="flex gap-1 p-1 bg-muted rounded-xl">
                        <button 
                          onClick={() => setPdfOrientation("p")}
                          className={`flex-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${pdfOrientation === "p" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                          type="button"
                        >
                          Portrait
                        </button>
                        <button 
                          onClick={() => setPdfOrientation("l")}
                          className={`flex-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${pdfOrientation === "l" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                          type="button"
                        >
                          Landscape
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PDF Page Size</label>
                      <select 
                        value={pdfFormat}
                        onChange={(e) => setPdfFormat(e.target.value)}
                        className="w-full text-xs rounded-xl border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                      >
                        <option value="a4">A4 (Standard)</option>
                        <option value="letter">Letter</option>
                        <option value="a3">A3 (Wide)</option>
                        <option value="legal">Legal</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => window.print()}
                  className="p-1.5 bg-card/60 hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
                  title="Print Report"
                  type="button"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleExportExcel}
                  className="p-1.5 bg-card/60 hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
                  title="Export Excel spreadsheet"
                  type="button"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-success" />
                </button>

                <div className="flex bg-card/60 border border-border/50 rounded-xl overflow-hidden p-0.5 items-center">
                  <button
                    onClick={handleExportPNG}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                    title="Export Chart as PNG"
                    type="button"
                  >
                    <Image className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                    title="Export PDF Report"
                    type="button"
                  >
                    <FileText className="w-3.5 h-3.5 text-destructive" />
                  </button>
                  <button
                    onClick={() => setShowPdfSettings(!showPdfSettings)}
                    className={`p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer ${showPdfSettings ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                    title="PDF Export Settings"
                    type="button"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts wrapper */}
          <div ref={chartRef} className="p-4 bg-white/5 border border-border/30 rounded-3xl backdrop-blur-md shadow-inner relative overflow-hidden">
            {renderChart()}
          </div>

          {/* Interactive KPI overview boxes */}
          {processedData.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Total Aggregated</span>
                <span className="text-sm font-black text-foreground mt-1 leading-none">
                  {totalValue.toLocaleString()}
                </span>
              </div>
              <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Average per Group</span>
                <span className="text-sm font-black text-foreground mt-1 leading-none">
                  {avgGroupValue.toLocaleString()}
                </span>
              </div>
              <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Top Performing Group</span>
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
                Aggregated Data Matrix
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
                          <th className="px-4 py-2.5">X-Axis Category</th>
                          <th className="px-4 py-2.5">Aggregated Value ({operation.toUpperCase()})</th>
                          <th className="px-4 py-2.5">Record Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        {processedData.map((d, index) => (
                          <tr key={index} className="hover:bg-muted/20">
                            <td className="px-4 py-2.5 text-foreground font-semibold">{d.name}</td>
                            <td className="px-4 py-2.5 text-primary font-bold">{d.value.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{d.count}</td>
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
