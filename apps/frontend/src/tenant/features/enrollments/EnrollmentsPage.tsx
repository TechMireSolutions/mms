import React, { useState, useEffect, useMemo } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Download, Plus, UserCheck } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { EnrollmentsCommandMetrics } from "@/tenant/features/enrollments/components/EnrollmentsCommandMetrics";
import { EnrollmentsModalLayer } from "@/tenant/features/enrollments/components/EnrollmentsModalLayer";
import { EnrollmentsReportsTier } from "@/tenant/features/enrollments/components/EnrollmentsReportsTier";
import { EnrollmentsSetupTier } from "@/tenant/features/enrollments/components/EnrollmentsSetupTier";
import { EnrollmentsWorkTier } from "@/tenant/features/enrollments/components/EnrollmentsWorkTier";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ActionButton } from "@/components/ui/ActionButton";
import { Enrollment } from '@/lib/data/enrollmentData';
import {
  useEnrollmentMutations,
  useEnrollmentsPaginated,
} from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import { useEnrollmentsDirectoryFilters } from "@/tenant/features/enrollments/hooks/useEnrollmentsDirectoryFilters";
import { ENROLLMENTS_MODULE_MANIFEST } from "@mms/shared";
import { useEnrollmentsPageActions } from "@/tenant/features/enrollments/hooks/useEnrollmentsPageActions";
import {
  defaultEnrollmentsExportColumns,
  useEnrollmentsExportActions,
} from "@/tenant/features/enrollments/hooks/useEnrollmentsExportActions";
import { useEnrollmentColumnLayout } from "@/tenant/features/enrollments/hooks/useEnrollmentColumnLayout";

/**
 * Enrollments management — Work | Reports | Setup.
 */
