import { type Contact, formatMoney, formatNumber, type AppTranslationKey, matchesWidgetFilter } from "@mms/shared";

import { getObject } from "@/lib/db";
import { type Student } from '@/lib/data/studentsData';
import { type Teacher } from '@/lib/data/teachersData';
import { type Session } from '@/lib/data/sessionsData';
import { type Invoice } from '@/lib/data/financeData';
import { type AttendanceRecord } from '@/lib/data/attendanceData';
import { type Distribution, type Denomination } from '@/lib/data/hasanatData';
import type { QuestionBankQuestion, QuestionBankTest, QuestionBankResult } from '@mms/shared';
import { type TranslationFunction } from "@/lib/contexts/TranslationContext";

export type ReportCollection =
  | "students"
  | "teachers"
  | "sessions"
  | "finance_invoices"
  | "attendance_records"
  | "hasanat_distributions"
  | "contacts"
  | "questions"
  | "tests"
  | "assessment_results";

export interface CustomCard {
  id: string;
  role?: string;
  title: string;
  collection: ReportCollection;
  operation: "count" | "sum" | "avg" | "percentage";
  targetField?: string;
  filterField?: string;
  filterOperator?: "equals" | "contains" | "gt" | "lt";
  filterValue?: string;
  icon: string;
  color: string;
  subTextType: "fixed" | "dynamic";
  fixedSubText?: string;
  trend?: number;
  trendType?: "manual" | "database";
}

export const COLLECTION_OPTIONS = [
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
  { value: "sessions", label: "Sessions" },
  { value: "finance_invoices", label: "Invoices (Finance)" },
  { value: "attendance_records", label: "Attendance Records" },
  { value: "hasanat_distributions", label: "Hasanat Distributions" },
  { value: "contacts", label: "Contacts" },
  { value: "questions", label: "Question Bank Questions" },
  { value: "tests", label: "Generated Tests" },
  { value: "assessment_results", label: "Assessment Results" }
] as const;

export const METADATA_FIELDS = {
  students: {
    name: "Students",
    dbKey: "students",
    defaultData: [] as Student[],
    fields: [
      { value: "status", label: "Status (active/inactive)" },
      { value: "gender", label: "Gender (male/female)" },
      { value: "city", label: "City" },
      { value: "discountType", label: "Discount Type" },
      { value: "discountPct", label: "Discount Percentage", isNumeric: true },
      { value: "age", label: "Age", isNumeric: true },
      { value: "registeredDate", label: "Registration Date" }
    ],
    numericFields: [
      { value: "discountPct", label: "Discount Percentage" },
      { value: "age", label: "Age" }
    ]
  },
  teachers: {
    name: "Teachers",
    dbKey: "teachers",
    defaultData: [] as Teacher[],
    fields: [
      { value: "status", label: "Status (active/inactive/on_leave)" },
      { value: "gender", label: "Gender (male/female)" },
      { value: "specialization", label: "Specialization" },
      { value: "qualification", label: "Qualification" },
      { value: "joinDate", label: "Join Date" },
    ],
    numericFields: [],
  },
  sessions: {
    name: "Sessions & Classes",
    dbKey: "sessions",
    defaultData: [] as Session[],
    fields: [
      { value: "status", label: "Status (active/cancelled)" },
      { value: "gender", label: "Gender Orientation (male/female/any)" },
      { value: "type", label: "Course Type (Hifz/Tajweed/Qaidah...)" },
      { value: "room", label: "Classroom / Location" },
      { value: "teacherName", label: "Instructor" },
      { value: "baseFee", label: "Base Fee", isNumeric: true },
      { value: "enrolled", label: "Enrolled Count", isNumeric: true },
      { value: "capacity", label: "Capacity Limit", isNumeric: true },
      { value: "startDate", label: "Start Date" },
      { value: "endDate", label: "End Date" }
    ],
    numericFields: [
      { value: "baseFee", label: "Base Fee" },
      { value: "enrolled", label: "Enrolled Count" },
      { value: "capacity", label: "Capacity Limit" }
    ]
  },
  finance_invoices: {
    name: "Financial Invoices",
    dbKey: "finance_invoices",
    defaultData: [] as Invoice[],
    fields: [
      { value: "status", label: "Status (paid/unpaid/partial/cancelled)" },
      { value: "paymentMethod", label: "Payment Channel" },
      { value: "finalAmt", label: "Final Amount", isNumeric: true },
      { value: "paidAmt", label: "Paid Amount", isNumeric: true },
      { value: "discountAmt", label: "Discount Offset", isNumeric: true },
      { value: "baseAmt", label: "Base Fee Amount", isNumeric: true },
      { value: "dueDate", label: "Due Date" },
      { value: "paidDate", label: "Paid Date" }
    ],
    numericFields: [
      { value: "finalAmt", label: "Final Amount" },
      { value: "paidAmt", label: "Paid Amount" },
      { value: "discountAmt", label: "Discount Offset" },
      { value: "baseAmt", label: "Base Fee Amount" }
    ]
  },
  attendance_records: {
    name: "Attendance Registry",
    dbKey: "attendance_records",
    defaultData: [] as AttendanceRecord[],
    fields: [
      { value: "status", label: "Status (present/absent/late/excused)" },
      { value: "className", label: "Class Name" },
      { value: "sessionName", label: "Session Title" },
      { value: "date", label: "Attendance Date" }
    ],
    numericFields: []
  },
  hasanat_distributions: {
    name: "Hasanat Rewards",
    dbKey: "hasanat_distributions",
    defaultData: [] as Distribution[],
    fields: [
      { value: "denominationName", label: "Reward Category (Bronze/Silver/Gold/Platinum/Diamond)" },
      { value: "quantity", label: "Quantity Distributed", isNumeric: true },
      { value: "issuedBy", label: "Faculty Grantor" },
      { value: "reason", label: "Reason For Award" },
      { value: "points", label: "Computed Points", isNumeric: true },
      { value: "issuedDate", label: "Award Date" }
    ],
    numericFields: [
      { value: "quantity", label: "Quantity Distributed" },
      { value: "points", label: "Computed Points" }
    ]
  },
  contacts: {
    name: "Contacts",
    dbKey: "contacts",
    defaultData: [] as Contact[],
    fields: [
      { value: "gender", label: "Gender (male/female)" },
      { value: "city", label: "City" },
      { value: "state", label: "State" },
      { value: "createdAt", label: "Created Date" },
      { value: "updatedAt", label: "Last Updated Date" }
    ],
    numericFields: []
  },
  questions: {
    name: "Question Bank Questions",
    dbKey: "questions",
    defaultData: [] as QuestionBankQuestion[],
    fields: [
      { value: "type", label: "Question Type" },
      { value: "difficulty", label: "Difficulty" },
      { value: "questionLanguage", label: "Question Language" },
      { value: "marks", label: "Marks", isNumeric: true }
    ],
    numericFields: [
      { value: "marks", label: "Marks" }
    ]
  },
  tests: {
    name: "Generated Tests",
    dbKey: "tests",
    defaultData: [] as QuestionBankTest[],
    fields: [
      { value: "difficulty", label: "Difficulty" },
      { value: "categoryId", label: "Category" },
      { value: "duration", label: "Duration", isNumeric: true },
      { value: "createdAt", label: "Created Date" }
    ],
    numericFields: [
      { value: "duration", label: "Duration" }
    ]
  },
  assessment_results: {
    name: "Assessment Results",
    dbKey: "assessment_results",
    defaultData: [] as QuestionBankResult[],
    fields: [
      { value: "testId", label: "Test" },
      { value: "studentName", label: "Student Name" },
      { value: "studentId", label: "Student ID" },
      { value: "submittedAt", label: "Submitted Date" }
    ],
    numericFields: []
  }
} as const;

