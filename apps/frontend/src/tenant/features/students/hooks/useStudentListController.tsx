import { useState, useMemo, useEffect, type MouseEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type Student, resolveStudentStatuses, toMessagingRecipient } from "@mms/shared";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { studentStatusBadgeConfig } from "@/lib/students/studentStatusUi";
import { useTranslation } from '@/hooks/useTranslation';
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";

type MessageChannel = "whatsapp" | "sms" | "email";

interface UseStudentListControllerOptions {
  students: Student[];
  showDeleted?: boolean;
  isColumnVisible?: (key: string) => boolean;
  serverPagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  /** When set with server pagination, header sort is lifted to the list query. */
  serverSort?: {
    sortField: StudentListSortField | null;
    sortDir: "asc" | "desc";
    onSort: (field: StudentListSortField) => void;
  };
}

export function useStudentListController({
  students,
  showDeleted = false,
  isColumnVisible,
  serverPagination,
  serverSort,
}: UseStudentListControllerOptions) {
  const { t } = useTranslation();
  const { statuses, isFieldEnabled } = useStudentConfig();
  const statusBadgeConfig = useMemo(() => studentStatusBadgeConfig(t), [t]);
  const studentStatusOptions = useMemo(() => resolveStudentStatuses(statuses), [statuses]);

  const showDob = isColumnVisible
    ? isColumnVisible("dob")
    : isFieldEnabled("dob");
  const showParents = isColumnVisible
    ? isColumnVisible("parents")
    : isFieldEnabled("contactRelationships");
  const showSessions = isColumnVisible ? isColumnVisible("sessions") : true;
  const showStatus = isColumnVisible ? isColumnVisible("status") : true;

  const [localSortField, setLocalSortField] = useState<StudentListSortField | null>("grNumber");
  const [localSortDir, setLocalSortDir] = useState<"asc" | "desc">("desc");
  const sortField = serverSort?.sortField ?? localSortField;
  const sortDir = serverSort?.sortDir ?? localSortDir;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [students.length, pageSize, showDeleted]);

  const handleSort = (field: NonNullable<typeof sortField>) => {
    if (serverSort) {
      serverSort.onSort(field);
      return;
    }
    if (localSortField === field) {
      setLocalSortDir((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
    } else {
      setLocalSortField(field);
      setLocalSortDir("asc");
    }
  };

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-25" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-primary transition-transform" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary transition-transform" />
    );
  };

  const sortedStudents = useMemo(() => {
    // Server pagination already applies sortField/sortDir — do not re-sort the page.
    if (serverPagination || !sortField) return students;

    return [...students].sort((firstStudent, secondStudent) => {
      let firstSortValue = "";
      let secondSortValue = "";

      if (sortField === "name") {
        firstSortValue = (firstStudent.name || "").toLowerCase();
        secondSortValue = (secondStudent.name || "").toLowerCase();
      } else if (sortField === "age") {
        firstSortValue = firstStudent.dob || "";
        secondSortValue = secondStudent.dob || "";
        const firstDate = firstSortValue ? new Date(firstSortValue).getTime() : 0;
        const secondDate = secondSortValue ? new Date(secondSortValue).getTime() : 0;
        return sortDir === "asc" ? secondDate - firstDate : firstDate - secondDate;
      } else if (sortField === "fatherName") {
        firstSortValue = (firstStudent.fatherName || firstStudent.guardianName || "").toLowerCase();
        secondSortValue = (secondStudent.fatherName || secondStudent.guardianName || "").toLowerCase();
      } else if (sortField === "status") {
        firstSortValue = (firstStudent.status || "").toLowerCase();
        secondSortValue = (secondStudent.status || "").toLowerCase();
      } else if (sortField === "grNumber") {
        firstSortValue = firstStudent.grNumber || "";
        secondSortValue = secondStudent.grNumber || "";
      }

      if (firstSortValue < secondSortValue) return sortDir === "asc" ? -1 : 1;
      if (firstSortValue > secondSortValue) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [students, sortField, sortDir, serverPagination]);

  const paginatedStudents = useMemo(() => {
    if (serverPagination) return sortedStudents;
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage, pageSize, serverPagination]);

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map((student) => String(student.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((previousSelectedIds) =>
      previousSelectedIds.includes(id) ? previousSelectedIds.filter((selectedId) => selectedId !== id) : [...previousSelectedIds, id]
    );
  };

  const handleRowClick = (event: MouseEvent, student: Student) => {
    const target = event.target as HTMLElement;
    if (
      target.closest("input[type='checkbox']") ||
      target.closest("button") ||
      target.closest("[role='menuitem']")
    ) {
      return;
    }
    setViewStudent(student);
  };

  const allSelected = paginatedStudents.length > 0 && selectedIds.length === paginatedStudents.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < paginatedStudents.length;
  const selectedStudents = students.filter((student) => selectedIds.includes(String(student.id)));

  const openSelectionMessage = (channel: MessageChannel) => {
    const recipients =
      channel === "email"
        ? selectedStudents
            .filter((student) => student.email)
            .map((student) => toMessagingRecipient(student))
        : selectedStudents.map((student) => toMessagingRecipient(student));
    openComposer(channel, recipients);
  };

  return {
    t,
    statusBadgeConfig,
    studentStatusOptions,
    showDob,
    showParents,
    showSessions,
    showStatus,
    isFieldEnabled,
    sortField,
    selectedIds,
    setSelectedIds,
    currentPage,
    setCurrentPage,
    pageSize,
    viewStudent,
    setViewStudent,
    messagingTarget,
    openComposer,
    openSelectionMessage,
    closeComposer,
    canWriteMessaging,
    confirmBulkDeleteOpen,
    setConfirmBulkDeleteOpen,
    confirmBulkRestoreOpen,
    setConfirmBulkRestoreOpen,
    pendingDeleteId,
    setPendingDeleteId,
    paginatedStudents,
    allSelected,
    someSelected,
    selectedStudents,
    renderSortIcon,
    handleSort,
    handleSelectAll,
    handleSelectOne,
    handleRowClick,
  };
}
