import React, { useState, useMemo } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, ClipboardEdit, BookOpen, BarChart2,
  ClipboardList,
} from "lucide-react";
import { resolveModuleTierTab, todayISO, ATTENDANCE_MODULE_MANIFEST } from "@mms/shared";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ActionButton } from "@/components/ui/ActionButton";
import { AttendanceCommandMetrics } from "@/tenant/features/attendance/components/AttendanceCommandMetrics";
import { AttendanceReportsTier } from "@/tenant/features/attendance/components/AttendanceReportsTier";
import { AttendanceSetupTier } from "@/tenant/features/attendance/components/AttendanceSetupTier";
import { AttendanceWorkTier } from "@/tenant/features/attendance/components/AttendanceWorkTier";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  useAttendanceRecords,
  useAttendancePaginated,
} from '@/tenant/features/attendance/hooks/useAttendance';
import { useAttendancePageActions } from "@/tenant/features/attendance/hooks/useAttendancePageActions";
import { useAttendanceColumnLayout } from '@/tenant/features/attendance/hooks/useAttendanceColumnLayout';
import { useViewerRole } from "@/tenant/hooks/useViewerRole";
import { usePermissions, useModulePermissions } from "@/tenant/hooks/usePermissions";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));

const DEFAULT_FILTERS = {
  sessionId: "",
  classId: "",
  teacherId: "",
  date: todayISO(),
};

/**
 * Attendance — tracking and reports. Work | Reports | Setup.
 *
 * @returns {React.ReactElement} The Attendance page component.
 */
