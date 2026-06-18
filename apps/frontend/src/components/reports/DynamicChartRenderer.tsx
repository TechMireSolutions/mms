import React, { useState, useMemo, useEffect, useRef } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { Info } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  Legend, Tooltip, XAxis, YAxis, CartesianGrid
} from "recharts";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { METADATA_FIELDS, type ReportCollection } from "./reportMetadata";

import { getStaticChartPaletteMap } from "@mms/shared";

export interface VisualizerConfig {
  id: string;
  title: string;
  collection: ReportCollection;
  chartType: "bar" | "line" | "area" | "pie" | "radar";
  xAxisField: string;
  operation: "count" | "sum" | "avg" | "min" | "max";
  targetField?: string;
  activePalette?: string;
}

interface DynamicChartRendererProps {
  config: VisualizerConfig;
  height?: number;
}

/**
 * DynamicChartRenderer Component.
 * Dynamically processes, aggregates, sorts, and visualizes live DB collections.
 * Used to replace hardcoded charts with fully custom, user-editable graphics.
 */
export default function DynamicChartRenderer({ config, height = 200 }: DynamicChartRendererProps): React.JSX.Element {
  const brandPalette = useBrandPalette();
  const THEME_PALETTES: Record<string, string[]> = useMemo(
    () => ({
      brand: [...brandPalette.charts],
      ...getStaticChartPaletteMap(),
    }),
    [brandPalette],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const axisFontSize = useMemo(() => {
    return Math.max(8, Math.min(12, Math.round(containerWidth / 60)));
  }, [containerWidth]);

  const legendFontSize = useMemo(() => {
    return Math.max(9, Math.min(12, Math.round(containerWidth / 55)));
  }, [containerWidth]);

  const tickGap = useMemo(() => {
    return Math.max(10, Math.min(30, Math.round(containerWidth / 25)));
  }, [containerWidth]);

  const activeMeta = METADATA_FIELDS[config.collection];
  const currentColors = THEME_PALETTES[config.activePalette || "brand"] || THEME_PALETTES.brand;

  const dbKey = activeMeta?.dbKey || "";
  const defaultData = (activeMeta?.defaultData as Record<string, unknown>[]) || [];
  const dataList = useLiveCollection<Record<string, unknown>>(dbKey, defaultData);

  const processedData = useMemo(() => {
    if (!activeMeta || !dataList) return [];
    
    // 1. Group records by xAxisField dimension
    const groups: Record<string, Record<string, unknown>[]> = {};
    dataList.forEach((item) => {
      const xVal = item[config.xAxisField];
      const key = xVal === undefined || xVal === null || xVal === "" ? "Unknown" : String(xVal);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    // 2. Compute Aggregations
    const result = Object.entries(groups).map(([name, groupItems]) => {
      let finalValue = 0;
      const count = groupItems.length;

      if (config.operation === "count") {
        finalValue = count;
      } else {
        const field = config.targetField || "";
        const values: number[] = [];

        groupItems.forEach((item) => {
          if (config.collection === "hasanat_distributions" && field === "points") {
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
          switch (config.operation) {
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

    // 3. Clutter Control: Smart sorting & grouping
    const isDateField = /date|time|created|updated|issued|registered/i.test(config.xAxisField);
    if (isDateField) {
      const sorted = result.sort((a, b) => {
        const timeA = new Date(a.name).getTime();
        const timeB = new Date(b.name).getTime();
        if (isNaN(timeA) || isNaN(timeB)) {
          return a.name.localeCompare(b.name);
        }
        return timeA - timeB;
      });
      if (sorted.length > 15) {
        return sorted.slice(-15); // Show most recent 15
      }
      return sorted;
    } else {
      const sortedResult = result.sort((a, b) => b.value - a.value);
      if (sortedResult.length > 8) {
        const top7 = sortedResult.slice(0, 7);
        const remaining = sortedResult.slice(7);
        const othersValue = remaining.reduce((sum, item) => sum + item.value, 0);
        const othersCount = remaining.reduce((sum, item) => sum + item.count, 0);
        
        let finalOthersValue = othersValue;
        if (config.operation === "avg") {
          const totalCount = remaining.reduce((sum, item) => sum + item.count, 0);
          if (totalCount > 0) {
            const weightedSum = remaining.reduce((sum, item) => sum + (item.value * item.count), 0);
            finalOthersValue = Math.round(weightedSum / totalCount);
          }
        } else if (config.operation === "min") {
          finalOthersValue = Math.min(...remaining.map(item => item.value));
        } else if (config.operation === "max") {
          finalOthersValue = Math.max(...remaining.map(item => item.value));
        }

        return [
          ...top7,
          {
            name: `Others (${remaining.length})`,
            value: finalOthersValue,
            count: othersCount
          }
        ];
      }
      return sortedResult;
    }
  }, [config, activeMeta, dataList]);

  if (processedData.length === 0) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border/40 rounded-2xl bg-card/10">
        <Info className="w-5 h-5 mb-1 opacity-40 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-wider">No Data Found</span>
      </div>
    );
  }

  const firstColor = currentColors[0] || brandPalette.primary;

  const renderChartContent = () => {
    switch (config.chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
            <BarChart data={processedData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveEnd" minTickGap={tickGap} />
              <YAxis tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: `${axisFontSize}px` }} />
              <Bar dataKey="value" name={config.operation.toUpperCase()} radius={[4, 4, 0, 0]} maxBarSize={24}>
                {processedData.map((_, index) => (
                  <Cell key={index} fill={currentColors[index % currentColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
            <LineChart data={processedData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveEnd" minTickGap={tickGap} />
              <YAxis tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: `${axisFontSize}px` }} />
              <Line type="monotone" dataKey="value" name={config.operation.toUpperCase()} stroke={firstColor} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
            <AreaChart data={processedData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id={`rendererGrad-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={firstColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={firstColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveEnd" minTickGap={tickGap} />
              <YAxis tick={{ fontSize: axisFontSize, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: `${axisFontSize}px` }} />
              <Area type="monotone" dataKey="value" name={config.operation.toUpperCase()} stroke={firstColor} fill={`url(#rendererGrad-${config.id})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
            <PieChart>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: `${axisFontSize}px` }} />
              {containerWidth >= 285 && (
                <Legend 
                  wrapperStyle={{ fontSize: `${legendFontSize}px` }} 
                  layout={containerWidth < 360 ? "horizontal" : "vertical"} 
                  align={containerWidth < 360 ? "center" : "right"} 
                  verticalAlign={containerWidth < 360 ? "bottom" : "middle"} 
                />
              )}
              <Pie
                data={processedData}
                dataKey="value"
                nameKey="name"
                cx={containerWidth < 360 ? "50%" : "40%"}
                cy="50%"
                innerRadius={Math.min(25, Math.round(containerWidth / 12))}
                outerRadius={Math.min(55, Math.round(containerWidth / 7))}
                paddingAngle={2}
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
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={processedData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: Math.max(7, axisFontSize - 2) }} />
              <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fontSize: Math.max(6, axisFontSize - 3) }} />
              <Radar name={config.operation.toUpperCase()} dataKey="value" stroke={firstColor} fill={firstColor} fillOpacity={0.2} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: `${axisFontSize}px` }} />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col justify-between" style={{ minHeight: height }}>
      <div className="flex-1 w-full" style={{ height: height - 10 }}>
        {renderChartContent()}
      </div>
    </div>
  );
}
