import type { ComponentProps } from "react";
import type { Contact, ContactsQuickFilter } from "@mms/shared";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import type ContactCards from "@/tenant/features/contacts/components/ContactCards";
import type ContactsTable from "@/tenant/features/contacts/components/ContactsTable";

export type ContactsWorkDirectoryColumn = {
  id: string;
  label: string;
  sortField?: string;
  width?: number;
};

export type ContactsWorkViewMode = WorkDirectoryViewMode;

export interface ContactsWorkDirectoryProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterGender: string;
  onGenderChange: (value: string) => void;
  quickFilter: ContactsQuickFilter;
  onQuickFilterChange: (value: ContactsQuickFilter) => void;
  sortField: string;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
  viewingDeleted: boolean;
  onShowDeletedChange: (next: boolean) => void;
  canViewDeleted: boolean;
  viewMode: ContactsWorkViewMode;
  onViewModeChange: (mode: ContactsWorkViewMode) => void;
  shownCount: number;
  selected: Array<string | number>;
  onClearSelection: () => void;
  selectedTargets: {
    waTargets: Contact[];
    smsReady: Contact[];
  };
  bulkActions: readonly string[];
  canWriteMessaging: boolean;
  canExport: boolean;
  canDelete: boolean;
  canWrite: boolean;
  onWhatsApp: (targets: Contact[]) => void;
  onSms: (targets: Contact[]) => void;
  onBulkExport: () => void;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  isWorkError: boolean;
  isWorkLoading: boolean;
  isWorkFetching: boolean;
  onRetryWork: () => void;
  workContacts: Contact[];
  tableColumns: ContactsWorkDirectoryColumn[];
  commonDirectoryProps: ComponentProps<typeof ContactCards>;
  tableProps: ComponentProps<typeof ContactsTable>;
  useServerWork: boolean;
  workPageData?: { page: number; total: number; limit: number; hasMore: boolean } | null;
  onPageChange: (page: number) => void;
}
