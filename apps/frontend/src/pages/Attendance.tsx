import React, { useState, useCallback, useEffect, useMemo } from "react";
import useConfigSubTabs from "@/hooks/useConfigSubTabs";
import useTranslation from "@/hooks/useTranslation";
import useModuleTierTabs from "@/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, ClipboardEdit, BookOpen, BarChart2, Settings,
  ShieldCheck, ClipboardList, LayoutDashboard
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ResponsiveAccordionTabs from "@/components/ui/ResponsiveAccordionTabs";
import SubTabBar from "@/components/ui/SubTabBar";
import AttendanceFilters from "../components/attendance/AttendanceFilters";
import MarkAttendance from "../components/attendance/MarkAttendance";
import AttendanceRecords from "../components/attendance/AttendanceRecords";
import AttendanceAnalytics from "../components/attendance/AttendanceAnalytics";
import AttendanceSettings from "../components/attendance/AttendanceSettings";
import AuditLog from "../components/attendance/AuditLog";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import { saveCollection, getObject, saveObject } from "../lib/db";
import { ATTENDANCE_RECORDS, DEFAULT_ATT_SETTINGS, type AttendanceRecord } from "../lib/attendanceData";
import { useLiveCollection } from "../hooks/useLiveCollection";
import { useViewerRole, type ViewerRole } from "@/hooks/useViewerRole";
import usePermissions from "@/hooks/usePermissions";

const ROLE_BADGE: Record<Exclude<ViewerRole, "admin">, string> = {
  teacher: "bg-amber-50 text-amber-700",
  accountant: "bg-blue-50 text-blue-700",
};

const DEFAULT_FILTERS = {
  sessionId: "",
  classId: "",
  teacherId: "",
  date: new Date().toISOString().slice(0, 10),
};

/**
 * Attendance page component.
 * Allows tracking, managing, and analyzing student attendance.
 * 
 * @returns {React.ReactElement} The Attendance page component.
 */
export default function Attendance() {
  const PAGE_TABS = useModuleTierTabs();
  const configSubTabs = useConfigSubTabs();
  const { t } = useTranslation();
  const role = useViewerRole();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState("operations");
  const [activeOpsTab, setActiveOpsTab] = useState("mark");
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("charts");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const records = useLiveCollection("attendance_records");
  const [settings, setSettings] = useState(() => getObject("attendance_settings", DEFAULT_ATT_SETTINGS));
  const [subTab, setSubTab]   = useState("fields");

  const setRecords = useCallback((updater: React.SetStateAction<AttendanceRecord[]>) => {
    const next = typeof updater === "function" ? updater(records) : updater;
    saveCollection("attendance_records", next);
  }, [records]);

  useEffect(() => {
    saveObject("attendance_settings", settings);
  }, [settings]);

  const visibleTopTabs = PAGE_TABS.filter((t) => {
    if (t.id === "configuration") return can("settings.global.write");
    if (t.id === "analytics") return can("analytics.view") && role !== "accountant";
    return true;
  });

  const visibleOperationsTabs = useMemo(
    () => [
      { id: "mark",    label: t("attendance.tabs.mark"),    icon: ClipboardEdit, roles: ["admin", "teacher"] as ViewerRole[] },
      { id: "records", label: t("attendance.tabs.records"), icon: BookOpen,      roles: ["admin", "teacher", "accountant"] as ViewerRole[] },
      { id: "audit",   label: t("attendance.tabs.audit"),   icon: ClipboardList, roles: ["admin"] as ViewerRole[] },
    ].filter((tab) => tab.roles.includes(role)),
    [t, role]
  );

  const visibleAnalyticsTabs = useMemo(
    () => [
      { id: "charts",  label: t("attendance.tabs.analyticsCharts"), icon: BarChart2,     roles: ["admin", "teacher"] as ViewerRole[] },
      { id: "reports", label: t("attendance.tabs.reports"),         icon: ClipboardList, roles: ["admin", "teacher"] as ViewerRole[] },
    ].filter((tab) => tab.roles.includes(role)),
    [t, role]
  );

  const effectiveTab = visibleTopTabs.find((t) => t.id === activeTab) ? activeTab : "operations";
  const effectiveOpsTab = visibleOperationsTabs.find((t) => t.id === activeOpsTab) ? activeOpsTab : (visibleOperationsTabs[0]?.id || "records");
  const effectiveAnalyticsTab = visibleAnalyticsTabs.find((t) => t.id === activeAnalyticsTab) ? activeAnalyticsTab : (visibleAnalyticsTabs[0]?.id || "reports");

  const renderContent = () => {
    if (effectiveTab === "configuration") {
      return (
        <div className="space-y-4">
          <SubTabBar
            tabs={configSubTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
            value={subTab}
            onChange={setSubTab}
          />
          <AttendanceSettings role={role} settings={settings} setSettings={setSettings} mode={subTab as "fields" | "preferences"} />
        </div>
      );
    }

    if (effectiveTab === "analytics") {
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
            <ModuleReports category="attendance" role={role} />
          )}
        </div>
      );
    }

    // Operations Tab
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
            case "records": return <AttendanceRecords filters={filters} role={role} records={records} setRecords={setRecords} />;
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

      <ResponsiveAccordionTabs
        tabs={visibleTopTabs}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        hideWhenSingle
        panelIdPrefix="attendance-tab"
      >
      {/* Role info banner */}
      {role !== "admin" && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${ROLE_BADGE[role]} border border-current/20`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-bold capitalize">{role} view:</span>
          {role === "teacher"    && "Can mark and view attendance for assigned classes. No admin settings access."}
          {role === "accountant" && "View-only access to attendance records."}
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