/**
 * Calculates the dynamic trend percentage comparing the current 30-day period
 * with the preceding 30-day period.
 *
 * @param card - The CustomCard configuration schema.
 * @param collectionRows - The array of database records for the collection.
 * @param collectionName - The name of the collection.
 * @returns The calculated trend percentage.
 */
function calculateDynamicTrend(
  card: CustomCard,
  collectionRows: Record<string, unknown>[],
  collectionName: string,
  denoms?: Denomination[]
): number {
  const dateField = {
    students: "registeredDate",
    teachers: "joinDate",
    sessions: "startDate",
    finance_invoices: "dueDate",
    attendance_records: "date",
    hasanat_distributions: "issuedDate",
    contacts: "createdAt",
    questions: "",
    tests: "createdAt",
    assessment_results: "submittedAt"
  }[collectionName];

  if (!dateField || collectionRows.length === 0) return 0;

  // 1. Find the maximum date in the collection to pivot the time windows
  let maxTime = 0;
  collectionRows.forEach((collectionRow) => {
    const dateValue = collectionRow[dateField];
    if (dateValue) {
      const time = new Date(String(dateValue)).getTime();
      if (!isNaN(time) && time > maxTime) {
        maxTime = time;
      }
    }
  });

  if (maxTime === 0) return 0;

  // Windows: current 30 days and previous 30 days
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const pivotTime = maxTime - thirtyDays;
  const startTime = maxTime - (2 * thirtyDays);

  // Helper to filter and calculate value for a given period of rows
  const computePeriodValue = (periodRows: Record<string, unknown>[]) => {
    // Apply filter
    const filteredRows = periodRows.filter((periodRow) =>
      matchesWidgetFilter(periodRow, card.filterField, card.filterOperator, card.filterValue)
    );

    if (card.operation === "count") {
      return filteredRows.length;
    }

    if (card.operation === "percentage") {
      return periodRows.length > 0 ? (filteredRows.length / periodRows.length) * 100 : 0;
    }

    // Sum or Avg
    const targetMetricField = card.targetField || "";
    let sum = 0;
    let count = 0;
    filteredRows.forEach((filteredRow) => {
      if (card.collection === "hasanat_distributions" && targetMetricField === "points") {
        const denominationName = String(filteredRow.denominationName || "").toLowerCase();
        const matchedDenomination = (denoms || []).find((denomination) => denomination.id === filteredRow.denominationId);
        const points = matchedDenomination ? matchedDenomination.points : (
          denominationName.includes("silver") ? 150 :
          denominationName.includes("gold") ? 500 :
          denominationName.includes("platinum") ? 1000 :
          denominationName.includes("diamond") ? 2500 : 50
        );
        sum += Number(filteredRow.quantity || 1) * points;
        count++;
      } else {
        const numericFieldValue = Number(filteredRow[targetMetricField]);
        if (!isNaN(numericFieldValue)) {
          sum += numericFieldValue;
          count++;
        }
      }
    });

    return card.operation === "sum" ? sum : (count > 0 ? sum / count : 0);
  };

  // Split rows into current vs previous periods
  const currentItems: Record<string, unknown>[] = [];
  const previousItems: Record<string, unknown>[] = [];

  collectionRows.forEach((collectionRow) => {
    const dateValue = collectionRow[dateField];
    if (dateValue) {
      const time = new Date(String(dateValue)).getTime();
      if (!isNaN(time)) {
        if (time >= pivotTime && time <= maxTime) {
          currentItems.push(collectionRow);
        } else if (time >= startTime && time < pivotTime) {
          previousItems.push(collectionRow);
        }
      }
    }
  });

  const currentValue = computePeriodValue(currentItems);
  const previousValue = computePeriodValue(previousItems);

  if (currentValue === 0 && previousValue === 0) return 0;
  if (previousValue === 0) return 100; // default 100% growth

  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

export function computeCustomCard(
  card: CustomCard,
  collections: {
    students: Student[];
    teachers: Teacher[];
    sessions: Session[];
    finance_invoices: Invoice[];
    attendance_records: AttendanceRecord[];
    hasanat_distributions: Distribution[];
    contacts: Contact[];
    questions: QuestionBankQuestion[];
    tests: QuestionBankTest[];
    assessment_results: QuestionBankResult[];
    hasanat_denoms?: Denomination[];
  },
  t?: TranslationFunction
) {
  const collectionRows = (collections[card.collection] as Record<string, unknown>[]) || [];
  
  const filteredRows = collectionRows.filter((collectionRow) =>
    matchesWidgetFilter(collectionRow, card.filterField, card.filterOperator, card.filterValue)
  );

  let numericValue = 0;
  if (card.operation === "sum" || card.operation === "avg") {
    const targetMetricField = card.targetField || "";
    let sum = 0;
    let count = 0;
    filteredRows.forEach((filteredRow) => {
      if (card.collection === "hasanat_distributions" && targetMetricField === "points") {
        const denominationName = String(filteredRow.denominationName || "").toLowerCase();
        const matchedDenomination = (collections.hasanat_denoms || []).find((denomination) => denomination.id === filteredRow.denominationId);
        const points = matchedDenomination ? matchedDenomination.points : (
          denominationName.includes("silver") ? 150 :
          denominationName.includes("gold") ? 500 :
          denominationName.includes("platinum") ? 1000 :
          denominationName.includes("diamond") ? 2500 : 50
        );
        sum += Number(filteredRow.quantity || 1) * points;
        count++;
      } else {
        const numericFieldValue = Number(filteredRow[targetMetricField]);
        if (!isNaN(numericFieldValue)) {
          sum += numericFieldValue;
          count++;
        }
      }
    });
    numericValue = card.operation === "sum" ? sum : (count > 0 ? Math.round(sum / count) : 0);
  }

  let finalValue: string | number = 0;
  if (card.operation === "count") {
    finalValue = filteredRows.length;
  } else if (card.operation === "percentage") {
    finalValue = collectionRows.length > 0 ? `${Math.round((filteredRows.length / collectionRows.length) * 100)}%` : "0%";
  } else {
    finalValue = numericValue;
  }

  if (typeof finalValue === "number") {
    if (
      card.collection === "finance_invoices" &&
      (card.targetField === "finalAmt" || card.targetField === "paidAmt" || card.targetField === "baseAmt" || card.targetField === "discountAmt")
    ) {
      finalValue = formatMoney(finalValue);
    } else {
      finalValue = formatNumber(finalValue);
    }

  }

  let subText = "";
  if (card.subTextType === "fixed") {
    subText = card.fixedSubText || "";
  } else {
    subText = t
      ? t("reports.widgets.matchedCountText", { matched: filteredRows.length, total: collectionRows.length })
      : `${filteredRows.length} of ${collectionRows.length} matched`;
  }

  let trendValue = card.trend || 0;
  if (card.trendType === "database") {
    trendValue = calculateDynamicTrend(card, collectionRows, card.collection, collections.hasanat_denoms);
  }

  return {
    id: card.id,
    title: card.title,
    value: finalValue,
    sub: subText,
    icon: card.icon,
    color: card.color,
    trend: trendValue
  };
}

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
