import { useCallback, useMemo } from "react";
import { buildFacultyWorkFilterChips } from "@/tenant/features/faculty/components/buildFacultyWorkFilterChips";
import { computeFacultySelectionTargets } from "@/tenant/features/faculty/hooks/facultySelectionTargets";
import { useFacultyStatusConfig } from "@/tenant/features/faculty/hooks/useFacultyStatusConfig";
import { useTranslation } from "@/hooks/useTranslation";
import type { Faculty, FacultySortField } from "@mms/shared";
import type { FilterChip } from "@/components/ui/FilterChips";

export interface UseFacultyWorkTierActionsProps {
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  sortField: FacultySortField;
  sortDir: "asc" | "desc";
  onSortChange: (field: FacultySortField, dir: "asc" | "desc") => void;
  selectedIds: string[];
  faculty?: Faculty[];
  onBulkStatusChange?: (ids: string[], status: string) => void | Promise<void>;
  onBulkSpecializationChange?: (ids: string[], specialization: string) => void | Promise<void>;
  onClearSelection: () => void;
}

export interface UseFacultyWorkTierActionsReturn {
  filterChips: FilterChip[];
  statusConfig: ReturnType<typeof useFacultyStatusConfig>;
  selectionTargets: ReturnType<typeof computeFacultySelectionTargets>;
  handleBulkStatusChange: (status: string) => Promise<void>;
  handleBulkSpecializationChange: (specialization: string) => Promise<void>;
  handleSortFieldChange: (field: FacultySortField) => void;
}

export function useFacultyWorkTierActions(
  props: UseFacultyWorkTierActionsProps,
): UseFacultyWorkTierActionsReturn {
  const { t } = useTranslation();
  const {
    filterStatus,
    filterSpecialization,
    filterGender,
    onToggleStatus,
    onSpecializationChange,
    onGenderChange,
    sortField,
    sortDir,
    onSortChange,
    selectedIds,
    onBulkStatusChange,
    onBulkSpecializationChange,
    onClearSelection,
  } = props;

  const filterChips = useMemo(
    () =>
      buildFacultyWorkFilterChips({
        filterStatus,
        filterSpecialization,
        filterGender,
        onToggleStatus,
        onSpecializationChange,
        onGenderChange,
        t,
      }),
    [filterStatus, filterSpecialization, filterGender, onToggleStatus, onSpecializationChange, onGenderChange, t],
  );

  const statusConfig = useFacultyStatusConfig();

  const handleBulkStatusChange = useCallback(
    async (status: string): Promise<void> => {
      try {
        await onBulkStatusChange?.(selectedIds, status);
        onClearSelection();
      } catch {
        // Toast already emitted by the crud action; keep selection for retry.
      }
    },
    [onBulkStatusChange, selectedIds, onClearSelection],
  );

  const handleBulkSpecializationChange = useCallback(
    async (specialization: string): Promise<void> => {
      try {
        await onBulkSpecializationChange?.(selectedIds, specialization);
        onClearSelection();
      } catch {
        // Toast already emitted by the crud action; keep selection for retry.
      }
    },
    [onBulkSpecializationChange, selectedIds, onClearSelection],
  );

  const handleSortFieldChange = useCallback(
    (field: FacultySortField): void => {
      if (field === sortField) {
        onSortChange(field, sortDir === "asc" ? "desc" : "asc");
      } else {
        onSortChange(field, "asc");
      }
    },
    [sortField, sortDir, onSortChange],
  );

  const members = props.faculty ?? [];
  const selectionTargets = useMemo(
    () =>
      computeFacultySelectionTargets({
        selectedIds,
        workFaculty: members,
      }),
    [selectedIds, members],
  );

  return {
    filterChips,
    statusConfig,
    selectionTargets,
    handleBulkStatusChange,
    handleBulkSpecializationChange,
    handleSortFieldChange,
  };
}