export default function EnrollmentsPage() {
  const { t } = useTranslation();
  const SUB_TABS = useMemo(
    () => [
      { id: "list", label: t("enrollments.list"), icon: ClipboardList },
      { id: "eligibility", label: t("enrollments.eligibility"), icon: UserCheck },
    ],
    [t]
  );
  const {
    canWrite: canWriteEnrollments,
    canDelete,
    canExport,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(ENROLLMENTS_MODULE_MANIFEST);
  const TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const [tab, setTab] = usePersistedTabState<string>("enrollments_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("list");
  const {
    listPage,
    setListPage,
    showDeleted,
    setShowDeleted,
    search,
    setSearch,
    debouncedSearch,
    statusFilter,
    setStatusFilter,
    sessionFilter,
    setSessionFilter,
  } = useEnrollmentsDirectoryFilters();

  const useServerWork = tab === "work" && activeSubTab === "list";
  const {
    data: workPageData,
    isError: isWorkPageError,
    refetch: refetchWorkPage,
  } = useEnrollmentsPaginated({
    page: listPage,
    limit: ENROLLMENTS_MODULE_MANIFEST.defaultPageSize,
    search: debouncedSearch,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sessionId: sessionFilter !== "all" ? sessionFilter : undefined,
    includeDeleted: showDeleted,
    enabled: useServerWork,
  });

  const enrollments = useMemo(
    () => (workPageData?.enrollments ?? []) as Enrollment[],
    [workPageData],
  );
  const filteredCount = workPageData?.total ?? enrollments.length;

  const [viewing, setViewing] = useState<Enrollment | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const columnLayout = useEnrollmentColumnLayout();
  const { logExportAudit } = useEnrollmentMutations();
  const exportColumns = useMemo(() => defaultEnrollmentsExportColumns(t), [t]);
  const { handleExportCSV } = useEnrollmentsExportActions({
    tableColumns: exportColumns,
    canExport,
    search,
    statusFilter,
    sessionFilter,
    viewingDeleted: showDeleted,
    selectedIds: [],
    logExportAudit,
  });

  useEffect(() => {
    if (!canWriteEnrollments && activeSubTab === "eligibility") {
      setActiveSubTab("list");
    }
  }, [canWriteEnrollments, activeSubTab]);

  useModuleCreateHotkey({
    enabled: canWriteEnrollments && !showDeleted,
    onCreate: () => {
      setTab("work");
      setShowWizard(true);
    },
  });

  const {
    handleComplete,
    handleCancel,
    handleDelete,
    handleRestore,
    handleStatusChange,
  } = useEnrollmentsPageActions({
    enrollments,
    viewing,
    onViewingChange: setViewing,
    onActiveSubTabChange: setActiveSubTab,
  });

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.enrollments")}`}
      seoDescription={t("page.enrollments.subtitle")}
      headerIcon={ClipboardList}
      headerTitle={t("nav.enrollments")}
      headerSubtitle={t("page.enrollments.subtitle")}
      headerActions={
        <div className="flex items-center gap-2">
          {canExport && !showDeleted ? (
            <ActionButton variant="ghost" icon={Download} onClick={() => void handleExportCSV()}>
              {t("common.export")}
            </ActionButton>
          ) : null}
          {canWriteEnrollments && !showDeleted && (
            <ActionButton
              variant="primary"
              icon={Plus}
              onClick={() => { setTab("work"); setShowWizard(true); }}
            >
              {t("enrollments.new")}
            </ActionButton>
          )}
        </div>
      }
      metricsStrip={
        <EnrollmentsCommandMetrics total={filteredCount} shown={filteredCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        panelIdPrefix="enrollments-tab"
      >
      <AnimatePresence mode="wait">
        <motion.div key={tab + "-" + activeSubTab + (showDeleted ? "-trash" : "")}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {tab === "reports" && (
            <ErrorBoundary>
              <EnrollmentsReportsTier />
            </ErrorBoundary>
          )}

          {tab === "work" && (
            <EnrollmentsWorkTier
              activeSubTab={activeSubTab}
              subTabs={SUB_TABS}
              enrollments={enrollments}
              total={filteredCount}
              page={listPage}
              pageSize={ENROLLMENTS_MODULE_MANIFEST.defaultPageSize}
              search={search}
              statusFilter={statusFilter}
              sessionFilter={sessionFilter}
              canWrite={canWriteEnrollments}
              canDelete={canDelete}
              showDeleted={showDeleted}
              isWorkListError={isWorkPageError}
              loadFailedTitle={t("enrollments.loadFailed")}
              onSubTabChange={setActiveSubTab}
              onRetry={() => void refetchWorkPage()}
              onShowDeletedChange={setShowDeleted}
              onSearchChange={setSearch}
              onStatusFilterChange={setStatusFilter}
              onSessionFilterChange={setSessionFilter}
              onPageChange={setListPage}
              onView={setViewing}
              onCancel={handleCancel}
              onDeleteRequest={setPendingDeleteId}
              onRestore={handleRestore}
              columnProps={{
                isColumnVisible: columnLayout.isColumnVisible,
                getColumnWidth: columnLayout.getColumnWidth,
                onColumnResize: columnLayout.setColumnWidth,
                columnCustomizer: {
                  columnRegistry: columnLayout.columnRegistry,
                  updateUserColumnLayout: columnLayout.updateUserColumnLayout,
                  labels: columnLayout.customizerLabels,
                },
              }}
            />
          )}

          {tab === "setup" && (
            <ErrorBoundary>
              <EnrollmentsSetupTier />
            </ErrorBoundary>
          )}
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      <EnrollmentsModalLayer
        viewing={viewing}
        canWrite={canWriteEnrollments}
        showDeleted={showDeleted}
        showWizard={showWizard}
        pendingDeleteId={pendingDeleteId}
        wizardTitle={t("enrollments.new")}
        onCloseViewing={() => setViewing(null)}
        onStatusChange={handleStatusChange}
        onCloseWizard={() => setShowWizard(false)}
        onCompleteWizard={handleComplete}
        onPendingDeleteChange={setPendingDeleteId}
        onConfirmDelete={(deletionReason) => {
          if (pendingDeleteId) handleDelete(pendingDeleteId, deletionReason);
          setPendingDeleteId(null);
        }}
      />
    </ModulePageShell>
  );
}
