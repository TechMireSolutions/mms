import { motion } from "framer-motion";
import type { SessionsListPageResult } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { Session } from "@/lib/data/sessionsData";
import { SessionsWorkFilters } from "@/tenant/features/sessions/components/SessionsWorkFilters";
import { SessionsWorkList } from "@/tenant/features/sessions/components/SessionsWorkList";
import type { SessionSortField, SessionStatus, SessionType } from "@/tenant/features/sessions/components/sessionPageTypes";

interface SessionsColumnLayout {
  isColumnVisible: (key: string) => boolean;
  getColumnWidth: (key: string) => number | undefined;
  setColumnWidth: (key: string, width: number) => void;
  columnRegistry: Parameters<typeof SessionsWorkFilters>[0]["columnLayout"]["columnRegistry"];
  updateUserColumnLayout: Parameters<typeof SessionsWorkFilters>[0]["columnLayout"]["updateUserColumnLayout"];
  customizerLabels: Parameters<typeof SessionsWorkFilters>[0]["columnLayout"]["customizerLabels"];
}

interface SessionsWorkTierProps {
  search: string;
  filterStatus: SessionStatus[];
  filterType: SessionType[];
  statusOptions: string[];
  typeOptions: string[];
  statusLabels: Record<string, string>;
  typeLabels: Record<string, string>;
  listLayout: boolean;
  columnLayout: SessionsColumnLayout;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  sessions: Session[];
  workPageData?: SessionsListPageResult;
  isError: boolean;
  isWorkLoading: boolean;
  isWorkFetching: boolean;
  useServerWork: boolean;
  canSelectSessions: boolean;
  selectedIds: string[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  sortField: SessionSortField;
  sortDir: "asc" | "desc";
  statusConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
  onSearchChange: (value: string) => void;
  onStatusFilterToggle: (status: SessionStatus) => void;
  onTypeFilterToggle: (type: SessionType) => void;
  onClearFilters: () => void;
  onToggleDeleted: () => void;
  onRetry: () => void;
  onCreateSession: () => void;
  onOpenDetail: (session: Session) => void;
  onSort: (field: SessionSortField) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectedSession: (id: string, checked: boolean) => void;
  onRequestDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onPageChange: (page: number) => void;
}

export function SessionsWorkTier({
  search,
  filterStatus,
  filterType,
  statusOptions,
  typeOptions,
  statusLabels,
  typeLabels,
  listLayout,
  columnLayout,
  canWrite,
  canDelete,
  showDeleted,
  sessions,
  workPageData,
  isError,
  isWorkLoading,
  isWorkFetching,
  useServerWork,
  canSelectSessions,
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  sortField,
  sortDir,
  statusConfig,
  typeConfig,
  onSearchChange,
  onStatusFilterToggle,
  onTypeFilterToggle,
  onClearFilters,
  onToggleDeleted,
  onRetry,
  onCreateSession,
  onOpenDetail,
  onSort,
  onToggleSelectAll,
  onToggleSelectedSession,
  onRequestDelete,
  onRestore,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onPageChange,
}: SessionsWorkTierProps): React.JSX.Element {
  return (
    <motion.div
      key="work"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      <SessionsWorkFilters
        search={search}
        onSearchChange={onSearchChange}
        filterStatus={filterStatus}
        filterType={filterType}
        statusOptions={statusOptions}
        typeOptions={typeOptions}
        statusLabels={statusLabels}
        typeLabels={typeLabels}
        listLayout={listLayout}
        columnLayout={columnLayout}
        canDelete={canDelete}
        showDeleted={showDeleted}
        onStatusFilterToggle={onStatusFilterToggle}
        onTypeFilterToggle={onTypeFilterToggle}
        onClearFilters={onClearFilters}
        onToggleDeleted={onToggleDeleted}
      />

      <SessionsWorkList
        sessions={sessions}
        workPageData={useServerWork ? workPageData : undefined}
        isError={isError}
        isWorkLoading={isWorkLoading}
        isWorkFetching={useServerWork && isWorkFetching}
        listLayout={listLayout}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        canSelectSessions={canSelectSessions}
        selectedIds={selectedIds}
        allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
        showName={columnLayout.isColumnVisible("name")}
        showType={columnLayout.isColumnVisible("type")}
        showDuration={columnLayout.isColumnVisible("duration")}
        showFee={columnLayout.isColumnVisible("fee")}
        showEnrolled={columnLayout.isColumnVisible("enrolled")}
        showStatus={columnLayout.isColumnVisible("status")}
        sortField={sortField}
        sortDir={sortDir}
        columnLayout={columnLayout}
        statusConfig={statusConfig}
        typeConfig={typeConfig}
        onRetry={onRetry}
        onCreateSession={onCreateSession}
        onOpenDetail={onOpenDetail}
        onSort={onSort}
        onToggleSelectAll={onToggleSelectAll}
        onToggleSelectedSession={onToggleSelectedSession}
        onRequestDelete={onRequestDelete}
        onRestore={onRestore}
        onRequestBulkDelete={onRequestBulkDelete}
        onRequestBulkRestore={onRequestBulkRestore}
        onPageChange={onPageChange}
      />
    </motion.div>
  );
}
