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
): Promise<void> {
  if (!chartRef.current) return;
  try {
    await exportVisualizerPng({ chartElement: chartRef.current, title });
  } catch (error) {
    console.error('Failed to export chart image', error);
  }
}

export async function runVisualizerExcelExport(
  title: string,
  processedData: AggregatedItem[],
): Promise<void> {
  try {
    await exportVisualizerExcel({ title, processedData });
  } catch (error) {
    console.error('Failed to export Excel spreadsheet', error);
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
}): Promise<void> {
  if (!input.chartRef.current) return;
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
  } catch (error) {
    console.error('Failed to export PDF report', error);
  }
}
