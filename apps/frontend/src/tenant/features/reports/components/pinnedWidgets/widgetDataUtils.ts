import { getCollection } from "@/lib/db";
import {
  type ContactsWidgetAggregateResult,
  type StudentsWidgetAggregateResult,
  type TeachersWidgetAggregateResult,
  type Contact,
  formatMoney,
  matchesWidgetFilter,
} from "@mms/shared";
import { queryClientInstance } from "@/lib/queryClient";
import {
  CONTACTS_METRICS_QUERY_KEY,
  CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
} from "@/tenant/features/contacts/hooks/useContacts";
import {
  STUDENTS_METRICS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
} from "@/tenant/features/students/hooks/useStudents";
import {
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
} from "@/tenant/features/teachers/hooks/useTeachers";
import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import type { Denomination } from "@/lib/data/hasanatData";

function readContactsWidgetAggregate(widgetId: string): ContactsWidgetAggregateResult | undefined {
  const queries = queryClientInstance.getQueriesData<Record<string, ContactsWidgetAggregateResult>>({
    queryKey: CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
  });
  for (const [, aggregateByWidgetId] of queries) {
    if (aggregateByWidgetId?.[widgetId]) return aggregateByWidgetId[widgetId];
  }
  return undefined;
}

function readContactsTotalFromMetrics(): number {
  const metrics = queryClientInstance.getQueryData<{ total: number }>(CONTACTS_METRICS_QUERY_KEY);
  return metrics?.total ?? 0;
}

function readStudentsWidgetAggregate(widgetId: string): StudentsWidgetAggregateResult | undefined {
  const queries = queryClientInstance.getQueriesData<Record<string, StudentsWidgetAggregateResult>>({
    queryKey: STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
  });
  for (const [, aggregateByWidgetId] of queries) {
    if (aggregateByWidgetId?.[widgetId]) return aggregateByWidgetId[widgetId];
  }
  return undefined;
}

function readStudentsTotalFromMetrics(): number {
  const metrics = queryClientInstance.getQueryData<{ total: number }>(STUDENTS_METRICS_QUERY_KEY);
  return metrics?.total ?? 0;
}

function readTeachersWidgetAggregate(widgetId: string): TeachersWidgetAggregateResult | undefined {
  const queries = queryClientInstance.getQueriesData<Record<string, TeachersWidgetAggregateResult>>({
    queryKey: TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  });
  for (const [, aggregateByWidgetId] of queries) {
    if (aggregateByWidgetId?.[widgetId]) return aggregateByWidgetId[widgetId];
  }
  return undefined;
}

function readTeachersTotalFromMetrics(): number {
  const metrics = queryClientInstance.getQueryData<{ total: number }>(TEACHERS_METRICS_QUERY_KEY);
  return metrics?.total ?? 0;
}

function formatGenericWidgetValue(
  widget: CustomWidget,
  aggregate: { value: number; totalCount: number },
): { value: number; formattedValue: string; isAlert: boolean; totalCount: number } {
  let formattedValue = String(aggregate.value);
  if (widget.widgetType === "progress" || widget.operation === "percentage") {
    formattedValue = `${aggregate.value}%`;
  } else if (widget.collection === "finance_invoices" && widget.operation !== "count") {
    formattedValue = formatMoney(aggregate.value);
  } else {
    formattedValue = aggregate.value.toLocaleString();
  }

  let isAlert = false;
  if (widget.thresholdEnabled && widget.thresholdValue !== undefined) {
    const numericValue = Number(aggregate.value);
    const numericThreshold = Number(widget.thresholdValue);
    switch (widget.thresholdCondition) {
      case "lt":
        isAlert = numericValue < numericThreshold;
        break;
      case "gt":
        isAlert = numericValue > numericThreshold;
        break;
      case "equals":
        isAlert = numericValue === numericThreshold;
        break;
    }
  }

  return {
    value: aggregate.value,
    formattedValue,
    isAlert,
    totalCount: aggregate.totalCount,
  };
}

export function getWidgetCollections() {
  const contacts: Contact[] = [];
  const students: Record<string, unknown>[] = [];
  const teachers: Record<string, unknown>[] = [];
  const invoices = getCollection("finance_invoices");
  const attendance = getCollection("attendance_records");
  const distributions = getCollection("hasanat_distributions");
  const denominations = getCollection("hasanat_denoms");
  const sessions = getCollection("sessions");
  const questions = getCollection("questions");
  const tests = getCollection("tests");
  const assessmentResults = getCollection("assessment_results");

  return {
    students,
    teachers,
    sessions,
    finance_invoices: invoices,
    attendance_records: attendance,
    hasanat_distributions: distributions,
    hasanat_denoms: denominations,
    contacts,
    questions,
    tests,
    assessment_results: assessmentResults,
  };
}

