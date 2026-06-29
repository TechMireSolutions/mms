import { getCollection } from "@/lib/db";
import {
  type ContactsWidgetAggregateResult,
  type StudentsWidgetAggregateResult,
  type TeachersWidgetAggregateResult,
  type Contact,
} from "@mms/shared";
import { queryClientInstance } from "@/lib/query-client";
import {
  CONTACTS_METRICS_QUERY_KEY,
  CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
} from "@/hooks/useContacts";
import {
  STUDENTS_METRICS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
} from "@/hooks/useStudents";
import {
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
} from "@/hooks/useTeachers";
import type { CustomWidget } from "./types";

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

function formatTeachersWidgetValue(
  widget: CustomWidget,
  aggregate: TeachersWidgetAggregateResult,
): { value: number; formattedValue: string; isAlert: boolean; totalCount: number } {
  let formattedValue = String(aggregate.value);
  if (widget.widgetType === "progress" || widget.operation === "percentage") {
    formattedValue = `${aggregate.value}%`;
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

function formatStudentsWidgetValue(
  widget: CustomWidget,
  aggregate: StudentsWidgetAggregateResult,
): { value: number; formattedValue: string; isAlert: boolean; totalCount: number } {
  let formattedValue = String(aggregate.value);
  if (widget.widgetType === "progress" || widget.operation === "percentage") {
    formattedValue = `${aggregate.value}%`;
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

function formatContactsWidgetValue(
  widget: CustomWidget,
  aggregate: ContactsWidgetAggregateResult,
): { value: number; formattedValue: string; isAlert: boolean; totalCount: number } {
  let formattedValue = String(aggregate.value);
  if (widget.widgetType === "progress" || widget.operation === "percentage") {
    formattedValue = `${aggregate.value}%`;
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
  const denoms = getCollection("hasanat_denoms");
  const sessions = getCollection("sessions");
  const questions = getCollection("questions");
  const tests = getCollection("tests");
  const results = getCollection("assessment_results");

  return {
    students,
    teachers,
    sessions,
    finance_invoices: invoices,
    attendance_records: attendance,
    hasanat_distributions: distributions,
    hasanat_denoms: denoms,
    contacts,
    questions,
    tests,
    assessment_results: results,
  };
}

/**
 * Filters a collection in real-time based on widget query conditions.
 */
export function getFilteredRecords(
  widget: CustomWidget,
  collections: ReturnType<typeof getWidgetCollections>,
): Record<string, unknown>[] {
  if (widget.collection === "contacts") {
    return [];
  }
  if (widget.collection === "students") {
    return [];
  }
  if (widget.collection === "teachers") {
    return [];
  }

  const list = (collections[widget.collection] || []) as Record<string, unknown>[];
  if (!widget.filterField) return list;

  return list.filter((item) => {
    if (!item) return false;
    const fieldValue = item[widget.filterField || ""];
    if (fieldValue === undefined || fieldValue === null) return false;

    const stringValue = String(fieldValue).toLowerCase();
    const stringTargetValue = String(widget.filterValue || "").toLowerCase();

    switch (widget.filterOperator) {
      case "equals":
        return stringValue === stringTargetValue;
      case "contains":
        return stringValue.includes(stringTargetValue);
      case "gt":
        return Number(fieldValue) > Number(widget.filterValue);
      case "lt":
        return Number(fieldValue) < Number(widget.filterValue);
      default:
        return true;
    }
  });
}

export function computeWidgetSingleValue(
  widget: CustomWidget,
  collections: ReturnType<typeof getWidgetCollections>,
): { value: number; formattedValue: string; isAlert: boolean; totalCount: number } {
  if (widget.collection === "contacts") {
    const aggregate = readContactsWidgetAggregate(widget.id);
    if (aggregate) {
      return formatContactsWidgetValue(widget, aggregate);
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
      return formatStudentsWidgetValue(widget, aggregate);
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
      return formatTeachersWidgetValue(widget, aggregate);
    }
    const totalCount = readTeachersTotalFromMetrics();
    return {
      value: 0,
      formattedValue: widget.operation === "percentage" ? "0%" : "0",
      isAlert: false,
      totalCount,
    };
  }

  const filtered = getFilteredRecords(widget, collections);
  const totalInCollection = (collections[widget.collection] || []).length;
  let finalValue = 0;

  if (widget.operation === "count") {
    finalValue = filtered.length;
  } else if (widget.operation === "percentage") {
    finalValue = totalInCollection > 0 ? Math.round((filtered.length / totalInCollection) * 100) : 0;
  } else {
    const field = widget.targetField || "";
    let sum = 0;
    let count = 0;
    filtered.forEach((item) => {
      if (widget.collection === "hasanat_distributions" && field === "points") {
        const denomName = String(item.denominationName || "").toLowerCase();
        const matchedDenom = (collections.hasanat_denoms || []).find((denomination: any) => denomination.id === item.denominationId);
        const points = matchedDenom ? matchedDenom.points : (
          denomName.includes("silver") ? 150 :
          denomName.includes("gold") ? 500 :
          denomName.includes("platinum") ? 1000 :
          denomName.includes("diamond") ? 2500 : 50
        );
        sum += Number(item.quantity || 1) * points;
        count++;
      } else {
        const numericValue = Number(item[field]);
        if (!isNaN(numericValue)) {
          sum += numericValue;
          count++;
        }
      }
    });
    finalValue = widget.operation === "sum" ? sum : (count > 0 ? Math.round(sum / count) : 0);
  }

  let formattedValue = String(finalValue);
  if (widget.widgetType === "progress" || widget.operation === "percentage") {
    formattedValue = `${finalValue}%`;
  } else if (widget.collection === "finance_invoices" && widget.operation !== "count") {
    formattedValue = `₨ ${finalValue.toLocaleString()}`;
  } else {
    formattedValue = finalValue.toLocaleString();
  }

  let isAlert = false;
  if (widget.thresholdEnabled && widget.thresholdValue !== undefined) {
    const numericValue = Number(finalValue);
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

  return { value: finalValue, formattedValue, isAlert, totalCount: totalInCollection };
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

  const list = collections[widget.collection] || [];
  const filteredList = list.filter((item) => {
    if (!item) return false;
    if (!widget.filterField) return true;
    const fieldValue = (item as Record<string, unknown>)[widget.filterField];
    if (fieldValue === undefined || fieldValue === null) return false;
    const stringValue = String(fieldValue).toLowerCase();
    const stringTargetValue = String(widget.filterValue || "").toLowerCase();
    switch (widget.filterOperator) {
      case "equals":
        return stringValue === stringTargetValue;
      case "contains":
        return stringValue.includes(stringTargetValue);
      case "gt":
        return Number(fieldValue) > Number(widget.filterValue);
      case "lt":
        return Number(fieldValue) < Number(widget.filterValue);
      default:
        return true;
    }
  });

  const xAxis = widget.xAxisField || "status";
  const groups: Record<string, Record<string, unknown>[]> = {};
  filteredList.forEach((item) => {
    const keyVal = (item as Record<string, unknown>)[xAxis];
    const key = keyVal === undefined || keyVal === null || keyVal === "" ? "Unknown" : String(keyVal);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item as Record<string, unknown>);
  });

  const data = Object.entries(groups).map(([groupName, items]) => {
    let finalValue = 0;
    if (widget.operation === "count") {
      finalValue = items.length;
    } else {
      const field = widget.targetField || "";
      let sum = 0;
      let count = 0;
      items.forEach((item) => {
        if (widget.collection === "hasanat_distributions" && field === "points") {
          const denomName = String(item.denominationName || "").toLowerCase();
          const matchedDenom = (collections.hasanat_denoms || []).find((denomination: any) => denomination.id === item.denominationId);
          const points = matchedDenom ? matchedDenom.points : (
            denomName.includes("silver") ? 150 :
            denomName.includes("gold") ? 500 :
            denomName.includes("platinum") ? 1000 :
            denomName.includes("diamond") ? 2500 : 50
          );
          sum += Number(item.quantity || 1) * points;
          count++;
        } else {
          const numericValue = Number(item[field]);
          if (!isNaN(numericValue)) {
            sum += numericValue;
            count++;
          }
        }
      });
      finalValue = widget.operation === "sum" ? sum : (count > 0 ? Math.round(sum / count) : 0);
    }
    return { name: groupName, value: finalValue };
  });

  return data.sort((firstItem, secondItem) => secondItem.value - firstItem.value).slice(0, 8);
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
  },
): { numericValue: number; finalValue: string | number; totalCount: number } | null {
  const aggregate = readContactsWidgetAggregate(card.id);
  if (!aggregate) return null;

  let finalValue: string | number = aggregate.value;
  if (card.operation === "percentage") {
    finalValue = `${aggregate.value}%`;
  } else if (card.operation === "count") {
    finalValue = aggregate.value;
  } else {
    finalValue = aggregate.value;
  }

  return {
    numericValue: aggregate.value,
    finalValue,
    totalCount: aggregate.totalCount,
  };
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
  },
): { numericValue: number; finalValue: string | number; totalCount: number } | null {
  const aggregate = readStudentsWidgetAggregate(card.id);
  if (!aggregate) return null;

  let finalValue: string | number = aggregate.value;
  if (card.operation === "percentage") {
    finalValue = `${aggregate.value}%`;
  }

  return {
    numericValue: aggregate.value,
    finalValue,
    totalCount: aggregate.totalCount,
  };
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
  },
): { numericValue: number; finalValue: string | number; totalCount: number } | null {
  const aggregate = readTeachersWidgetAggregate(card.id);
  if (!aggregate) return null;

  let finalValue: string | number = aggregate.value;
  if (card.operation === "percentage") {
    finalValue = `${aggregate.value}%`;
  }

  return {
    numericValue: aggregate.value,
    finalValue,
    totalCount: aggregate.totalCount,
  };
}
