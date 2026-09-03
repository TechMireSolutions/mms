import { buildTeachersWorkFilterChips } from "@/tenant/features/teachers/components/buildTeachersWorkFilterChips";
import { computeTeachersSelectionTargets } from "@/tenant/features/teachers/hooks/teachersSelectionTargets";
import { useTeacherStatusConfig } from "@/tenant/features/teachers/hooks/useTeacherStatusConfig";
import { useTranslation } from "@/hooks/useTranslation";
import type { Teacher, TeacherSortField } from "@mms/shared";
import type { FilterChip } from "@/components/ui/FilterChips";

export interface UseTeachersWorkTierActionsProps {
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  sortField: TeacherSortField;
  sortDir: "asc" | "desc";
  onSortChange: (field: TeacherSortField, dir: "asc" | "desc") => void;
  selectedIds: string[];
  teachers: Teacher[];
  onBulkStatusChange?: (ids: string[], status: string) => void | Promise<void>;
  onBulkSpecializationChange?: (ids: string[], specialization: string) => void | Promise<void>;
  onClearSelection: () => void;
}

export interface UseTeachersWorkTierActionsReturn {
  filterChips: FilterChip[];
  statusConfig: ReturnType<typeof useTeacherStatusConfig>;
  selectionTargets: ReturnType<typeof computeTeachersSelectionTargets>;
  handleBulkStatusChange: (status: string) => Promise<void>;
  handleBulkSpecializationChange: (specialization: string) => Promise<void>;
  handleSortFieldChange: (field: TeacherSortField) => void;
}

export function useTeachersWorkTierActions(
  props: UseTeachersWorkTierActionsProps,
): UseTeachersWorkTierActionsReturn {
  const { t } = useTranslation();

  const filterChips = buildTeachersWorkFilterChips({
    filterStatus: props.filterStatus,
    filterSpecialization: props.filterSpecialization,
    filterGender: props.filterGender,
    onToggleStatus: props.onToggleStatus,
    onSpecializationChange: props.onSpecializationChange,
    onGenderChange: props.onGenderChange,
    t,
  });

  const statusConfig = useTeacherStatusConfig();

  const handleBulkStatusChange = async (status: string): Promise<void> => {
    try {
      await props.onBulkStatusChange?.(props.selectedIds, status);
      props.onClearSelection();
    } catch {
      // Toast already emitted by the crud action; keep selection for retry.
    }
  };

  const handleBulkSpecializationChange = async (specialization: string): Promise<void> => {
    try {
      await props.onBulkSpecializationChange?.(props.selectedIds, specialization);
      props.onClearSelection();
    } catch {
      // Toast already emitted by the crud action; keep selection for retry.
    }
  };

  const handleSortFieldChange = (field: TeacherSortField): void => {
    if (field === props.sortField) {
      props.onSortChange(field, props.sortDir === "asc" ? "desc" : "asc");
    } else {
      props.onSortChange(field, "asc");
    }
  };

  const selectionTargets = computeTeachersSelectionTargets({
    selectedIds: props.selectedIds,
    workTeachers: props.teachers,
  });

  return {
    filterChips,
    statusConfig,
    selectionTargets,
    handleBulkStatusChange,
    handleBulkSpecializationChange,
    handleSortFieldChange,
  };
}
