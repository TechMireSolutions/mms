import {
  type Contact,
  formatMoney,
  formatNumber,
  getDenominationPoints,
  matchesWidgetFilter,
  type QuestionBankQuestion,
  type QuestionBankResult,
  type QuestionBankTest,
} from "@mms/shared";
import type { Student } from "@/lib/data/studentsData";
import type { Teacher } from "@/lib/data/teachersData";
import type { Session } from "@/lib/data/sessionsData";
import type { Invoice } from "@/lib/data/financeData";
import type { AttendanceRecord } from "@/lib/data/attendanceData";
import type { Distribution, Denomination } from "@/lib/data/hasanatData";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { CustomCard } from "./reportCollectionTypes.js";

/** Compares the current 30-day window to the preceding 30 days for a custom card trend. */
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
        const points = getDenominationPoints(
          typeof filteredRow.denominationId === "string" ? filteredRow.denominationId : null,
          typeof filteredRow.denominationName === "string" ? filteredRow.denominationName : null,
          denoms,
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
        const points = getDenominationPoints(
          typeof filteredRow.denominationId === "string" ? filteredRow.denominationId : null,
          typeof filteredRow.denominationName === "string" ? filteredRow.denominationName : null,
          collections.hasanat_denoms,
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
