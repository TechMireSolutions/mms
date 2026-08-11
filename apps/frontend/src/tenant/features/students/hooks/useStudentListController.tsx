import { type Student } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";

interface UseStudentListControllerOptions {
  students: Student[];
  onSelectOne: (id: string) => void;
  onSelectAll: (pageIds: string[]) => void;
  allSelected: boolean;
  someSelected: boolean;
  isColumnVisible: (key: string) => boolean;
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
  onSort,
  openComposer,
  canWriteMessaging,
}: UseStudentListControllerOptions) {
  const { t } = useTranslation();

  const handleSort = (field: StudentListSortField) => {
    onSort(field);
  };

  const pageIds = students.map((student) => String(student.id));

  const handleSelectAll = () => {
    onSelectAll(pageIds);
  };

  return {
    t,
    isColumnVisible,
    openComposer,
    canWriteMessaging,
    paginatedStudents: students,
    allSelected,
    someSelected,
    handleSort,
    handleSelectAll,
    handleSelectOne: onSelectOne,
  };
}
