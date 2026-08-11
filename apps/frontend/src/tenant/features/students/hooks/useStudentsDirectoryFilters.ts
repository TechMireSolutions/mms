import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  toggleIdInSelection,
  togglePageIdsInSelection,
} from "@/lib/directorySelection";
import {
  isStudentsQuickFilter,
  type StudentsQuickFilter,
} from "@mms/shared";
import {
  STUDENTS_WORK_DRILLDOWN_EVENT,
  consumeStudentsWorkDrillDown,
  type StudentsWorkDrillDown,
} from "@/tenant/features/students/hooks/studentsWorkDrillDown";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";

/** Directory filters, sort, trash, and selection SSOT for Students Work (Contacts-shaped). */
export function useStudentsDirectoryFilters({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) {
  const [listPage, setListPage] = useState(1);
  const [viewingDeleted, setViewingDeleted] = useState(false);
  const [sortField, setSortField] = useState<StudentListSortField | null>("grNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [studentSearch, setStudentSearch] = useState("");
  const debouncedSearch = useDebounce(studentSearch, 250);
  const [studentFilterStatus, setStudentFilterStatus] = useState<string[]>([]);
  const [studentFilterGender, setStudentFilterGender] = useState("");
  const [quickFilter, setQuickFilter] = useState<StudentsQuickFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setListPage(1);
  }, [
    debouncedSearch,
    studentFilterStatus,
    studentFilterGender,
    quickFilter,
    viewingDeleted,
    sortField,
    sortDir,
  ]);

  useEffect(() => {
    setSelectedIds([]);
  }, [viewingDeleted]);

  const applyDrillDown = useCallback(
    (filter: StudentsWorkDrillDown) => {
      setQuickFilter("all");
      if (filter.status) setStudentFilterStatus([filter.status]);
      setActiveTab("work");
    },
    [setActiveTab],
  );

  useEffect(() => {
    const pending = consumeStudentsWorkDrillDown();
    if (pending) applyDrillDown(pending);

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<StudentsWorkDrillDown>).detail;
      if (detail) applyDrillDown(detail);
    };
    window.addEventListener(STUDENTS_WORK_DRILLDOWN_EVENT, handler);
    return () => window.removeEventListener(STUDENTS_WORK_DRILLDOWN_EVENT, handler);
  }, [applyDrillDown]);

  const changeQuickFilter = useCallback((preset: string) => {
    if (!isStudentsQuickFilter(preset)) return;
    // Status presets express status via the preset; clear the overlapping status filter.
    setStudentFilterStatus([]);
    setQuickFilter(preset);
  }, []);

  const clearFilters = useCallback(() => {
    setStudentSearch("");
    setStudentFilterStatus([]);
    setStudentFilterGender("");
    setQuickFilter("all");
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const hasActiveFilters =
    Boolean(studentSearch.trim()) ||
    studentFilterStatus.length > 0 ||
    Boolean(studentFilterGender) ||
    quickFilter !== "all";

  const activeFilterCount =
    studentFilterStatus.length +
    (studentFilterGender ? 1 : 0) +
    (studentSearch.trim() ? 1 : 0) +
    (quickFilter !== "all" ? 1 : 0);

  const handleServerSort = useCallback(
    (field: StudentListSortField) => {
      if (sortField === field) {
        setSortDir((currentDir) => (currentDir === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField],
  );

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((current) => toggleIdInSelection(current, id));
  }, []);

  const handleSelectAll = useCallback((pageIds: string[]) => {
    setSelectedIds((current) => togglePageIdsInSelection(current, pageIds));
  }, []);

  const toggleStudentStatus = useCallback((status: string) => {
    // Manual status selection supersedes any quick-filter preset.
    setQuickFilter("all");
    setStudentFilterStatus((selectedStatuses) =>
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status)
        : [...selectedStatuses, status],
    );
  }, []);

  const toggleViewingDeleted = useCallback(() => {
    setViewingDeleted((previous) => !previous);
  }, []);

  return {
    listPage,
    setListPage,
    viewingDeleted,
    toggleViewingDeleted,
    sortField,
    sortDir,
    handleServerSort,
    studentSearch,
    setStudentSearch,
    debouncedSearch,
    studentFilterStatus,
    studentFilterGender,
    setStudentFilterGender,
    quickFilter,
    changeQuickFilter,
    selectedIds,
    clearSelection,
    handleSelectOne,
    handleSelectAll,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    toggleStudentStatus,
  };
}
