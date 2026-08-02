import type { RefObject } from 'react';
import type { AggregatedItem, ChartOperation } from './dynamicChartVisualizerTypes';
import {
  exportVisualizerExcel,
  exportVisualizerPdf,
  exportVisualizerPng,
} from './dynamicChartVisualizerExports';

export async function runVisualizerPngExport(
  chartRef: RefObject<HTMLDivElement | null>,
  title: string,
): Promise<boolean> {
  if (!chartRef.current) return false;
  try {
    await exportVisualizerPng({ chartElement: chartRef.current, title });
    return true;
  } catch {
    return false;
  }
}

export async function runVisualizerExcelExport(
  title: string,
  processedData: AggregatedItem[],
): Promise<boolean> {
  try {
    await exportVisualizerExcel({ title, processedData });
    return true;
  } catch {
    return false;
  }
}

export async function runVisualizerPdfExport(input: {
  chartRef: RefObject<HTMLDivElement | null>;
  title: string;
  processedData: AggregatedItem[];
  operation: ChartOperation;
  xAxisField: string;
  collectionLabel: string;
  pdfFormat: string;
  pdfOrientation: 'p' | 'l';
}): Promise<boolean> {
  if (!input.chartRef.current) return false;
  try {
    await exportVisualizerPdf({
      chartElement: input.chartRef.current,
      title: input.title,
      processedData: input.processedData,
      operation: input.operation,
      xAxisField: input.xAxisField,
      collectionLabel: input.collectionLabel,
      pdfFormat: input.pdfFormat,
      pdfOrientation: input.pdfOrientation,
    });
    return true;
  } catch {
    return false;
  }
}
