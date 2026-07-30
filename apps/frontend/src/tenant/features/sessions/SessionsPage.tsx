import React, { useEffect, useMemo, useState } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { AnimatePresence } from "framer-motion";
import { Plus, Calendar } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ActionButton } from "@/components/ui/ActionButton";
import { SessionsDialogLayer } from "@/tenant/features/sessions/components/SessionsDialogLayer";
import { SessionsReportsTier } from "@/tenant/features/sessions/components/SessionsReportsTier";
import { SessionsSetupTier } from "@/tenant/features/sessions/components/SessionsSetupTier";
import { SessionsWorkTier } from "@/tenant/features/sessions/components/SessionsWorkTier";
import type { SessionSortField, SessionStatus, SessionType } from "@/tenant/features/sessions/components/sessionPageTypes";
import type { Session } from "@/lib/data/sessionsData";
import { useSessionsPaginated, useSessionMutations } from "@/tenant/features/sessions/hooks/useSessions";
import { useSessionDisplayConfig } from "@/tenant/features/sessions/hooks/useSessionDisplayConfig";
import { useSessionColumnLayout } from "@/tenant/features/sessions/hooks/useSessionColumnLayout";
import { useSessionConfig } from "@/hooks/useStandardModuleConfig";
import { SessionsCommandMetrics } from "@/tenant/features/sessions/components/SessionsCommandMetrics";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { SESSIONS_MODULE_MANIFEST } from "@mms/shared";
import { notify } from "@/lib/notify";

