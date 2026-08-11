import { useQuery } from "@tanstack/react-query";
import {
  STUDENTS_MODULE_MANIFEST,
  type StudentDuplicateCheckInput,
  type StudentDuplicateReason,
  type StudentsCommandMetricsSnapshot,
  type StudentsWidgetAggregateResult,
  type StudentsWidgetQuery,
  studentsWidgetQueryFromWidget,
} from "@mms/shared";
import { useServerMetrics } from "@/hooks/useServerMetrics";
import { useAuth } from "@/lib/contexts/AuthContext";
import { apiJson } from "@/lib/apiClient";
import { createModuleWidgetAggregatesQuery } from "@/lib/query/createModuleWidgetAggregatesQuery";
import {
  STUDENTS_API,
  STUDENTS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
  type StudentNextGrNumberParams,
  type StudentsWidgetAggregateWidgetInput,
} from "@/tenant/features/students/hooks/studentsQueryKeys";

/** Fetches next sequential GR Number based on tenant settings and registration date. */
export function useStudentNextGrNumber(params: StudentNextGrNumberParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  const queryParams = new URLSearchParams();
  queryParams.set("registeredDate", params.registeredDate);
  if (params.template) queryParams.set("template", params.template);
  if (params.digits != null) queryParams.set("digits", String(params.digits));
  if (params.restartAnnually != null) {
    queryParams.set("restartAnnually", String(params.restartAnnually));
  }

  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, "next-gr-number", params] as const,
    queryFn: async ({ signal }) => {
      const nextGrNumberResponse = await apiJson<{ grNumber: string }>(
        `${STUDENTS_API}/next-gr-number?${queryParams.toString()}`,
        { signal },
      );
      return nextGrNumberResponse.grNumber;
    },
    enabled: isAuthenticated && enabled && Boolean(params.registeredDate),
    staleTime: 15_000,
  });
}

export async function checkStudentRegistrationDuplicate(
  input: StudentDuplicateCheckInput,
): Promise<StudentDuplicateReason | null> {
  const duplicateCheckResponse = await apiJson<{ reason: StudentDuplicateReason | null }>(
    `${STUDENTS_API}/duplicate-check`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return duplicateCheckResponse.reason;
}

export function useStudentsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<StudentsCommandMetricsSnapshot>({
    moduleId: STUDENTS_MODULE_MANIFEST.moduleId,
    apiPath: STUDENTS_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}

const buildStudentsWidgetAggregatesQuery = createModuleWidgetAggregatesQuery<
  StudentsWidgetQuery,
  StudentsWidgetAggregateResult
>({
  apiBase: STUDENTS_API,
  queryKey: STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
  collection: 'students',
  toWidgetQuery: studentsWidgetQueryFromWidget,
});

/** Computes server-authoritative widget aggregates for Students module analytics. */
export function useStudentsWidgetAggregates(
  widgets: StudentsWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  return useQuery(buildStudentsWidgetAggregatesQuery(widgets, isAuthenticated && enabled));
}

export type { StudentsWidgetAggregateWidgetInput, StudentNextGrNumberParams };
