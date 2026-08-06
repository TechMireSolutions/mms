import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  type Student,
  resolveStudentStatuses,
  toMessagingRecipient,
} from "@mms/shared";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { getDirectoryPageSelection } from "@/lib/directorySelection";
import { studentStatusBadgeConfig } from "@/lib/students/studentStatusUi";
import { useTranslation } from "@/hooks/useTranslation";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";

type MessageChannel = "whatsapp" | "sms" | "email";

interface UseStudentListControllerOptions {
  students: Student[];
  selectedIds: string[];
  onSelectOne: (id: string) => void;
  onSelectAll: (pageIds: string[]) => void;
  isColumnVisible?: (key: string) => boolean;
  sortField: StudentListSortField | null;
  sortDir: "asc" | "desc";
  onSort: (field: StudentListSortField) => void;
}

export function useStudentListController({
  students,
  selectedIds,
  onSelectOne,
  onSelectAll,
  isColumnVisible,
  sortField,
  sortDir,
  onSort,
}: UseStudentListControllerOptions) {
  const { t } = useTranslation();
  const { statuses, isFieldEnabled } = useStudentConfig();
  const statusBadgeConfig = studentStatusBadgeConfig(t);
  const studentStatusOptions = resolveStudentStatuses(statuses);

  const resolveColumnVisible = (key: string): boolean => {
    if (isColumnVisible) return isColumnVisible(key);
    if (key === "dob") return isFieldEnabled("dob");
    if (key === "parents") return isFieldEnabled("contactRelationships");
    return true;
  };

  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
  const { allSelected, someSelected } = getDirectoryPageSelection(pageIds, selectedIds);

  const handleSelectAll = () => {
    onSelectAll(pageIds);
  };

  const openSelectionMessage = (channel: MessageChannel, targets: Student[]) => {
    openComposer(
      channel,
      targets.map((student) => toMessagingRecipient(student)),
    );
  };

  return {
    t,
    statusBadgeConfig,
    studentStatusOptions,
    isColumnVisible: resolveColumnVisible,
    isFieldEnabled,
    sortField,
    selectedIds,
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
    paginatedStudents: students,
    allSelected,
    someSelected,
    renderSortIcon,
    handleSort,
    handleSelectAll,
    handleSelectOne: onSelectOne,
  };
}