/**
 * Filters a collection in real-time based on widget query conditions.
 */
export function getFilteredRecords(
  widget: CustomWidget,
  collections: ReturnType<typeof getWidgetCollections>,
): Record<string, unknown>[] {
  if (
    widget.collection === "contacts" ||
    widget.collection === "students" ||
    widget.collection === "teachers"
  ) {
    return [];
  }

  const collectionRecords = (collections[widget.collection] || []) as Record<string, unknown>[];
  return collectionRecords.filter((collectionRecord) =>
    matchesWidgetFilter(
      collectionRecord,
      widget.filterField,
      widget.filterOperator,
      widget.filterValue,
    )
  );
}

export function computeWidgetSingleValue(
  widget: CustomWidget,
  collections: ReturnType<typeof getWidgetCollections>,
): { value: number; formattedValue: string; isAlert: boolean; totalCount: number } {
  if (widget.collection === "contacts") {
    const aggregate = readContactsWidgetAggregate(widget.id);
    if (aggregate) {
      return formatGenericWidgetValue(widget, aggregate);
    }
    const totalCount = readContactsTotalFromMetrics();
    return {
      value: 0,
      formattedValue: widget.operation === "percentage" ? "0%" : "0",
      isAlert: false,
      totalCount,
    };
  }

  if (widget.collection === "students") {
    const aggregate = readStudentsWidgetAggregate(widget.id);
    if (aggregate) {
      return formatGenericWidgetValue(widget, aggregate);
    }
    const totalCount = readStudentsTotalFromMetrics();
    return {
      value: 0,
      formattedValue: widget.operation === "percentage" ? "0%" : "0",
      isAlert: false,
      totalCount,
    };
  }

  if (widget.collection === "teachers") {
    const aggregate = readTeachersWidgetAggregate(widget.id);
    if (aggregate) {
      return formatGenericWidgetValue(widget, aggregate);
    }
    const totalCount = readTeachersTotalFromMetrics();
    return {
      value: 0,
      formattedValue: widget.operation === "percentage" ? "0%" : "0",
      isAlert: false,
      totalCount,
    };
  }

  const filteredRecords = getFilteredRecords(widget, collections);
  const totalInCollection = (collections[widget.collection] || []).length;
  let computedValue = 0;

  if (widget.operation === "count") {
    computedValue = filteredRecords.length;
  } else if (widget.operation === "percentage") {
    computedValue = totalInCollection > 0 ? Math.round((filteredRecords.length / totalInCollection) * 100) : 0;
  } else {
    const targetField = widget.targetField || "";
    let numericTotal = 0;
    let numericRecordCount = 0;
    filteredRecords.forEach((filteredRecord) => {
      if (widget.collection === "hasanat_distributions" && targetField === "points") {
        const denominationName = String(filteredRecord.denominationName || "").toLowerCase();
        const matchedDenomination = (collections.hasanat_denoms || []).find((denomination: Denomination) => denomination.id === filteredRecord.denominationId);
        const points = matchedDenomination ? matchedDenomination.points : (
          denominationName.includes("silver") ? 150 :
          denominationName.includes("gold") ? 500 :
          denominationName.includes("platinum") ? 1000 :
          denominationName.includes("diamond") ? 2500 : 50
        );
        numericTotal += Number(filteredRecord.quantity || 1) * points;
        numericRecordCount++;
      } else {
        const numericValue = Number(filteredRecord[targetField]);
        if (!isNaN(numericValue)) {
          numericTotal += numericValue;
          numericRecordCount++;
        }
      }
    });
    computedValue = widget.operation === "sum" ? numericTotal : (numericRecordCount > 0 ? Math.round(numericTotal / numericRecordCount) : 0);
  }

  return formatGenericWidgetValue(widget, { value: computedValue, totalCount: totalInCollection });
}

