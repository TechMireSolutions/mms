import React, { useState, useCallback, useMemo } from "react";
import { useConfigSubTabs } from "@/hooks/useConfigSubTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useModuleTierTabs } from "@/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, ClipboardEdit, BookOpen, BarChart2,
  ShieldCheck, ClipboardList,
} from "lucide-react";
import { resolveModuleTierTab } from "@mms/shared";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { AttendanceFilters } from "../components/attendance/AttendanceFilters";
import { MarkAttendance } from "../components/attendance/MarkAttendance";
import { AttendanceRecords } from "../components/attendance/AttendanceRecords";
import { AttendanceAnalytics } from "../components/attendance/AttendanceAnalytics";
import { AttendanceSettings } from "../components/attendance/AttendanceSettings";
import { AuditLog } from "../components/attendance/AuditLog";
import { AttendanceCommandMetrics } from "../components/attendance/AttendanceCommandMetrics";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { saveCollection } from "../lib/db";
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import {
  useAttendanceRecordsCollection,
  useAttendanceMutations,
  ATTENDANCE_QUERY_KEY,
} from '@/hooks/useAttendance';
import { useAttendanceColumnLayout } from '@/hooks/useAttendanceColumnLayout';
import { useQueryClient } from '@tanstack/react-query';
import { useViewerRole } from "@/hooks/useViewerRole";
import { usePermissions } from "@/hooks/usePermissions";

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
  const PAGE_TABS = useModuleTierTabs();
  const configSubTabs = useConfigSubTabs();
  const { t } = useTranslation();
  const role = useViewerRole();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState("work");
  const [activeOpsTab, setActiveOpsTab] = useState("mark");
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("charts");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const queryClient = useQueryClient();
  const records = useAttendanceRecordsCollection();
  const { replaceAll } = useAttendanceMutations();
  const [subTab, setSubTab] = useState("fields");
  const columnLayout = useAttendanceColumnLayout();

  const pageFilteredCount = useMemo(() => {
    return records.filter((record) => {
      if (filters.classId && record.classId !== filters.classId) return false;
      if (filters.date && record.date !== filters.date) return false;
      return true;
    }).length;
  }, [records, filters.classId, filters.date]);

  const setRecords = useCallback((updater: React.SetStateAction<AttendanceRecord[]>) => {
    const next = typeof updater === "function" ? updater(records) : updater;
    saveCollection("attendance_records", next);
    queryClient.setQueryData(ATTENDANCE_QUERY_KEY, next);
    replaceAll.mutate(next);
  }, [records, replaceAll, queryClient]);



  const canSeeAttendanceAnalytics = can("analytics.view")
    && (can("users.manage") || can("attendance.write") || can("enrollments.write") || !can("finance.write"));

  const visibleTopTabs = PAGE_TABS.filter((tab) => {
    if (tab.id === "setup") return can("settings.global.write");
    if (tab.id === "reports") return canSeeAttendanceAnalytics;
    return true;
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
        <div className="space-y-4">
          <SubTabBar
            tabs={configSubTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
            value={subTab}
            onChange={setSubTab}
          />
          <AttendanceSettings role={role} mode={subTab as "fields" | "preferences"} />
        </div>
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
            <AttendanceAnalytics filters={filters} records={records} />
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
            case "mark":    return <MarkAttendance filters={filters} role={role} records={records} setRecords={setRecords} />;
            case "records": return (
              <AttendanceRecords
                filters={filters}
                role={role}
                records={records}
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
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Attendance Tracker</title>
      <meta name="description" content="Track student daily attendance, view real-time class stats, and perform attendance auditing." />
      <PageHeader
        icon={UserCheck}
        title={t("nav.attendance")}
        subtitle={t("page.attendance.subtitle")}
      />

      <AttendanceCommandMetrics
        total={records.length}
        shown={pageFilteredCount}
        selectedDate={filters.date}
      />

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
    </div>
  );
}