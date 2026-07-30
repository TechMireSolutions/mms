import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Archive, BookOpen, ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { formatDate, formatMoney } from "@mms/shared";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListPagination } from "@/components/ui/ListPagination";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { SessionCard } from "@/tenant/features/sessions/components/SessionCard";
import type { SessionSortField } from "@/tenant/features/sessions/components/sessionPageTypes";
import type { Session } from "@/lib/data/sessionsData";

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
  listLayout: boolean;
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canSelectSessions: boolean;
  selectedIds: string[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  showName: boolean;
  showType: boolean;
  showDuration: boolean;
  showFee: boolean;
  showEnrolled: boolean;
  showStatus: boolean;
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
  listLayout,
  showDeleted,
  canWrite,
  canDelete,
  canSelectSessions,
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  showName,
  showType,
  showDuration,
  showFee,
  showEnrolled,
  showStatus,
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

  const getSessionEnrollmentTotals = (sessionItem: Session) => {
    const totalEnrolled = sessionItem.classes?.reduce((sum, sessionClass) => sum + sessionClass.enrolled, 0) ?? 0;
    const totalCapacity = sessionItem.classes?.reduce((sum, sessionClass) => sum + sessionClass.capacity, 0) ?? 0;
    return { totalEnrolled, totalCapacity };
  };

  const renderSortIcon = (field: SessionSortField): ReactNode => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="ms-1 w-3 h-3" /> : <ChevronDown className="ms-1 w-3 h-3" />;
  };

  const renderSessionListActions = (sessionId: string) => (
    canDelete ? (
      showDeleted ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("sessions.restore")}
          onClick={() => onRestore(sessionId)}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("common.delete")}
          onClick={() => onRequestDelete(sessionId)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )
    ) : null
  );

  return (
    <>
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card/90 border border-primary/20 shadow-md backdrop-blur-md">
          <span className="text-sm font-semibold text-foreground">
            {t("sessions.selectedCount", { count: selectedIds.length })}
          </span>
          {showDeleted ? (
            <Button type="button" variant="outline" onClick={onRequestBulkRestore}>
              <RotateCcw className="w-4 h-4 me-2" />
              {t("sessions.restore")}
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={onRequestBulkDelete}>
              <Archive className="w-4 h-4 me-2" />
              {t("sessions.archive")}
            </Button>
          )}
        </div>
      )}

      {isError ? (
        <ErrorState
          title={t("sessions.toast.saveFailed")}
          description={t("common.retry")}
          onRetry={onRetry}
        />
      ) : isWorkLoading ? (
        <TableSkeleton rows={6} cols={listLayout ? 6 : 3} />
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
      ) : listLayout ? (
        <div className="rounded-2xl border border-border bg-card/45 backdrop-blur-xl overflow-hidden shadow-sm">
          <div className="space-y-3 p-3 md:hidden">
            {sessions.map((sessionItem, index) => {
              const { totalEnrolled, totalCapacity } = getSessionEnrollmentTotals(sessionItem);
              return (
                <motion.article
                  key={sessionItem.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="space-y-3 rounded-xl border border-border bg-card p-3"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => !showDeleted && onOpenDetail(sessionItem)}
                    className="h-auto w-full justify-start p-0 text-start font-normal hover:bg-transparent"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        {showName && <h4 className="truncate text-sm font-semibold text-foreground">{sessionItem.name}</h4>}
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {showType && <StatusBadge status={sessionItem.type || "other"} config={typeConfig} size="sm" />}
                          {showStatus && <StatusBadge status={sessionItem.status} config={statusConfig} size="sm" />}
                        </div>
                      </div>
                      {showFee && (
                        <span className="shrink-0 text-sm font-bold text-foreground">
                          {formatMoney(sessionItem.baseFee, sessionItem.currency)}
                        </span>
                      )}
                    </div>
                  </Button>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {showDuration && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("sessions.columns.duration")}</dt>
                        <dd className="text-foreground">
                          {formatDate(sessionItem.startDate, true)} — {formatDate(sessionItem.endDate, true)}
                        </dd>
                      </div>
                    )}
                    {showEnrolled && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("sessions.columns.enrolled")}</dt>
                        <dd className="text-foreground">
                          {totalEnrolled}/{totalCapacity || t("common.notSpecified")}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                    {canSelectSessions ? (
                      <Checkbox
                        checked={selectedIds.includes(sessionItem.id)}
                        onCheckedChange={(checked) => onToggleSelectedSession(sessionItem.id, checked === true)}
                        aria-label={sessionItem.name}
                      />
                    ) : <span />}
                    {renderSessionListActions(sessionItem.id)}
                  </div>
                </motion.article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {canSelectSessions && (
                    <th className="px-4 py-3 w-12">
                      <Checkbox
                        checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                        onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                        aria-label={t("sessions.selectedCount", { count: sessions.length })}
                      />
                    </th>
                  )}
                  {showName && (
                    <ResizableTableHead columnKey="name" width={columnLayout.getColumnWidth("name")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 text-xs font-semibold uppercase tracking-wide" onClick={() => onSort("name")}>
                        {t("sessions.columns.name")}
                        {renderSortIcon("name")}
                      </Button>
                    </ResizableTableHead>
                  )}
                  {showType && (
                    <ResizableTableHead columnKey="type" width={columnLayout.getColumnWidth("type")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 text-xs font-semibold uppercase tracking-wide" onClick={() => onSort("type")}>
                        {t("sessions.columns.type")}
                        {renderSortIcon("type")}
                      </Button>
                    </ResizableTableHead>
                  )}
                  {showDuration && (
                    <ResizableTableHead columnKey="duration" width={columnLayout.getColumnWidth("duration")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("sessions.columns.duration")}
                    </ResizableTableHead>
                  )}
                  {showFee && (
                    <ResizableTableHead columnKey="fee" width={columnLayout.getColumnWidth("fee")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 text-xs font-semibold uppercase tracking-wide" onClick={() => onSort("baseFee")}>
                        {t("sessions.columns.fee")}
                        {renderSortIcon("baseFee")}
                      </Button>
                    </ResizableTableHead>
                  )}
                  {showEnrolled && (
                    <ResizableTableHead columnKey="enrolled" width={columnLayout.getColumnWidth("enrolled")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("sessions.columns.enrolled")}
                    </ResizableTableHead>
                  )}
                  {showStatus && (
                    <ResizableTableHead columnKey="status" width={columnLayout.getColumnWidth("status")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 text-xs font-semibold uppercase tracking-wide" onClick={() => onSort("status")}>
                        {t("sessions.columns.status")}
                        {renderSortIcon("status")}
                      </Button>
                    </ResizableTableHead>
                  )}
                  {canDelete && <th className="px-4 py-3 w-10"><span className="sr-only">{t("common.actions")}</span></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sessions.map((sessionItem) => {
                  const { totalEnrolled, totalCapacity } = getSessionEnrollmentTotals(sessionItem);
                  return (
                    <tr key={sessionItem.id} onClick={() => !showDeleted && onOpenDetail(sessionItem)} className="hover:bg-muted/20 cursor-pointer transition-colors group">
                      {canSelectSessions && (
                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(sessionItem.id)}
                            onCheckedChange={(checked) => onToggleSelectedSession(sessionItem.id, checked === true)}
                            aria-label={sessionItem.name}
                          />
                        </td>
                      )}
                      {showName && (
                        <td className="px-4 py-3 font-semibold text-foreground group-hover:text-primary transition-colors">{sessionItem.name}</td>
                      )}
                      {showType && (
                        <td className="px-4 py-3">
                          <StatusBadge status={sessionItem.type || "other"} config={typeConfig} size="sm" />
                        </td>
                      )}
                      {showDuration && (
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(sessionItem.startDate, true)} — {formatDate(sessionItem.endDate, true)}
                        </td>
                      )}
                      {showFee && (
                        <td className="px-4 py-3 text-xs font-medium">
                          {formatMoney(sessionItem.baseFee, sessionItem.currency)}
                        </td>
                      )}
                      {showEnrolled && (
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {totalEnrolled}/{totalCapacity || t("common.notSpecified")}
                        </td>
                      )}
                      {showStatus && (
                        <td className="px-4 py-3">
                          <StatusBadge status={sessionItem.status} config={statusConfig} size="sm" />
                        </td>
                      )}
                      {canDelete && (
                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                          {renderSessionListActions(sessionItem.id)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map((sessionItem) => (
            <SessionCard
              key={sessionItem.id}
              session={sessionItem}
              onClick={() => !showDeleted && onOpenDetail(sessionItem)}
              onDelete={onRequestDelete}
              onRestore={onRestore}
              canDelete={canDelete}
              showDeleted={showDeleted}
              statusConfig={statusConfig}
              typeConfig={typeConfig}
            />
          ))}
        </div>
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
