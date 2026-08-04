import { Archive, BookOpen, Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/button";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import { BulkSelectionRestoreAction } from "@/components/ui/BulkSelectionActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListPagination } from "@/components/ui/ListPagination";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { SessionSortField } from "@/tenant/features/sessions/components/sessionPageTypes";
import type { Session } from "@/lib/data/sessionsData";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
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
  onPageChange: (page: number) => void;
}

export function SessionsWorkList({
  sessions,
  workPageData,
  isError,
  isWorkLoading,
  isWorkFetching,
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
  onPageChange,
}: SessionsWorkListProps) {
  const { t } = useTranslation();

  return (
    <>
      <BulkSelectionBar
        placement="floating"
        selectedCount={selectedIds.length}
        countLabel={t("sessions.selectedCount", { count: selectedIds.length })}
      >
        {showDeleted ? (
          <BulkSelectionRestoreAction
            label={t("sessions.restore")}
            onClick={onRequestBulkRestore}
          />
        ) : (
          <Button
            type="button"
            variant="destructive"
            onClick={onRequestBulkDelete}
            className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors min-h-11"
          >
            <Archive className="w-3.5 h-3.5" /> {t("sessions.archive")}
          </Button>
        )}
      </BulkSelectionBar>

      {isError ? (
        <ErrorState
          title={t("sessions.loadFailed")}
          description={t("sessions.loadFailedHint")}
          onRetry={onRetry}
        />
      ) : isWorkLoading ? (
        <TableSkeleton rows={6} cols={viewMode === 'table' ? 6 : 3} />
      ) : sessions.length === 0 ? (
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
      ) : viewMode === 'table' ? (
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

      {workPageData && (
        <ListPagination
          page={workPageData.page}
          total={workPageData.total}
          limit={workPageData.limit}
          hasMore={workPageData.hasMore}
          onPageChange={onPageChange}
          i18nNamespace="sessions"
          variant="range"
        />
      )}
      {isWorkFetching && (
        <p className="text-xs text-muted-foreground px-1">{t("common.loading")}</p>
      )}
    </>
  );
}
