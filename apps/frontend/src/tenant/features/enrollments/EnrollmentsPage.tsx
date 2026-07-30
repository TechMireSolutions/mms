import React, { useState, useEffect, useMemo } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, UserCheck } from "lucide-react";
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
  useEnrollments,
  useEnrollmentsPaginated,
} from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import { ENROLLMENTS_MODULE_MANIFEST } from "@mms/shared";
import { useEnrollmentsPageActions } from "@/tenant/features/enrollments/hooks/useEnrollmentsPageActions";
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
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(ENROLLMENTS_MODULE_MANIFEST);
  const TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const [tab, setTab]                 = usePersistedTabState<string>("enrollments_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("list");
  const [showDeleted, setShowDeleted] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const activeEnrollmentsResult = useEnrollments();
  const activeEnrollments = activeEnrollmentsResult.syncedData;
  const {
    data: deletedPage,
    isError: isDeletedPageError,
    refetch: refetchDeletedPage,
  } = useEnrollmentsPaginated({
    page: 1,
    limit: ENROLLMENTS_MODULE_MANIFEST.maxPageSize,
    includeDeleted: true,
    enabled: showDeleted,
  });
  const isWorkListError = showDeleted
    ? isDeletedPageError
    : activeEnrollmentsResult.queryResult.isError;
  const retryWorkList = () =>
    showDeleted ? refetchDeletedPage() : activeEnrollmentsResult.queryResult.refetch();
  const enrollments = showDeleted
    ? ((deletedPage?.enrollments ?? []) as Enrollment[])
    : activeEnrollments;
  const [viewing, setViewing]         = useState<Enrollment | null>(null);
  const [showWizard, setShowWizard]   = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);
  const columnLayout = useEnrollmentColumnLayout();

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

  useEffect(() => {
    setFilteredCount(enrollments.length);
  }, [enrollments.length]);

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.enrollments")}`}
      seoDescription={t("page.enrollments.subtitle")}
      headerIcon={ClipboardList}
      headerTitle={t("nav.enrollments")}
      headerSubtitle={t("page.enrollments.subtitle")}
      headerActions={
        <div className="flex items-center gap-2">
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
        <EnrollmentsCommandMetrics total={enrollments.length} shown={filteredCount} />
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
              <EnrollmentsReportsTier enrollments={activeEnrollments} />
            </ErrorBoundary>
          )}

          {tab === "work" && (
            <EnrollmentsWorkTier
              activeSubTab={activeSubTab}
              subTabs={SUB_TABS}
              enrollments={enrollments}
              canWrite={canWriteEnrollments}
              canDelete={canDelete}
              showDeleted={showDeleted}
              isWorkListError={isWorkListError}
              loadFailedTitle={t("enrollments.loadFailed")}
              onSubTabChange={setActiveSubTab}
              onRetry={() => void retryWorkList()}
              onShowDeletedChange={setShowDeleted}
              onView={setViewing}
              onCancel={handleCancel}
              onDeleteRequest={setPendingDeleteId}
              onRestore={handleRestore}
              onFilteredCountChange={setFilteredCount}
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
        confirmDeleteTitle={t("enrollments.confirmDeleteTitle")}
        confirmDeleteDescription={t("enrollments.confirmDeleteDescription")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onCloseViewing={() => setViewing(null)}
        onStatusChange={handleStatusChange}
        onCloseWizard={() => setShowWizard(false)}
        onCompleteWizard={handleComplete}
        onPendingDeleteChange={setPendingDeleteId}
        onConfirmDelete={handleDelete}
      />
    </ModulePageShell>
  );
}
