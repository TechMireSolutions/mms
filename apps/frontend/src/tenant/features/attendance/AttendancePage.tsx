import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, ClipboardEdit, BookOpen, BarChart2,
  ShieldCheck, ClipboardList,
} from "lucide-react";
import { resolveModuleTierTab } from "@mms/shared";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
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
import { saveCollection } from "@/lib/db";
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import {
  useAttendanceRecordsCollection,
  useAttendanceMutations,
  ATTENDANCE_QUERY_KEY,
} from '@/tenant/features/attendance/hooks/useAttendance';
import { useAttendanceColumnLayout } from '@/tenant/features/attendance/hooks/useAttendanceColumnLayout';
import { useQueryClient } from '@tanstack/react-query';
import { useViewerRole } from "@/tenant/hooks/useViewerRole";
import { usePermissions } from "@/tenant/hooks/usePermissions";

const DEFAULT_FILTERS = {
  sessionId: "",
  classId: "",
  teacherId: "",
  date: new Date().toISOString().slice(0, 10),
};

/**
 * Attendance — tracking and reports. Work | Reports | Setup.
 *
 * @returns {React.ReactElement} The Attendance page component.
 */
export default function Attendance() {
  const { t } = useTranslation();
  const role = useViewerRole();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState("work");
  const [activeOpsTab, setActiveOpsTab] = useState("mark");
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("charts");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const queryClient = useQueryClient();
  const attendanceRecords = useAttendanceRecordsCollection();
  const { replaceAll } = useAttendanceMutations();
  const columnLayout = useAttendanceColumnLayout();

  const pageFilteredCount = useMemo(() => {
    return attendanceRecords.filter((attendanceRecord) => {
      if (filters.classId && attendanceRecord.classId !== filters.classId) return false;
      if (filters.date && attendanceRecord.date !== filters.date) return false;
      return true;
    }).length;
  }, [attendanceRecords, filters.classId, filters.date]);

  const setRecords = useCallback((updater: React.SetStateAction<AttendanceRecord[]>) => {
    const nextAttendanceRecords = typeof updater === "function" ? updater(attendanceRecords) : updater;
    saveCollection("attendance_records", nextAttendanceRecords);
    queryClient.setQueryData(ATTENDANCE_QUERY_KEY, nextAttendanceRecords);
    replaceAll.mutate(nextAttendanceRecords);
  }, [attendanceRecords, replaceAll, queryClient]);



  const canSeeAttendanceAnalytics = can("analytics.view")
    && (can("users.manage") || can("attendance.write") || can("enrollments.write") || !can("finance.write"));

  const visibleTopTabs = useFilteredModuleTierTabs({
    canViewSetup: can("settings.global.write"),
    canViewReports: canSeeAttendanceAnalytics,
  });

  const visibleOperationsTabs = useMemo(
    () => [
      { id: "mark",    label: t("attendance.tabs.mark"),    icon: ClipboardEdit, visible: can("attendance.write") },
      { id: "records", label: t("attendance.tabs.records"), icon: BookOpen,      visible: can("analytics.view") },
      { id: "audit",   label: t("attendance.tabs.audit"),   icon: ClipboardList, visible: can("users.manage") },
    ].filter((tab) => tab.visible),
    [t, can],
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

  const renderContent = () => {
    if (!effectiveTab) return null;
    if (effectiveTab === "setup") {
      return (
        <AttendanceSettings mode="preferences" />
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
            tabs={visibleOperationsTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
            value={effectiveOpsTab}
            onChange={setActiveOpsTab}
          />
        )}

        {(() => {
          switch (effectiveOpsTab) {
            case "mark":    return <MarkAttendance filters={filters} role={role} records={attendanceRecords} setRecords={setRecords} />;
            case "records": return (
              <AttendanceRecords
                filters={filters}
                records={attendanceRecords}
                setRecords={setRecords}
                isColumnVisible={columnLayout.isColumnVisible}
                columnCustomizer={{
                  columnRegistry: columnLayout.columnRegistry,
                  updateUserColumnLayout: columnLayout.updateUserColumnLayout,
                  labels: columnLayout.customizerLabels,
                }}
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
      {/* Role info banner */}
      {!can("users.manage") && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-muted text-muted-foreground border border-border">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-bold capitalize">{t("attendance.roleBanner.label", { role })}</span>
          {can("attendance.write") && !can("finance.write") && t("attendance.roleBanner.teacher")}
          {can("finance.write") && !can("attendance.write") && t("attendance.roleBanner.accountant")}
        </div>
      )}

      {/* Global Filters */}
      <AttendanceFilters filters={filters} onChange={setFilters} />

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
            {renderContent()}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>
    </ModulePageShell>
  );
}
