import type { AppTranslationKey } from "@mms/shared";
import { getObject } from "@/lib/db";
import type { ReportCollection } from "./reportCollectionTypes.js";

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

export const DEFAULT_VISUALS: Record<string, VisualizerConfig> = {
  "visual-attendance-class": {
    id: "visual-attendance-class",
    title: "Attendance Registry Counts by Class",
    collection: "attendance_records",
    chartType: "bar",
    xAxisField: "className",
    operation: "count",
    activePalette: "accessibleColorblind"
  },
  "visual-financial-collection": {
    id: "visual-financial-collection",
    title: "Financial Invoices Cumulative Final Amounts by Due Date",
    collection: "finance_invoices",
    chartType: "area",
    xAxisField: "dueDate",
    operation: "sum",
    targetField: "finalAmt",
    activePalette: "accessibleColorblind"
  },
  "visual-financial-discounts": {
    id: "visual-financial-discounts",
    title: "Discount Offsets by Categories",
    collection: "finance_invoices",
    chartType: "pie",
    xAxisField: "discountType",
    operation: "sum",
    targetField: "discountAmt",
    activePalette: "accessibleColorblind"
  },
  "visual-contacts-gender": {
    id: "visual-contacts-gender",
    title: "Contacts Volume by Gender",
    collection: "contacts",
    chartType: "pie",
    xAxisField: "gender",
    operation: "count",
    activePalette: "accessibleColorblind"
  },
  "visual-students-age": {
    id: "visual-students-age",
    title: "Average Student Age by City",
    collection: "students",
    chartType: "bar",
    xAxisField: "city",
    operation: "avg",
    targetField: "age",
    activePalette: "accessibleColorblind"
  },
  "visual-sessions-enrolled": {
    id: "visual-sessions-enrolled",
    title: "Enrolled Students Count by Course Type",
    collection: "sessions",
    chartType: "bar",
    xAxisField: "type",
    operation: "sum",
    targetField: "enrolled",
    activePalette: "accessibleColorblind"
  },
  "visual-hasanat-distribution": {
    id: "visual-hasanat-distribution",
    title: "Hasanat Rewards Points by Grantor",
    collection: "hasanat_distributions",
    chartType: "pie",
    xAxisField: "issuedBy",
    operation: "sum",
    targetField: "points",
    activePalette: "accessibleColorblind"
  },
  "visual-academic-grades": {
    id: "visual-academic-grades",
    title: "Assessments Average Marks by Class",
    collection: "sessions",
    chartType: "bar",
    xAxisField: "type",
    operation: "avg",
    targetField: "baseFee",
    activePalette: "accessibleColorblind"
  },
  "visual-faculty-load": {
    id: "visual-faculty-load",
    title: "Enrolled Limits by Instructor",
    collection: "sessions",
    chartType: "bar",
    xAxisField: "teacherName",
    operation: "sum",
    targetField: "enrolled",
    activePalette: "accessibleColorblind"
  }
};

/**
 * Retrieves the custom visualizer configuration for a report chart, falling back to seed default configuration.
 *
 * @param id The visualizer identifier key.
 * @returns Custom or default VisualizerConfig.
 */
export function getReportVisual(id: string): VisualizerConfig {
  try {
    const saved = getObject<Record<string, VisualizerConfig>>("report_custom_visuals", {});
    if (saved && saved[id]) {
      return saved[id];
    }
  } catch (error) {
    console.error("Failed to load custom report visual configuration", error);
  }
  return DEFAULT_VISUALS[id] || {
    id,
    title: "Metrics Distribution",
    collection: "students",
    chartType: "bar",
    xAxisField: "status",
    operation: "count",
    activePalette: "accessibleColorblind"
  };
}

/**
 * Safely translates a field value to its user-friendly label, falling back to a default label.
 *
 * @param fieldValue The field identifier string.
 * @param defaultLabel The default label if translation is missing.
 * @param t The active translation function.
 */
export function getFieldLabel(
  fieldValue: string,
  defaultLabel: string,
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string
): string {
  const transKey = `reports.fields.${fieldValue}`;
  const translated = t(transKey as AppTranslationKey);
  return translated === transKey ? defaultLabel : translated;
}

/**
 * Safely translates a collection key to its user-friendly name, falling back to a default label.
 *
 * @param collectionValue The collection identifier string.
 * @param defaultLabel The default name if translation is missing.
 * @param t The active translation function.
 */
export function getCollectionLabel(
  collectionValue: string,
  defaultLabel: string,
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string
): string {
  const transKey = `reports.collections.${collectionValue}`;
  const translated = t(transKey as AppTranslationKey);
  return translated === transKey ? defaultLabel : translated;
}
