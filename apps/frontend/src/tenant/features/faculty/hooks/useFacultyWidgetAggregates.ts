import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiContract } from '@/lib/api';
import {
  facultyWidgetQueryFromWidget,
  teachersWidgetQueryFromWidget,
} from '@mms/shared';
import {
  FACULTY_WIDGET_AGGREGATES_QUERY_KEY,
  type FacultyWidgetAggregateWidgetInput,
} from '@/tenant/features/faculty/hooks/facultyQueryKeys';

const toWidgetQuery = facultyWidgetQueryFromWidget || teachersWidgetQueryFromWidget;

export function useFacultyWidgetAggregates(
  widgets: FacultyWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;

  const queries = widgets
    .filter((widget) => widget.collection === 'teachers' || widget.collection === 'faculty')
    .map((widget) => toWidgetQuery(widget));

  const querySignature = JSON.stringify(
    [...queries]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((query) => ({
        id: query.id,
        target: query.targetField,
        filter: query.filterValue,
        filterOperator: query.filterOperator,
        xAxis: query.xAxisField,
      })),
  );

  const query = useQuery({
    queryKey: [...FACULTY_WIDGET_AGGREGATES_QUERY_KEY, querySignature] as const,
    queryFn: async () => {
      const res = await apiContract.faculty.widgetAggregates({ body: { widgets: queries } });
      return (res.body as { results?: Record<string, { value?: number; totalCount?: number; chartData?: Array<{ name: string; value: number }> }> } | null)?.results ?? {};
    },
    enabled: isAuthenticated && enabled && queries.length > 0,
    staleTime: 30_000,
  });

  return { ...query, data: query.data ?? {} };
}

export const useTeachersWidgetAggregates = useFacultyWidgetAggregates;
