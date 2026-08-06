import type { MouseEvent, ReactNode } from "react";
import type { Student, toMessagingRecipient } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";

export type StudentListSortField = "name" | "age" | "fatherName" | "status" | "grNumber";

export interface StudentListSession {
  id: string;
  name: string;
}

export type StudentListMessagingRecipient = ReturnType<typeof toMessagingRecipient>;

interface StudentListSelectionProps {
  selectedIds: string[];
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging?: boolean;
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
  isFieldEnabled: (key: string) => boolean;
  onSelectOne: (id: string) => void;
  onRowClick: (event: MouseEvent, student: Student) => void;
  onViewStudent: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string, deletionReason?: string) => void;
  onRestore?: (id: string) => void | Promise<void>;
}

export interface StudentListCardsProps extends StudentListSelectionProps {
  paginatedStudents: Student[];
  showParents: boolean;
  onOpenComposer?: (
    mode: "whatsapp" | "sms" | "email",
    recipients: StudentListMessagingRecipient[],
  ) => void;
}

export interface StudentListTableProps extends StudentListSelectionProps {
  paginatedStudents: Student[];
  sessions: StudentListSession[];
  allSelected: boolean;
  someSelected: boolean;
  showDob: boolean;
  showParents: boolean;
  showSessions: boolean;
  showStatus: boolean;
  renderSortIcon: (field: StudentListSortField | null) => ReactNode;
  onSort: (field: StudentListSortField) => void;
  onSelectAll: () => void;
  onOpenComposer: (
    mode: "whatsapp" | "sms" | "email",
    recipients: StudentListMessagingRecipient[],
  ) => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export interface StudentListContentProps extends StudentListTableProps {
  students: Student[];
  viewMode: WorkDirectoryViewMode;
  currentPage: number;
  pageSize: number;
  hasServerPagination: boolean;
  onPageChange: (page: number) => void;
}
