import { queryClientInstance } from "@/lib/queryClient";
import {
  CONTACTS_METRICS_QUERY_KEY,
  CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
} from "@/tenant/hooks/collections/contacts";
import {
  STUDENTS_METRICS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
} from "@/tenant/hooks/collections/students";
import {
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
} from "@/tenant/hooks/collections/teachers";
import {
  SESSIONS_METRICS_QUERY_KEY,
  SESSIONS_WIDGET_AGGREGATES_QUERY_KEY,
} from "@/tenant/hooks/collections/sessions";
import {
  ENROLLMENTS_METRICS_QUERY_KEY,
  ENROLLMENTS_WIDGET_AGGREGATES_QUERY_KEY,
} from "@/tenant/hooks/collections/enrollments";
import type { CustomWidget } from "./pinnedWidgetTypes";
import {
  type ContactsWidgetAggregateResult,
  type StudentsWidgetAggregateResult,
  type TeachersWidgetAggregateResult,
  type SessionsWidgetAggregateResult,
  type EnrollmentsWidgetAggregateResult,
  formatMoney,
  formatNumber,
} from "@mms/shared";

export function readContactsWidgetAggregate(widgetId: string): ContactsWidgetAggregateResult | undefined {
  const queries = queryClientInstance.getQueriesData<Record<string, ContactsWidgetAggregateResult>>({
    queryKey: CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
  });
  for (const [, aggregateByWidgetId] of queries) {
    if (aggregateByWidgetId?.[widgetId]) return aggregateByWidgetId[widgetId];
  }
  return undefined;
}

export function readContactsTotalFromMetrics(): number {
  const metrics = queryClientInstance.getQueryData<{ total: number }>(CONTACTS_METRICS_QUERY_KEY);
  return metrics?.total ?? 0;
}

export function readStudentsWidgetAggregate(widgetId: string): StudentsWidgetAggregateResult | undefined {
  const queries = queryClientInstance.getQueriesData<Record<string, StudentsWidgetAggregateResult>>({
    queryKey: STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
  });
  for (const [, aggregateByWidgetId] of queries) {
    if (aggregateByWidgetId?.[widgetId]) return aggregateByWidgetId[widgetId];
  }
  return undefined;
}

export function readStudentsTotalFromMetrics(): number {
  const metrics = queryClientInstance.getQueryData<{ total: number }>(STUDENTS_METRICS_QUERY_KEY);
  return metrics?.total ?? 0;
}

export function readTeachersWidgetAggregate(widgetId: string): TeachersWidgetAggregateResult | undefined {
  const queries = queryClientInstance.getQueriesData<Record<string, TeachersWidgetAggregateResult>>({
    queryKey: TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  });
  for (const [, aggregateByWidgetId] of queries) {
    if (aggregateByWidgetId?.[widgetId]) return aggregateByWidgetId[widgetId];
  }
  return undefined;
}

export function readTeachersTotalFromMetrics(): number {
  const metrics = queryClientInstance.getQueryData<{ total: number }>(TEACHERS_METRICS_QUERY_KEY);
  return metrics?.total ?? 0;
}

export function readSessionsWidgetAggregate(widgetId: string): SessionsWidgetAggregateResult | undefined {
  const queries = queryClientInstance.getQueriesData<Record<string, SessionsWidgetAggregateResult>>({
    queryKey: SESSIONS_WIDGET_AGGREGATES_QUERY_KEY,
  });
  for (const [, aggregateByWidgetId] of queries) {
    if (aggregateByWidgetId?.[widgetId]) return aggregateByWidgetId[widgetId];
  }
  return undefined;
}

export function readSessionsTotalFromMetrics(): number {
  const metrics = queryClientInstance.getQueryData<{ total: number }>(SESSIONS_METRICS_QUERY_KEY);
  return metrics?.total ?? 0;
}

export function readEnrollmentsWidgetAggregate(widgetId: string): EnrollmentsWidgetAggregateResult | undefined {
  const queries = queryClientInstance.getQueriesData<Record<string, EnrollmentsWidgetAggregateResult>>({
    queryKey: ENROLLMENTS_WIDGET_AGGREGATES_QUERY_KEY,
  });
  for (const [, aggregateByWidgetId] of queries) {
    if (aggregateByWidgetId?.[widgetId]) return aggregateByWidgetId[widgetId];
  }
  return undefined;
}

export function readEnrollmentsTotalFromMetrics(): number {
  const metrics = queryClientInstance.getQueryData<{ total: number }>(ENROLLMENTS_METRICS_QUERY_KEY);
  return metrics?.total ?? 0;
}

export function formatGenericWidgetValue(
  widget: CustomWidget,
  aggregate: { value: number; totalCount: number },
): { value: number; formattedValue: string; isAlert: boolean; totalCount: number } {
  let formattedValue = String(aggregate.value);
  if (widget.widgetType === "progress" || widget.operation === "percentage") {
    formattedValue = `${aggregate.value}%`;
  } else if (widget.collection === "finance_invoices" && widget.operation !== "count") {
    formattedValue = formatMoney(aggregate.value);
  } else {
    formattedValue = formatNumber(aggregate.value);
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

/**
 * Sync snapshot from TanStack Query cache for non-React consumers.
 * Prefer `useWidgetCollections()` in React trees — this helper never invents empty mirrors.
 */
