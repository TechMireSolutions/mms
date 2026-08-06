import { useCallback, useEffect, useState } from "react";
import {
  toggleIdInSelection,
  togglePageIdsInSelection,
} from "@/lib/directorySelection";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";

/** Directory filters, sort, trash, and selection SSOT for Students Work (Contacts-shaped). */
export function useStudentsDirectoryFilters() {
  const [listPage, setListPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortField, setSortField] = useState<StudentListSortField | null>("grNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilterStatus, setStudentFilterStatus] = useState<string[]>([]);
  const [studentFilterGender, setStudentFilterGender] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setListPage(1);
  }, [studentSearch, studentFilterStatus, studentFilterGender, showDeleted, sortField, sortDir]);

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted]);

  const clearFilters = useCallback(() => {
    setStudentSearch("");
    setStudentFilterStatus([]);
    setStudentFilterGender("");
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const hasActiveFilters =
    Boolean(studentSearch.trim()) ||
    studentFilterStatus.length > 0 ||
    Boolean(studentFilterGender);

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
    setStudentFilterStatus((selectedStatuses) =>
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status)
        : [...selectedStatuses, status],
    );
  }, []);

  const toggleShowDeleted = useCallback(() => {
    setShowDeleted((previous) => !previous);
  }, []);

  return {
    listPage,
    setListPage,
    showDeleted,
    setShowDeleted,
    toggleShowDeleted,
    sortField,
    sortDir,
    handleServerSort,
    studentSearch,
    setStudentSearch,
    studentFilterStatus,
    setStudentFilterStatus,
    studentFilterGender,
    setStudentFilterGender,
    selectedIds,
    clearSelection,
    handleSelectOne,
    handleSelectAll,
    clearFilters,
    hasActiveFilters,
    toggleStudentStatus,
  };
}
