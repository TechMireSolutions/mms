import {
  resolveFacultyDesignations,
  resolveFacultySpecializations,
  resolveFacultyStatuses,
  resolveTeacherDesignations,
  resolveTeacherSpecializations,
  resolveTeacherStatuses,
} from "@mms/shared";
import { useFacultyConfig, useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { facultyStatusBadgeConfig } from "@/lib/faculty/facultyStatusUi";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";

const resolveStatuses = resolveFacultyStatuses || resolveTeacherStatuses;
const resolveSpecs = resolveFacultySpecializations || resolveTeacherSpecializations;
const resolveDesignations = resolveFacultyDesignations || resolveTeacherDesignations;
const useFacultyConfigHook = useFacultyConfig || useTeacherConfig;

/**
 * SSOT for the faculty StatusBadge config, derived from the tenant's configured statuses.
 * Consolidates the repeated `facultyStatusBadgeConfig(t, statuses)` across list, form, and detail.
 */
export function useFacultyStatusConfig(): Record<string, StatusBadgeConfigItem> {
  const { t } = useTranslation();
  const { statuses } = useFacultyConfigHook();
  return (() => facultyStatusBadgeConfig(t, statuses))();
}
export const useTeacherStatusConfig = useFacultyStatusConfig;

/**
 * SSOT for faculty status, specialization, and designation option lists, derived from the tenant's
 * configured lookups. Consolidates the repeated option derivations across the module.
 */
export function useFacultyLookupOptions(): {
  statusOptions: string[];
  specializationOptions: string[];
  designationOptions: string[];
} {
  const { statuses, specializations, designations } = useFacultyConfigHook();
  return (() => ({
    statusOptions: [...resolveStatuses(statuses)],
    specializationOptions: [...resolveSpecs(specializations)],
    designationOptions: [...resolveDesignations(designations)],
  }))();
}
export const useTeacherLookupOptions = useFacultyLookupOptions;
