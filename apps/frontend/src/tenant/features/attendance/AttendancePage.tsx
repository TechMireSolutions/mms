import React, { useState, useCallback, useMemo, useEffect } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, ClipboardEdit, BookOpen, BarChart2,
  ShieldCheck, ClipboardList, Archive,
} from "lucide-react";
import { resolveModuleTierTab, todayISO, ATTENDANCE_MODULE_MANIFEST } from "@mms/shared";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { AttendanceFilters } from "@/tenant/features/attendance/components/AttendanceFilters";
import { MarkAttendance } from "@/tenant/features/attendance/components/MarkAttendance";
import { AttendanceRecords } from "@/tenant/features/attendance/components/AttendanceRecords";
import { AttendanceAnalytics } from "@/tenant/features/attendance/components/AttendanceAnalytics";
import { AttendanceSettings } from "@/tenant/features/attendance/components/AttendanceSettings";
import { AuditLog } from "@/tenant/features/attendance/components/AuditLog";
import { AttendanceCommandMetrics } from "@/tenant/features/attendance/components/AttendanceCommandMetrics";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import {
  useAttendanceRecords,
  useAttendancePaginated,
  useAttendanceMutations,
} from '@/tenant/features/attendance/hooks/useAttendance';
import { useAttendanceColumnLayout } from '@/tenant/features/attendance/hooks/useAttendanceColumnLayout';
import { useViewerRole } from "@/tenant/hooks/useViewerRole";
import { usePermissions, useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";

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
  const {
    bulkUpsert,
    updateRecord,
    deleteRecord,
    restoreRecord,
  } = useAttendanceMutations();
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
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();

  const handleMessageAttendance = (channel: 'sms' | 'whatsapp' | 'email', attRecords: AttendanceRecord[]) => {
    openComposer(
      channel,
      attRecords.map((r) => ({
        id: r.studentId || r.id,
        name: r.studentName || t("attendance.messaging.student"),
        phone: (r as unknown as { phone?: string }).phone || '',
        email: (r as unknown as { email?: string }).email || '',
      }))
    );
  };

  const pageFilteredCount = useMemo(() => {
    return attendanceRecords.filter((attendanceRecord) => {
      if (filters.classId && attendanceRecord.classId !== filters.classId) return false;
      if (filters.date && attendanceRecord.date !== filters.date) return false;
      return true;
    }).length;
  }, [attendanceRecords, filters.classId, filters.date]);

  const persistRecords = useCallback(async (recordsForClassDate: AttendanceRecord[]) => {
    await bulkUpsert.mutateAsync(recordsForClassDate);
  }, [bulkUpsert]);

  const handleUpdateRecord = useCallback(async (record: AttendanceRecord) => {
    await updateRecord.mutateAsync({ id: record.id, record });
  }, [updateRecord]);

  const handleDeleteRecord = useCallback(async (id: string) => {
    try {
      await deleteRecord.mutateAsync(id);
      notify.success(t("attendance.toast.archived"));
    } catch (error) {
      notify.error(t("attendance.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }, [deleteRecord, t]);

  const handleRestoreRecord = useCallback(async (id: string) => {
    try {
      await restoreRecord.mutateAsync(id);
      notify.success(t("attendance.toast.restored"));
    } catch (error) {
      notify.error(t("attendance.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }, [restoreRecord, t]);


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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n" && canWriteAttendance && !showDeleted) {
        event.preventDefault();
        setActiveTab("work");
        setActiveOpsTab("mark");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canWriteAttendance, setActiveTab, showDeleted]);

  const renderContent = () => {
    if (!effectiveTab) return null;
    if (effectiveTab === "setup") {
      return (
        <AttendanceSettings />
      );
    }

    if (effectiveTab === "reports") {
      return (
        <div className="space-y-5">
          <KPISummary category="attendance" role={role} />
          <SubTabBar
            tabs={visibleAnalyticsTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
            value={effectiveAnalyticsTab}
            onChange={setActiveAnalyticsTab}
          />

          {effectiveAnalyticsTab === "charts" ? (
            <AttendanceAnalytics filters={filters} records={attendanceRecords} />
          ) : (
            <ModuleReports category="attendance" />
          )}
        </div>
      );
    }

    // Work tier
    return (
      <div className="space-y-5">
        {visibleOperationsTabs.length > 1 && (
          <SubTabBar
            tabs={visibleOperationsTabs.map((tab) => ({ key: tab.id, label: tab.label, icon: tab.icon }))}
            value={effectiveOpsTab}
            onChange={setActiveOpsTab}
          />
        )}

        {(() => {
          switch (effectiveOpsTab) {
            case "mark":    return <MarkAttendance filters={filters} role={role} records={activeAttendanceRecords} persistBatch={persistRecords} />;
            case "records": return (
              <AttendanceRecords
                filters={filters}
                records={attendanceRecords}
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={handleDeleteRecord}
                onRestoreRecord={handleRestoreRecord}
                showDeleted={showDeleted}
                isColumnVisible={columnLayout.isColumnVisible}
                getColumnWidth={columnLayout.getColumnWidth}
                onColumnResize={columnLayout.setColumnWidth}
                columnCustomizer={{
                  columnRegistry: columnLayout.columnRegistry,
                  updateUserColumnLayout: columnLayout.updateUserColumnLayout,
                  labels: columnLayout.customizerLabels,
                }}
                onMessage={handleMessageAttendance}
              />
            );
            case "audit":   return <AuditLog filters={filters} />;
            default:        return null;
          }
        })()}
      </div>
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
      {effectiveTab !== "setup" && !can("users.manage") && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-muted text-muted-foreground border border-border">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-bold capitalize">{t("attendance.roleBanner.label", { role })}</span>
          {can("attendance.write") && !can("finance.write") && t("attendance.roleBanner.teacher")}
          {can("finance.write") && !can("attendance.write") && t("attendance.roleBanner.accountant")}
        </div>
      )}

      {effectiveTab !== "setup" && (
        <AttendanceFilters filters={filters} onChange={setFilters} />
      )}

      {effectiveTab === "work" && effectiveOpsTab === "records" && canDeleteAttendance && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowDeleted((current) => !current)}
          aria-pressed={showDeleted}
          className="flex items-center gap-1.5 min-h-[44px] border border-border"
        >
          <Archive className="w-3.5 h-3.5" />
          {showDeleted ? t("attendance.showActive") : t("attendance.showDeleted")}
        </Button>
      )}

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