export function computeWidgetChartData(
  widget: CustomWidget,
  collections: ReturnType<typeof getWidgetCollections>,
): { name: string; value: number }[] {
  if (widget.collection === "contacts") {
    const aggregate = readContactsWidgetAggregate(widget.id);
    return aggregate?.chartData ?? [];
  }
  if (widget.collection === "students") {
    const aggregate = readStudentsWidgetAggregate(widget.id);
    return aggregate?.chartData ?? [];
  }
  if (widget.collection === "teachers") {
    const aggregate = readTeachersWidgetAggregate(widget.id);
    return aggregate?.chartData ?? [];
  }

  const collectionRecords = collections[widget.collection] || [];
  const filteredRecords = collectionRecords.filter((collectionRecord) =>
    matchesWidgetFilter(
      collectionRecord as Record<string, unknown>,
      widget.filterField,
      widget.filterOperator,
      widget.filterValue,
    )
  );

  const xAxis = widget.xAxisField || "status";
  const groups: Record<string, Record<string, unknown>[]> = {};
  filteredRecords.forEach((filteredRecord) => {
    const groupValue = (filteredRecord as Record<string, unknown>)[xAxis];
    const groupKey = groupValue === undefined || groupValue === null || groupValue === "" ? "Unknown" : String(groupValue);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(filteredRecord as Record<string, unknown>);
  });

  const chartData = Object.entries(groups).map(([groupName, groupRecords]) => {
    let computedValue = 0;
    if (widget.operation === "count") {
      computedValue = groupRecords.length;
    } else {
      const targetField = widget.targetField || "";
      let numericTotal = 0;
      let numericRecordCount = 0;
      groupRecords.forEach((groupRecord) => {
        if (widget.collection === "hasanat_distributions" && targetField === "points") {
          const denominationName = String(groupRecord.denominationName || "").toLowerCase();
          const matchedDenomination = (collections.hasanat_denoms || []).find((denomination: Denomination) => denomination.id === groupRecord.denominationId);
          const points = matchedDenomination ? matchedDenomination.points : (
            denominationName.includes("silver") ? 150 :
            denominationName.includes("gold") ? 500 :
            denominationName.includes("platinum") ? 1000 :
            denominationName.includes("diamond") ? 2500 : 50
          );
          numericTotal += Number(groupRecord.quantity || 1) * points;
          numericRecordCount++;
        } else {
          const numericValue = Number(groupRecord[targetField]);
          if (!isNaN(numericValue)) {
            numericTotal += numericValue;
            numericRecordCount++;
          }
        }
      });
      computedValue = widget.operation === "sum" ? numericTotal : (numericRecordCount > 0 ? Math.round(numericTotal / numericRecordCount) : 0);
    }
    return { name: groupName, value: computedValue };
  });

  return chartData.sort((firstItem, secondItem) => secondItem.value - firstItem.value).slice(0, 8);
}
function computeGenericCustomCardValue(
  card: {
    operation: CustomWidget["operation"];
  },
  aggregate: { value: number; totalCount: number } | undefined,
): { numericValue: number; finalValue: string | number; totalCount: number } | null {
  if (!aggregate) return null;

  let displayValue: string | number = aggregate.value;
  if (card.operation === "percentage") {
    displayValue = `${aggregate.value}%`;
  }

  return {
    numericValue: aggregate.value,
    finalValue: displayValue,
    totalCount: aggregate.totalCount,
  };
}

/** Resolve dashboard card values for contacts via server widget aggregates. */
export function computeContactsCustomCardValue(
  card: {
    id: string;
    operation: CustomWidget["operation"];
    targetField?: string;
    filterField?: string;
    filterOperator?: CustomWidget["filterOperator"];
    filterValue?: string;
  }
) {
  return computeGenericCustomCardValue(card, readContactsWidgetAggregate(card.id));
}

/** Resolve dashboard card values for students via server widget aggregates. */
export function computeStudentsCustomCardValue(
  card: {
    id: string;
    operation: CustomWidget["operation"];
    targetField?: string;
    filterField?: string;
    filterOperator?: CustomWidget["filterOperator"];
    filterValue?: string;
  }
) {
  return computeGenericCustomCardValue(card, readStudentsWidgetAggregate(card.id));
}

/** Resolve dashboard card values for teachers via server widget aggregates. */
export function computeTeachersCustomCardValue(
  card: {
    id: string;
    operation: CustomWidget["operation"];
    targetField?: string;
    filterField?: string;
    filterOperator?: CustomWidget["filterOperator"];
    filterValue?: string;
  }
) {
  return computeGenericCustomCardValue(card, readTeachersWidgetAggregate(card.id));
}
