import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type Student } from "@mms/shared";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";

interface UseStudentListControllerOptions {
  students: Student[];
  onSelectOne: (id: string) => void;
  onSelectAll: (pageIds: string[]) => void;
  allSelected: boolean;
  someSelected: boolean;
  isColumnVisible?: (key: string) => boolean;
  sortField: StudentListSortField | null;
  sortDir: "asc" | "desc";
  onSort: (field: StudentListSortField) => void;
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
}

export function useStudentListController({
  students,
  onSelectOne,
  onSelectAll,
  allSelected,
  someSelected,
  isColumnVisible,
  sortField,
  sortDir,
  onSort,
  openComposer,
  canWriteMessaging,
}: UseStudentListControllerOptions) {
  const { t } = useTranslation();
  const { isFieldEnabled } = useStudentConfig();
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  const resolveColumnVisible = (key: string): boolean => {
    if (isColumnVisible) return isColumnVisible(key);
    if (key === "dob") return isFieldEnabled("dob");
    if (key === "parents") return isFieldEnabled("contactRelationships");
    return true;
  };

  const handleSort = (field: StudentListSortField) => {
    onSort(field);
  };

  const renderSortIcon = (field: StudentListSortField | null) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-25" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-primary transition-transform" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary transition-transform" />
    );
  };

  const pageIds = students.map((student) => String(student.id));

  const handleSelectAll = () => {
    onSelectAll(pageIds);
  };

  return {
    t,
    isColumnVisible: resolveColumnVisible,
    isFieldEnabled,
    sortField,
    viewStudent,
    setViewStudent,
    openComposer,
    canWriteMessaging,
    paginatedStudents: students,
    allSelected,
    someSelected,
    renderSortIcon,
    handleSort,
    handleSelectAll,
    handleSelectOne: onSelectOne,
  };
}
