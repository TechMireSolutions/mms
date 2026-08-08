import { useMemo } from "react";
import { resolveTeacherSpecializations, resolveTeacherStatuses } from "@mms/shared";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { teacherStatusBadgeConfig } from "@/lib/teachers/teacherStatusUi";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";

/**
 * SSOT for the teacher StatusBadge config, derived from the tenant's configured statuses.
 * Consolidates the repeated `useMemo(() => teacherStatusBadgeConfig(t, statuses), [...])`
 * across list state, form controller, and detail drawer.
 */
export function useTeacherStatusConfig(): Record<string, StatusBadgeConfigItem> {
  const { t } = useTranslation();
  const { statuses } = useTeacherConfig();
  return useMemo(() => teacherStatusBadgeConfig(t, statuses), [statuses, t]);
}

/**
 * SSOT for teacher status + specialization option lists, derived from the tenant's
 * configured lookups. Consolidates the repeated `[...resolveTeacherXxx(...)]` derivations
 * across the page controller, form controller, and settings.
 */
export function useTeacherLookupOptions(): {
  statusOptions: string[];
  specializationOptions: string[];
} {
  const { statuses, specializations } = useTeacherConfig();
  return useMemo(
    () => ({
      statusOptions: [...resolveTeacherStatuses(statuses)],
      specializationOptions: [...resolveTeacherSpecializations(specializations)],
    }),
    [statuses, specializations],
  );
}

