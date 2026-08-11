import type { ModuleColumnRegistryEntry, Student, toMessagingRecipient } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";

export type StudentListSortField =
  | "name"
  | "grNumber"
  | "status"
  | "gender"
  | "registeredDate"
  | "dob";

export interface StudentListSession {
  id: string;
  name: string;
}

export type StudentListMessagingRecipient = ReturnType<typeof toMessagingRecipient>;

interface StudentListSelectionProps {
  selectedIds: string[];
  viewingDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging?: boolean;
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
  /** Work column prefs — call in leaves (no show* fans). */
  isColumnVisible: (key: string) => boolean;
  /** Tenant Work column registry (system + custom:*). */
  columnRegistry: ModuleColumnRegistryEntry[];
  onSelectOne: (id: string) => void;
  onViewStudent: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string, deletionReason?: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
}

export interface StudentListCardsProps extends StudentListSelectionProps {
  paginatedStudents: Student[];
  sessions: StudentListSession[];
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: () => void;
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
  sortField: StudentListSortField | null;
  sortDir: "asc" | "desc";
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
}
