import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { EnrollmentsCommandMetrics } from "@/tenant/features/enrollments/components/EnrollmentsCommandMetrics";
import { EnrollmentsModalLayer } from "@/tenant/features/enrollments/components/EnrollmentsModalLayer";
import { EnrollmentsReportsTier } from "@/tenant/features/enrollments/components/EnrollmentsReportsTier";
import { EnrollmentsSetupTier } from "@/tenant/features/enrollments/components/EnrollmentsSetupTier";
import { EnrollmentsWorkTier } from "@/tenant/features/enrollments/components/EnrollmentsWorkTier";
import { EnrollmentsPageHeaderActions } from "@/tenant/features/enrollments/components/EnrollmentsPageHeaderActions";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ENROLLMENTS_MODULE_MANIFEST } from "@mms/shared";
import { useEnrollmentsPageState } from "@/tenant/features/enrollments/hooks/useEnrollmentsPageState";

/**
 * Enrollments management — Work | Reports | Setup.
 */
export default function EnrollmentsPage() {
  const {
    t,
    SUB_TABS,
    TABS,
    tab,
    setTab,
    activeSubTab,
    setActiveSubTab,
    canWriteEnrollments,
    canDelete,
    canExport,
    canSelectEnrollments,
    directoryFilters,
    enrollments,
    filteredCount,
    isWorkPageError,
    refetchWorkPage,
    viewing,
    setViewing,
    showWizard,
    setShowWizard,
    pendingDeleteId,
    setPendingDeleteId,
    confirmBulkDeleteOpen,
    setConfirmBulkDeleteOpen,
    confirmBulkRestoreOpen,
    setConfirmBulkRestoreOpen,
    columnLayout,
    selection,
    exportActions,
    pageActions,
  } = useEnrollmentsPageState();

  const {
    listPage,
    setListPage,
    showDeleted,
    setShowDeleted,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sessionFilter,
    setSessionFilter,
  } = directoryFilters;

  const {
    selectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedEnrollment,
    clearSelection,
  } = selection;

  const { handleExportCSV, handleBulkExport } = exportActions;
  const {
    handleComplete,
    handleCancel,
    handleDelete,
    handleRestore,
    handleStatusChange,
    handleBulkDelete,
    handleBulkRestore,
    handleBulkCancel,
  } = pageActions;

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.enrollments")}`}
      seoDescription={t("page.enrollments.subtitle")}
      headerIcon={ClipboardList}
      headerTitle={t("nav.enrollments")}
      headerSubtitle={t("page.enrollments.subtitle")}
      headerActions={
        <EnrollmentsPageHeaderActions
          canExport={canExport}
          canWriteEnrollments={canWriteEnrollments}
          showDeleted={showDeleted}
          t={t}
          onExport={() => void handleExportCSV()}
          onNew={() => {
            setTab("work");
            setShowWizard(true);
          }}
        />
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
              canExport={canExport}
              canSelectEnrollments={canSelectEnrollments}
              showDeleted={showDeleted}
              selectedIds={selectedIds}
              allVisibleSelected={allVisibleSelected}
              someVisibleSelected={someVisibleSelected}
              isWorkListError={isWorkPageError}
              loadFailedTitle={t("enrollments.loadFailed")}
              onSubTabChange={setActiveSubTab}
              onRetry={() => void refetchWorkPage()}
              onShowDeletedChange={setShowDeleted}
              onSearchChange={setSearch}
              onStatusFilterChange={setStatusFilter}
              onSessionFilterChange={setSessionFilter}
              onClearFilters={() => {
                setStatusFilter("all");
                setSessionFilter("all");
                setSearch("");
              }}
              onPageChange={setListPage}
              onView={setViewing}
              onCancel={handleCancel}
              onDeleteRequest={setPendingDeleteId}
              onRestore={handleRestore}
              onToggleSelectAll={toggleSelectAll}
              onToggleSelectedEnrollment={toggleSelectedEnrollment}
              onClearSelection={clearSelection}
              onRequestBulkDelete={() => setConfirmBulkDeleteOpen(true)}
              onRequestBulkRestore={() => setConfirmBulkRestoreOpen(true)}
              onRequestBulkCancel={() => handleBulkCancel(selectedIds)}
              onBulkExport={() => void handleBulkExport()}
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
        bulkDeleteCount={selectedIds.length}
        bulkDeleteOpen={confirmBulkDeleteOpen}
        onBulkDeleteOpenChange={setConfirmBulkDeleteOpen}
        bulkRestoreOpen={confirmBulkRestoreOpen}
        onBulkRestoreOpenChange={setConfirmBulkRestoreOpen}
        onConfirmBulkDelete={(deletionReason) => {
          handleBulkDelete(selectedIds, deletionReason);
          setConfirmBulkDeleteOpen(false);
          clearSelection();
        }}
        onConfirmBulkRestore={() => {
          handleBulkRestore(selectedIds);
          setConfirmBulkRestoreOpen(false);
          clearSelection();
        }}
      />
    </ModulePageShell>
  );
}