export default function Attendance() {
  const { t } = useTranslation();
  const {
    canWrite: canWriteAttendance,
    canDelete: canDeleteAttendance,
    canRead: canAnalyticsView,
    canViewSetup,
  } = useModulePermissions(ATTENDANCE_MODULE_MANIFEST);
  const { can } = usePermissions();
  const role = useViewerRole();
  const [activeTab, setActiveTab] = usePersistedTabState<string>("attendance_active_tab", "work");
  const [activeOpsTab, setActiveOpsTab] = useState("mark");
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("charts");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showDeleted, setShowDeleted] = useState(false);
  const attendanceCollectionQuery = useAttendanceRecords();
  const attendancePageQuery = useAttendancePaginated({
    page: 1,
    limit: ATTENDANCE_MODULE_MANIFEST.maxPageSize,
    includeDeleted: showDeleted,
    enabled: activeTab === "work",
  });
  const activeAttendanceRecords = attendanceCollectionQuery.syncedData;
  const workAttendanceRecords = attendancePageQuery.data?.records ?? [];
  const attendanceRecords = activeTab === "work" ? workAttendanceRecords : activeAttendanceRecords;
  const columnLayout = useAttendanceColumnLayout();
  const {
    messagingTarget,
    closeComposer,
    handleMessageAttendance,
    persistRecords,
    handleUpdateRecord,
    handleDeleteRecord,
    handleRestoreRecord,
  } = useAttendancePageActions();

  const pageFilteredCount = useMemo(() => {
    return attendanceRecords.filter((attendanceRecord) => {
      if (filters.classId && attendanceRecord.classId !== filters.classId) return false;
      if (filters.date && attendanceRecord.date !== filters.date) return false;
      return true;
    }).length;
  }, [attendanceRecords, filters.classId, filters.date]);

  const canSeeAttendanceAnalytics = canAnalyticsView
    && (can("users.manage") || canWriteAttendance || can("enrollments.write") || !can("finance.write"));

  const visibleTopTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports: canSeeAttendanceAnalytics,
  });

  const visibleOperationsTabs = useMemo(
    () => [
      { id: "mark",    label: t("attendance.tabs.mark"),    icon: ClipboardEdit, visible: canWriteAttendance },
      { id: "records", label: t("attendance.tabs.records"), icon: BookOpen,      visible: canAnalyticsView },
      { id: "audit",   label: t("attendance.tabs.audit"),   icon: ClipboardList, visible: canDeleteAttendance },
    ].filter((tab) => tab.visible),
    [t, canWriteAttendance, canAnalyticsView, canDeleteAttendance],
  );

  const visibleAnalyticsTabs = useMemo(
    () => [
      { id: "charts",  label: t("attendance.tabs.analyticsCharts"), icon: BarChart2,     visible: canSeeAttendanceAnalytics },
      { id: "reports", label: t("attendance.tabs.reports"),         icon: ClipboardList, visible: canSeeAttendanceAnalytics },
    ].filter((tab) => tab.visible),
    [t, canSeeAttendanceAnalytics],
  );

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    visibleTopTabs.map((tab) => tab.id),
  );
  const effectiveOpsTab = visibleOperationsTabs.find((t) => t.id === activeOpsTab) ? activeOpsTab : (visibleOperationsTabs[0]?.id || "records");
  const effectiveAnalyticsTab = visibleAnalyticsTabs.find((t) => t.id === activeAnalyticsTab) ? activeAnalyticsTab : (visibleAnalyticsTabs[0]?.id || "reports");

  useModuleCreateHotkey({
    enabled: canWriteAttendance && !showDeleted,
    onCreate: () => {
      setActiveTab("work");
      setActiveOpsTab("mark");
    },
  });

  const renderContent = () => {
    if (!effectiveTab) return null;
    if (effectiveTab === "setup") {
      return <AttendanceSetupTier />;
    }

    if (effectiveTab === "reports") {
      return (
        <AttendanceReportsTier
          role={role}
          filters={filters}
          records={attendanceRecords}
          analyticsTabs={visibleAnalyticsTabs}
          activeAnalyticsTab={effectiveAnalyticsTab}
          onAnalyticsTabChange={setActiveAnalyticsTab}
        />
      );
    }

    return (
      <AttendanceWorkTier
        filters={filters}
        role={role}
        records={attendanceRecords}
        activeRecords={activeAttendanceRecords}
        activeOpsTab={effectiveOpsTab}
        operationsTabs={visibleOperationsTabs}
        showDeleted={showDeleted}
        canDeleteAttendance={canDeleteAttendance}
        showRoleBanner={!can("users.manage")}
        roleLabel={t("attendance.roleBanner.label", { role })}
        teacherRoleText={can("attendance.write") && !can("finance.write") && t("attendance.roleBanner.teacher")}
        accountantRoleText={can("finance.write") && !can("attendance.write") && t("attendance.roleBanner.accountant")}
        showActiveLabel={t("attendance.showActive")}
        showDeletedLabel={t("attendance.showDeleted")}
        onFiltersChange={setFilters}
        onOpsTabChange={setActiveOpsTab}
        onShowDeletedToggle={() => setShowDeleted((current) => !current)}
        onPersistRecords={persistRecords}
        onUpdateRecord={handleUpdateRecord}
        onDeleteRecord={handleDeleteRecord}
        onRestoreRecord={handleRestoreRecord}
        onMessage={handleMessageAttendance}
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
    );
  };

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.attendance")}`}
      seoDescription={t("page.attendance.subtitle")}
      headerIcon={UserCheck}
      headerTitle={t("nav.attendance")}
      headerSubtitle={t("page.attendance.subtitle")}
      headerActions={
        canWriteAttendance && !showDeleted ? (
          <ActionButton
            variant="primary"
            icon={ClipboardEdit}
            onClick={() => {
              setActiveTab("work");
              setActiveOpsTab("mark");
            }}
          >
            {t("attendance.tabs.mark")}
          </ActionButton>
        ) : undefined
      }
      metricsStrip={
        <AttendanceCommandMetrics
          total={attendanceRecords.length}
          shown={pageFilteredCount}
          selectedDate={filters.date}
        />
      }
    >
      <ResponsiveAccordionTabs
        tabs={visibleTopTabs}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        hideWhenSingle
        panelIdPrefix="attendance-tab"
      >
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={effectiveTab + "-" + effectiveOpsTab + "-" + role}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ErrorBoundary>
            {(attendanceCollectionQuery.queryResult.isError || (effectiveTab === "work" && attendancePageQuery.isError)) ? (
              <ErrorState
                title={t("attendance.toast.loadFailed")}
                description={t("common.retry")}
                onRetry={() => {
                  void attendanceCollectionQuery.queryResult.refetch();
                  void attendancePageQuery.refetch();
                }}
              />
            ) : renderContent()}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}
    </ModulePageShell>
  );
}
