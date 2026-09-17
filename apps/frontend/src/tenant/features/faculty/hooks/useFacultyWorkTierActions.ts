import { buildFacultyWorkFilterChips } from "@/tenant/features/faculty/components/buildFacultyWorkFilterChips";
import { computeFacultySelectionTargets } from "@/tenant/features/faculty/hooks/facultySelectionTargets";
import { useFacultyStatusConfig } from "@/tenant/features/faculty/hooks/useFacultyStatusConfig";
import { useTranslation } from "@/hooks/useTranslation";
import type { Faculty, FacultySortField, Teacher, TeacherSortField } from "@mms/shared";
import type { FilterChip } from "@/components/ui/FilterChips";

export interface UseFacultyWorkTierActionsProps {
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  sortField: FacultySortField | TeacherSortField;
  sortDir: "asc" | "desc";
  onSortChange: (field: FacultySortField, dir: "asc" | "desc") => void;
  selectedIds: string[];
  faculty?: Faculty[];
  teachers?: Teacher[];
  onBulkStatusChange?: (ids: string[], status: string) => void | Promise<void>;
  onBulkSpecializationChange?: (ids: string[], specialization: string) => void | Promise<void>;
  onClearSelection: () => void;
}
export type UseTeachersWorkTierActionsProps = UseFacultyWorkTierActionsProps;

export interface UseFacultyWorkTierActionsReturn {
  filterChips: FilterChip[];
  statusConfig: ReturnType<typeof useFacultyStatusConfig>;
  selectionTargets: ReturnType<typeof computeFacultySelectionTargets>;
  handleBulkStatusChange: (status: string) => Promise<void>;
  handleBulkSpecializationChange: (specialization: string) => Promise<void>;
  handleSortFieldChange: (field: FacultySortField) => void;
}
export type UseTeachersWorkTierActionsReturn = UseFacultyWorkTierActionsReturn;

export function useFacultyWorkTierActions(
  props: UseFacultyWorkTierActionsProps,
): UseFacultyWorkTierActionsReturn {
  const { t } = useTranslation();

  const filterChips = buildFacultyWorkFilterChips({
    filterStatus: props.filterStatus,
    filterSpecialization: props.filterSpecialization,
    filterGender: props.filterGender,
    onToggleStatus: props.onToggleStatus,
    onSpecializationChange: props.onSpecializationChange,
    onGenderChange: props.onGenderChange,
    t,
  });

  const statusConfig = useFacultyStatusConfig();

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

  const handleSortFieldChange = (field: FacultySortField): void => {
    if (field === props.sortField) {
      props.onSortChange(field, props.sortDir === "asc" ? "desc" : "asc");
    } else {
      props.onSortChange(field, "asc");
    }
  };

  const members = props.faculty ?? props.teachers ?? [];
  const selectionTargets = computeFacultySelectionTargets({
    selectedIds: props.selectedIds,
    workFaculty: members,
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

export const useTeachersWorkTierActions = useFacultyWorkTierActions;

