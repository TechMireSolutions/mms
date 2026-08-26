import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { useMemo } from 'react';
import type { WidgetQuery, WidgetAggregateResult } from '@mms/shared';

export interface DynamicWidgetInput {
  id: string;
  collection: string;
  operation: WidgetQuery['operation'];
  targetField?: string;
  filterField?: string;
  filterOperator?: WidgetQuery['filterOperator'];
  filterValue?: string;
  xAxisField?: string;
  chartLimit?: number;
}

const COLLECTION_TO_API_PATH: Record<string, string> = {
  contacts: '/api/contacts/widget-aggregates',
  students: '/api/students/widget-aggregates',
  teachers: '/api/teachers/widget-aggregates',
  sessions: '/api/sessions/widget-aggregates',
  enrollments: '/api/enrollments/widget-aggregates',
  finance_invoices: '/api/finance/widget-aggregates',
  attendance_records: '/api/attendance/widget-aggregates',
  hasanat_distributions: '/api/hasanat/widget-aggregates',
  questions: '/api/question-bank/widget-aggregates',
  tests: '/api/question-bank/widget-aggregates',
  assessment_results: '/api/question-bank/widget-aggregates',
  exams: '/api/examinations/widget-aggregates',
  exam_results: '/api/examinations/widget-aggregates',
};

export function useModuleWidgetAggregates(
  widgets: DynamicWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;

  const groupedWidgets = useMemo(() => {
    const groups: Record<string, WidgetQuery[]> = {};
    for (const widget of widgets) {
      const apiPath = COLLECTION_TO_API_PATH[widget.collection];
      if (!apiPath) continue;
      if (!groups[apiPath]) groups[apiPath] = [];
      groups[apiPath].push({
        id: widget.id,
        operation: widget.operation,
        targetField: widget.targetField,
        filterField: widget.filterField,
        filterOperator: widget.filterOperator,
        filterValue: widget.filterValue,
        xAxisField: widget.xAxisField,
        chartLimit: widget.chartLimit,
      });
    }
    return groups;
  }, [widgets]);

  const querySignature = useMemo(() => {
    return JSON.stringify(
      widgets
        .map((w) => ({
          id: w.id,
          col: w.collection,
          op: w.operation,
          tf: w.targetField,
          ff: w.filterField,
          fo: w.filterOperator,
          fv: w.filterValue,
        }))
        .sort((a, b) => a.id.localeCompare(b.id))
    );
  }, [widgets]);

  const query = useQuery({
    queryKey: ['dynamic_widget_aggregates', querySignature] as const,
    queryFn: async ({ signal }) => {
      const results: Record<string, WidgetAggregateResult> = {};
      
      const responses = await Promise.all(
        Object.entries(groupedWidgets).map(async ([path, reqWidgets]) => {
          try {
            const data = await apiJson<Record<string, WidgetAggregateResult>>(path, {
              method: 'POST',
              body: JSON.stringify({ widgets: reqWidgets }),
              signal,
            });
            return data || {};
          } catch (e) {
            console.error(`Failed to load widget aggregates from ${path}`, e);
            return {};
          }
        })
      );
      
      responses.forEach((res) => Object.assign(results, res));
      return results;
    },
    enabled: isAuthenticated && enabled && widgets.length > 0,
    staleTime: 30_000,
  });

  return { ...query, data: query.data ?? {} };
}
