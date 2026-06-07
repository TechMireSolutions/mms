import { CONTACTS } from "../../lib/contactsData";
import { STUDENTS, type Student } from "../../lib/studentsData";
import { SESSIONS_DATA, type Session } from "../../lib/sessionsData";
import { INVOICES, type Invoice } from "../../lib/financeData";
import { ATTENDANCE_RECORDS, type AttendanceRecord } from "../../lib/attendanceData";
import { DISTRIBUTIONS, type Distribution } from "../../lib/hasanatData";
import { type Contact } from "../../lib/contactFields";
import { QUESTIONS, TESTS, RESULTS } from "../../lib/questionBankData";

export type ReportCollection =
  | "students"
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
    defaultData: STUDENTS,
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
  sessions: {
    name: "Sessions & Classes",
    dbKey: "sessions",
    defaultData: SESSIONS_DATA,
    fields: [
      { value: "status", label: "Status (active/cancelled)" },
      { value: "gender", label: "Gender Orientation (male/female/any)" },
      { value: "type", label: "Course Type (Hifz/Tajweed/Qaidah...)" },
      { value: "room", label: "Classroom / Location" },
      { value: "teacherName", label: "Instructor" },
      { value: "baseFee", label: "Base Fee (PKR)", isNumeric: true },
      { value: "enrolled", label: "Enrolled Count", isNumeric: true },
      { value: "capacity", label: "Capacity Limit", isNumeric: true },
      { value: "startDate", label: "Start Date" },
      { value: "endDate", label: "End Date" }
    ],
    numericFields: [
      { value: "baseFee", label: "Base Fee (PKR)" },
      { value: "enrolled", label: "Enrolled Count" },
      { value: "capacity", label: "Capacity Limit" }
    ]
  },
  finance_invoices: {
    name: "Financial Invoices",
    dbKey: "finance_invoices",
    defaultData: INVOICES,
    fields: [
      { value: "status", label: "Status (paid/unpaid/partial/cancelled)" },
      { value: "paymentMethod", label: "Payment Channel" },
      { value: "finalAmt", label: "Final Amount (PKR)", isNumeric: true },
      { value: "paidAmt", label: "Paid Amount (PKR)", isNumeric: true },
      { value: "discountAmt", label: "Discount Offset (PKR)", isNumeric: true },
      { value: "baseAmt", label: "Base Fee Amount (PKR)", isNumeric: true },
      { value: "dueDate", label: "Due Date" },
      { value: "paidDate", label: "Paid Date" }
    ],
    numericFields: [
      { value: "finalAmt", label: "Final Amount (PKR)" },
      { value: "paidAmt", label: "Paid Amount (PKR)" },
      { value: "discountAmt", label: "Discount Offset (PKR)" },
      { value: "baseAmt", label: "Base Fee Amount (PKR)" }
    ]
  },
  attendance_records: {
    name: "Attendance Registry",
    dbKey: "attendance_records",
    defaultData: ATTENDANCE_RECORDS,
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
    defaultData: DISTRIBUTIONS,
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
    defaultData: CONTACTS,
    fields: [
      { value: "lifecycleStage", label: "Lifecycle Stage (Lead/Employee/Student/Parent...)" },
      { value: "gender", label: "Gender (male/female)" },
      { value: "city", label: "City" },
      { value: "state", label: "State" },
      { value: "rating", label: "Rating (1-5)", isNumeric: true },
      { value: "createdAt", label: "Created Date" },
      { value: "updatedAt", label: "Last Updated Date" }
    ],
    numericFields: [
      { value: "rating", label: "Rating (1-5)" }
    ]
  },
  questions: {
    name: "Question Bank Questions",
    dbKey: "questions",
    defaultData: QUESTIONS,
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
    defaultData: TESTS,
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
    defaultData: RESULTS,
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
 * @param list - The array of database records for the collection.
 * @param collectionName - The name of the collection.
 * @returns The calculated trend percentage.
 */
function calculateDynamicTrend(
  card: CustomCard,
  list: Record<string, unknown>[],
  collectionName: string
): number {
  const dateField = {
    students: "registeredDate",
    sessions: "startDate",
    finance_invoices: "dueDate",
    attendance_records: "date",
    hasanat_distributions: "issuedDate",
    contacts: "createdAt",
    questions: "",
    tests: "createdAt",
    assessment_results: "submittedAt"
  }[collectionName];

  if (!dateField || list.length === 0) return 0;

  // 1. Find the maximum date in the list to pivot the time windows
  let maxTime = 0;
  list.forEach((item) => {
    const dVal = item[dateField];
    if (dVal) {
      const time = new Date(String(dVal)).getTime();
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

  // Helper to filter and calculate value for a given list of items
  const computePeriodValue = (items: Record<string, unknown>[]) => {
    // Apply filter
    const filtered = items.filter((item) => {
      if (!card.filterField) return true;
      const val = item[card.filterField];
      if (val === undefined || val === null) return false;
      const strVal = String(val).toLowerCase();
      const strTargetVal = String(card.filterValue || "").toLowerCase();
      
      switch (card.filterOperator) {
        case "equals":
          return strVal === strTargetVal;
        case "contains":
          return strVal.includes(strTargetVal);
        case "gt":
          return Number(val) > Number(card.filterValue);
        case "lt":
          return Number(val) < Number(card.filterValue);
        default:
          return true;
      }
    });

    if (card.operation === "count") {
      return filtered.length;
    }

    if (card.operation === "percentage") {
      return items.length > 0 ? (filtered.length / items.length) * 100 : 0;
    }

    // Sum or Avg
    const field = card.targetField || "";
    let sum = 0;
    let count = 0;
    filtered.forEach((item) => {
      if (card.collection === "hasanat_distributions" && field === "points") {
        let points = 50;
        const denom = String(item.denominationName || "").toLowerCase();
        if (denom.includes("silver")) points = 150;
        else if (denom.includes("gold")) points = 500;
        else if (denom.includes("platinum")) points = 1000;
        else if (denom.includes("diamond")) points = 2500;
        sum += Number(item.quantity || 1) * points;
        count++;
      } else {
        const num = Number(item[field]);
        if (!isNaN(num)) {
          sum += num;
          count++;
        }
      }
    });

    return card.operation === "sum" ? sum : (count > 0 ? sum / count : 0);
  };

  // Split items into current vs previous periods
  const currentItems: Record<string, unknown>[] = [];
  const previousItems: Record<string, unknown>[] = [];

  list.forEach((item) => {
    const dVal = item[dateField];
    if (dVal) {
      const time = new Date(String(dVal)).getTime();
      if (!isNaN(time)) {
        if (time >= pivotTime && time <= maxTime) {
          currentItems.push(item);
        } else if (time >= startTime && time < pivotTime) {
          previousItems.push(item);
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
    sessions: Session[];
    finance_invoices: Invoice[];
    attendance_records: AttendanceRecord[];
    hasanat_distributions: Distribution[];
    contacts: Contact[];
    questions: typeof QUESTIONS;
    tests: typeof TESTS;
    assessment_results: typeof RESULTS;
  }
) {
  const list = (collections[card.collection] as Record<string, unknown>[]) || [];
  
  const filteredList = list.filter((item) => {
    if (!item) return false;
    if (!card.filterField) return true;
    
    const val = item[card.filterField];
    if (val === undefined || val === null) return false;
    
    const strVal = String(val).toLowerCase();
    const strTargetVal = String(card.filterValue || "").toLowerCase();
    
    switch (card.filterOperator) {
      case "equals":
        return strVal === strTargetVal;
      case "contains":
        return strVal.includes(strTargetVal);
      case "gt":
        return Number(val) > Number(card.filterValue);
      case "lt":
        return Number(val) < Number(card.filterValue);
      default:
        return true;
    }
  });

  let numericValue = 0;
  if (card.operation === "sum" || card.operation === "avg") {
    const field = card.targetField || "";
    let sum = 0;
    let count = 0;
    filteredList.forEach((item) => {
      if (card.collection === "hasanat_distributions" && field === "points") {
        let points = 50;
        const denom = String(item.denominationName || "").toLowerCase();
        if (denom.includes("silver")) points = 150;
        else if (denom.includes("gold")) points = 500;
        else if (denom.includes("platinum")) points = 1000;
        else if (denom.includes("diamond")) points = 2500;
        sum += Number(item.quantity || 1) * points;
        count++;
      } else {
        const num = Number(item[field]);
        if (!isNaN(num)) {
          sum += num;
          count++;
        }
      }
    });
    numericValue = card.operation === "sum" ? sum : (count > 0 ? Math.round(sum / count) : 0);
  }

  let finalValue: string | number = 0;
  if (card.operation === "count") {
    finalValue = filteredList.length;
  } else if (card.operation === "percentage") {
    finalValue = list.length > 0 ? `${Math.round((filteredList.length / list.length) * 100)}%` : "0%";
  } else {
    finalValue = numericValue;
  }

  if (typeof finalValue === "number") {
    if (
      card.collection === "finance_invoices" &&
      (card.targetField === "finalAmt" || card.targetField === "paidAmt" || card.targetField === "baseAmt" || card.targetField === "discountAmt")
    ) {
      finalValue = `₨ ${finalValue.toLocaleString()}`;
    } else {
      finalValue = finalValue.toLocaleString();
    }
  }

  let subText = "";
  if (card.subTextType === "fixed") {
    subText = card.fixedSubText || "";
  } else {
    subText = `${filteredList.length} of ${list.length} matched`;
  }

  let trendVal = card.trend || 0;
  if (card.trendType === "database") {
    trendVal = calculateDynamicTrend(card, list, card.collection);
  }

  return {
    id: card.id,
    title: card.title,
    value: finalValue,
    sub: subText,
    icon: card.icon,
    color: card.color,
    trend: trendVal
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
  "visual-contacts-stage": {
    id: "visual-contacts-stage",
    title: "Contacts Volume by Lifecycle Stages",
    collection: "contacts",
    chartType: "pie",
    xAxisField: "lifecycleStage",
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
    const saved = localStorage.getItem("report_custom_visuals");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed[id]) return parsed[id] as VisualizerConfig;
    }
  } catch (e) {
    console.error("Failed to load custom report visual configuration", e);
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