export default function Sessions() {
  const { canWrite, canDelete, canReports: canViewReports, canViewSetup } =
    useModulePermissions(SESSIONS_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const { t } = useTranslation();
  const { createSession, updateSession, deleteSession, restoreSession, bulkDeleteSessions, bulkRestoreSessions } =
    useSessionMutations();
  const { settings, statuses, types } = useSessionConfig();
  const { statusOptions, typeOptions, statusLabels, typeLabels, statusConfig, typeConfig } =
    useSessionDisplayConfig({ statuses, types, t });

  const columnLayout = useSessionColumnLayout();
  const listLayout = (settings.defaultViewLayout || "cards") === "list";
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SessionStatus[]>([]);
  const [filterType, setFilterType] = useState<SessionType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [sortField, setSortField] = useState<SessionSortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = usePersistedTabState<string>("sessions_active_tab", "work");

  const useServerWork = activeTab === "work";
  const { data: workPageData, isLoading: isWorkLoading, isFetching: isWorkFetching, isError, refetch } =
    useSessionsPaginated({
    page: listPage,
    limit: SESSIONS_MODULE_MANIFEST.defaultPageSize,
    search,
    status: filterStatus.length > 0 ? filterStatus.join(",") : undefined,
    type: filterType.length > 0 ? filterType.join(",") : undefined,
    sortField,
    sortDir,
    includeDeleted: showDeleted,
    enabled: useServerWork,
  });

  useEffect(() => {
    setListPage(1);
    setSelectedIds([]);
  }, [search, filterStatus, filterType, showDeleted, sortField, sortDir, listLayout]);

  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate: () => {
      setEditSession(null);
      setShowForm(true);
    },
  });

  const sessions = useMemo(
    () => (workPageData?.sessions ?? []) as Session[],
    [workPageData],
  );
  const shownCount = workPageData?.total ?? sessions.length;

  const handleSave = async (sessionToSave: Session) => {
    if (editSession?.id) {
      await updateSession.mutateAsync({ id: sessionToSave.id, session: sessionToSave });
      notify.success(t("sessions.toast.updated"));
      if (detailSession?.id === sessionToSave.id) setDetailSession(sessionToSave);
    } else {
      const created = await createSession.mutateAsync(sessionToSave);
      notify.success(t("sessions.toast.created"));
      if (created.session) setDetailSession(created.session);
    }
  };

  const handleUpdate = async (updatedSession: Session) => {
    try {
      const response = await updateSession.mutateAsync(
        { id: updatedSession.id, session: updatedSession },
      );
      setDetailSession(response.session ?? updatedSession);
      notify.success(t("sessions.toast.updated"));
    } catch (error) {
      notify.error(t("sessions.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleDelete = (id: string) => {
    deleteSession.mutate(id, {
      onSuccess: () => {
        notify.info(t("sessions.toast.deleted"));
        if (detailSession?.id === id) setDetailSession(null);
      },
      onError: (err) => notify.error(t("settings.serverSaveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleRestore = (id: string) => {
    restoreSession.mutate(id, {
      onSuccess: () => notify.success(t("sessions.toast.restored")),
      onError: (err) => notify.error(t("settings.serverSaveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleBulkDelete = () => {
    bulkDeleteSessions.mutate(selectedIds, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          notify.error(t("sessions.toast.bulkPartial", {
            succeeded: result.succeeded,
            failed: result.failed,
          }));
        } else {
          notify.success(t("sessions.toast.deleted"));
        }
        setSelectedIds([]);
      },
      onError: (error) => notify.error(t("sessions.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      }),
    });
  };

  const handleBulkRestore = () => {
    bulkRestoreSessions.mutate(selectedIds, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          notify.error(t("sessions.toast.bulkPartial", {
            succeeded: result.succeeded,
            failed: result.failed,
          }));
        } else {
          notify.success(t("sessions.toast.restored"));
        }
        setSelectedIds([]);
      },
      onError: (error) => notify.error(t("sessions.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      }),
    });
  };

  const handleSort = (nextSortField: SessionSortField) => {
    if (sortField === nextSortField) {
      setSortDir((currentDirection) => currentDirection === "asc" ? "desc" : "asc");
      return;
    }
    setSortField(nextSortField);
    setSortDir("asc");
  };

  const toggleFilter = <T,>(selectedValues: T[], setSelectedValues: React.Dispatch<React.SetStateAction<T[]>>, nextValue: T) =>
    setSelectedValues((currentValues) => currentValues.includes(nextValue)
      ? currentValues.filter((selectedValue) => selectedValue !== nextValue)
      : [...currentValues, nextValue]);

  const canSelectSessions = canWrite || canDelete;
  const allVisibleSelected = sessions.length > 0
    && sessions.every((sessionItem) => selectedIds.includes(sessionItem.id));
  const someVisibleSelected = sessions.some((sessionItem) => selectedIds.includes(sessionItem.id));

  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = sessions.map((sessionItem) => sessionItem.id);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleIds.includes(id)));
  };

  const toggleSelectedSession = (id: string, checked: boolean) => {
    setSelectedIds((currentIds) => checked
      ? [...currentIds, id]
      : currentIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.sessions")}`}
      seoDescription={t("page.sessions.subtitle")}
      headerIcon={Calendar}
      headerTitle={t("nav.sessions")}
      headerSubtitle={t("page.sessions.subtitle")}
      headerActions={
        canWrite && !showDeleted ? (
          <ActionButton variant="primary" icon={Plus} onClick={() => { setEditSession(null); setShowForm(true); }}>
            {t("sessions.action.new")}
          </ActionButton>
        ) : undefined
      }
      metricsStrip={
        <SessionsCommandMetrics total={shownCount} shown={sessions.length} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="sessions-tab"
      >
      <AnimatePresence mode="wait">
        {activeTab === "work" ? (
          <SessionsWorkTier
            search={search}
            filterStatus={filterStatus}
            filterType={filterType}
            statusOptions={statusOptions}
            typeOptions={typeOptions}
            statusLabels={statusLabels}
            typeLabels={typeLabels}
            listLayout={listLayout}
            columnLayout={columnLayout}
            canWrite={canWrite}
            canDelete={canDelete}
            showDeleted={showDeleted}
            sessions={sessions}
            workPageData={workPageData}
            isError={isError}
            isWorkLoading={isWorkLoading}
            isWorkFetching={isWorkFetching}
            useServerWork={useServerWork}
            canSelectSessions={canSelectSessions}
            selectedIds={selectedIds}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            sortField={sortField}
            sortDir={sortDir}
            statusConfig={statusConfig}
            typeConfig={typeConfig}
            onSearchChange={setSearch}
            onStatusFilterToggle={(statusOption) => toggleFilter(filterStatus, setFilterStatus, statusOption)}
            onTypeFilterToggle={(typeOption) => toggleFilter(filterType, setFilterType, typeOption)}
            onClearFilters={() => { setFilterStatus([]); setFilterType([]); }}
            onToggleDeleted={() => setShowDeleted((previous) => !previous)}
            onRetry={() => void refetch()}
            onCreateSession={() => setShowForm(true)}
            onOpenDetail={setDetailSession}
            onSort={handleSort}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelectedSession={toggleSelectedSession}
            onRequestDelete={setPendingDeleteId}
            onRestore={handleRestore}
            onRequestBulkDelete={() => setConfirmBulkDeleteOpen(true)}
            onRequestBulkRestore={() => setConfirmBulkRestoreOpen(true)}
            onPageChange={setListPage}
          />
        ) : activeTab === "reports" ? (
          <SessionsReportsTier />
        ) : activeTab === "setup" ? (
          <SessionsSetupTier />
        ) : null}
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      <SessionsDialogLayer
        showForm={showForm}
        editSession={editSession}
        detailSession={detailSession}
        showDeleted={showDeleted}
        pendingDeleteId={pendingDeleteId}
        confirmBulkDeleteOpen={confirmBulkDeleteOpen}
        confirmBulkRestoreOpen={confirmBulkRestoreOpen}
        selectedCount={selectedIds.length}
        t={t}
        onCloseForm={() => { setShowForm(false); setEditSession(null); }}
        onSave={handleSave}
        onCloseDetail={() => setDetailSession(null)}
        onUpdate={handleUpdate}
        onEdit={(sessionToEdit) => { setEditSession(sessionToEdit); setShowForm(true); }}
        onPendingDeleteOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        onConfirmDelete={() => {
          if (pendingDeleteId) handleDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onBulkDeleteOpenChange={setConfirmBulkDeleteOpen}
        onConfirmBulkDelete={handleBulkDelete}
        onBulkRestoreOpenChange={setConfirmBulkRestoreOpen}
        onConfirmBulkRestore={handleBulkRestore}
      />
    </ModulePageShell>
  );
}
