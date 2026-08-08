import { BookOpen, Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModuleWorkListStateShell } from "@/components/ui/ModuleWorkListStateShell";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { SessionSortField } from "@/tenant/features/sessions/components/sessionPageTypes";
import type { Session } from "@/lib/data/sessionsData";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { SessionsBulkActionBar } from "@/tenant/features/sessions/components/SessionsBulkActionBar";
import { SessionsWorkCardGrid, SessionsWorkTable } from "@/tenant/features/sessions/components/SessionsWorkListViews";

interface SessionsWorkPageData {
  page: number;
  total: number;
  limit: number;
  hasMore: boolean;
}

interface SessionsWorkColumnLayout {
  getColumnWidth: (key: string) => number | undefined;
  setColumnWidth: (key: string, width: number) => void;
}

interface SessionsWorkListProps {
  sessions: Session[];
  workPageData?: SessionsWorkPageData;
  isError: boolean;
  isWorkLoading: boolean;
  isWorkFetching: boolean;
  useServerWork: boolean;
  viewMode: WorkDirectoryViewMode;
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canSelectSessions: boolean;
  selectedIds: string[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  isColumnVisible: (key: string) => boolean;
  sortField: SessionSortField;
  sortDir: "asc" | "desc";
  columnLayout: SessionsWorkColumnLayout;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
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
  onClearSelection: () => void;
  onPageChange: (page: number) => void;
  canExport?: boolean;
  onBulkExport?: () => void;
}

export function SessionsWorkList({
  sessions,
  workPageData,
  isError,
  isWorkLoading,
  isWorkFetching,
  useServerWork,
  viewMode,
  showDeleted,
  canWrite,
  canDelete,
  canSelectSessions,
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  isColumnVisible,
  sortField,
  sortDir,
  columnLayout,
  statusConfig,
  typeConfig,
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
  onClearSelection,
  onPageChange,
  canExport = false,
  onBulkExport,
}: SessionsWorkListProps) {
  const { t } = useTranslation();

  return (
    <>
      <SessionsBulkActionBar
        selectedCount={selectedIds.length}
        showDeleted={showDeleted}
        canDelete={canDelete}
        canExport={canExport}
        onRequestBulkDelete={onRequestBulkDelete}
        onRequestBulkRestore={onRequestBulkRestore}
        onClearSelection={onClearSelection}
        onBulkExport={onBulkExport}
      />

      <ModuleWorkListStateShell
        isError={isError}
        isLoading={isWorkLoading}
        isFetching={isWorkFetching}
        onRetry={onRetry}
        errorTitle={t("sessions.loadFailed")}
        errorHint={t("sessions.loadFailedHint")}
        viewMode={viewMode}
        skeletonColumnCount={viewMode === "table" ? 6 : 3}
        useServerWork={useServerWork}
        pageData={workPageData}
        onPageChange={onPageChange}
        i18nNamespace="sessions"
        showPagination={sessions.length > 0}
        loadingLabel={t("common.loading")}
      >
        {sessions.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={showDeleted ? t("sessions.empty.trashTitle") : t("sessions.empty.title")}
            description={showDeleted ? t("sessions.empty.trashSubtitle") : t("sessions.empty.subtitle")}
            action={!showDeleted && canWrite ? (
              <ActionButton variant="primary" icon={Plus} onClick={onCreateSession}>
                {t("sessions.action.new")}
              </ActionButton>
            ) : undefined}
          />
        ) : viewMode === "table" ? (
          <SessionsWorkTable
            sessions={sessions}
            showDeleted={showDeleted}
            canDelete={canDelete}
            canSelectSessions={canSelectSessions}
            selectedIds={selectedIds}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            isColumnVisible={isColumnVisible}
            sortField={sortField}
            sortDir={sortDir}
            columnLayout={columnLayout}
            statusConfig={statusConfig}
            typeConfig={typeConfig}
            onOpenDetail={onOpenDetail}
            onSort={onSort}
            onToggleSelectAll={onToggleSelectAll}
            onToggleSelectedSession={onToggleSelectedSession}
            onRequestDelete={onRequestDelete}
            onRestore={onRestore}
          />
        ) : (
          <SessionsWorkCardGrid
            sessions={sessions}
            showDeleted={showDeleted}
            canDelete={canDelete}
            statusConfig={statusConfig}
            typeConfig={typeConfig}
            onOpenDetail={onOpenDetail}
            onRequestDelete={onRequestDelete}
            onRestore={onRestore}
          />
        )}
      </ModuleWorkListStateShell>
    </>
  );
}
