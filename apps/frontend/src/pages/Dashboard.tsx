import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import StatsGrid from "../components/dashboard/StatsGrid";
import QuickActionsPanel from "../components/dashboard/QuickActionsPanel";
import NotificationsPanel from "../components/dashboard/NotificationsPanel";
import { resolveDashboardPersona, widgetMatchesPersona } from "@/lib/dashboardPersona";
import usePermissions from "@/hooks/usePermissions";
import type { Permission } from "@mms/shared";
import { DashboardWidgets, CustomWidget, WidgetBuilder, getOrInitializeCustomWidgets } from "../components/reports/PinnedWidgets";
import { computeCustomCard as computeCustomCardShared, CustomCard, type ReportCollection } from "../components/reports/reportMetadata";

import { getCollection, saveCollection } from "../lib/db";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useStudentsCollection } from "@/hooks/useStudents";
import { useTeachersCollection } from "@/hooks/useTeachers";
import { useContactsCollection } from "@/hooks/useContacts";
import { useAttendanceRecordsCollection } from "@/hooks/useAttendance";
import { useSessionsCollection } from "@/hooks/useSessions";
import useGlobalSettings from "@/hooks/useGlobalSettings";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import { INVOICES, type Invoice } from '@/lib/data/financeData';
import { DISTRIBUTIONS, type Distribution } from '@/lib/data/hasanatData';
import { QUESTIONS, TESTS, RESULTS } from '@/lib/data/questionBankData';
import { revenueData as defaultRevenueData } from '@/lib/data/dashboardData';
import { useAuth } from "@/lib/contexts/AuthContext";
import useTranslation from "@/hooks/useTranslation";
import {
  GraduationCap, CalendarCheck, BookOpen, UserCheck,
  DollarSign, AlertCircle, Star, TrendingUp, Receipt,
  Users, Target, ShieldCheck, Settings, Pencil, Trash2, Plus
} from "lucide-react";

// CustomCard interface imported from reportMetadata

const ICONS: Record<string, React.ElementType> = {
  GraduationCap, CalendarCheck, BookOpen, UserCheck, DollarSign, AlertCircle, Star, TrendingUp, Receipt,
  Users, Target, ShieldCheck
};

// Default KPI cards configurations schemas mapping standard dashboard metric keys


// ── Layout helpers ──────────────────────────────────────────────────────────
function Section({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}

// ── Role-specific dashboard bodies ─────────────────────────────────────────
function AdminDashboard(_props: { enabled: Record<string, boolean>; sectionSettings: Record<string, boolean>; isEditMode: boolean }) {
  return (
    <div className="space-y-6">
      {/* Quick actions + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Section><QuickActionsPanel role="admin" /></Section>
        </div>
        <Section><NotificationsPanel role="admin" /></Section>
      </div>
    </div>
  );
}

function TeacherDashboard(_props: { enabled: Record<string, boolean>; sectionSettings: Record<string, boolean>; isEditMode: boolean }) {
  return (
    <div className="space-y-6">
      {/* Quick actions + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Section><QuickActionsPanel role="teacher" /></Section>
        </div>
        <Section><NotificationsPanel role="teacher" /></Section>
      </div>
    </div>
  );
}

function AccountantDashboard(_props: { enabled: Record<string, boolean>; sectionSettings: Record<string, boolean>; isEditMode: boolean }) {
  return (
    <div className="space-y-6">
      {/* Quick actions + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Section><QuickActionsPanel role="accountant" /></Section>
        </div>
        <Section><NotificationsPanel role="accountant" /></Section>
      </div>
    </div>
  );
}

const BODIES = {
  admin: AdminDashboard,
  teacher: TeacherDashboard,
  accountant: AccountantDashboard,
};

function defaultWidgetCollection(can: (permission: Permission) => boolean): ReportCollection {
  if (can("students.write") || can("users.manage")) return "students";
  if (can("attendance.write")) return "sessions";
  return "finance_invoices";
}

function defaultWidgetCategory(can: (permission: Permission) => boolean): string {
  if (can("students.write") || can("users.manage")) return "students";
  if (can("attendance.write")) return "sessions";
  return "financial";
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
/**
 * Dashboard Page Component
 *
 * Renders the primary landing workspace tailored dynamically to the active user role (Admin,
 * Teacher, or Accountant). Integrates widgets for statistics, quick actions, today's attendance,
 * fee collection summaries, and system notifications.
 *
 * @returns React element representing the Dashboard view.
 */
export default function Dashboard() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { can } = usePermissions();
  const dashboardPersona = useMemo(() => resolveDashboardPersona(can), [can]);
  const globalSettings = useGlobalSettings();

  const students = useStudentsCollection();
  const teachers = useTeachersCollection();
  const sessions = useSessionsCollection();
  const invoices = useLiveCollection<Invoice>("finance_invoices", INVOICES);
  const attendanceRecords = useAttendanceRecordsCollection();
  const hasanatDistributions = useLiveCollection<Distribution>("hasanat_distributions", DISTRIBUTIONS);
  const contacts = useContactsCollection();
  const questions = useLiveCollection("questions", QUESTIONS);
  const tests = useLiveCollection("tests", TESTS);
  const assessmentResults = useLiveCollection("assessment_results", RESULTS);
  const revenueExpenses = useLiveCollection<{ revenue: number; expenses: number }>("revenue_expenses", defaultRevenueData);

  const enabledModules = globalSettings.enabledModules || {};

  const [isEditMode, setIsEditMode] = useState(false);

  // Card visibility settings state
  const [disabledCardIds, setDisabledCardIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("mms_dashboard_disabled_cards") || localStorage.getItem("dashboard_disabled_cards");
      if (saved) return JSON.parse(saved) as string[];
    } catch (e) {
      console.error(e);
    }
    return getCollection<string>("dashboard_disabled_cards", []);
  });

  // Custom widgets state
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>(() => {
    return getOrInitializeCustomWidgets();
  });

  const [isWidgetBuilderOpen, setIsWidgetBuilderOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<CustomWidget | null>(null);
  const [widgetBuilderType, setWidgetBuilderType] = useState<CustomWidget["widgetType"]>("card");

  const [sectionSettings, setSectionSettings] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("dashboard_section_settings");
      if (saved) return JSON.parse(saved) as Record<string, boolean>;
    } catch (e) {
      console.error("Failed to load section settings", e);
    }
    return {
      enrollmentChart: true,
      revenueChart: true,
      attendanceChart: true,
      hasanatChart: true,
      sessionsTable: true,
      todayAttendance: true,
      feeSummary: true,
      outstandingFees: true,
      overdueObligations: true
    };
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const savedCards = localStorage.getItem("mms_dashboard_disabled_cards") || localStorage.getItem("dashboard_disabled_cards");
        if (savedCards) {
          setDisabledCardIds(JSON.parse(savedCards) as string[]);
        } else {
          setDisabledCardIds(getCollection<string>("dashboard_disabled_cards", []));
        }
      } catch (e) {
        setDisabledCardIds(getCollection<string>("dashboard_disabled_cards", []));
      }
      try {
        const savedWidgets = localStorage.getItem("kpi_custom_widgets");
        if (savedWidgets) {
          setCustomWidgets(JSON.parse(savedWidgets) as CustomWidget[]);
        }
      } catch (e) {
        console.error(e);
      }
      try {
        const savedSettings = localStorage.getItem("dashboard_section_settings");
        if (savedSettings) {
          setSectionSettings(JSON.parse(savedSettings) as Record<string, boolean>);
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener("local-database-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("local-database-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleUnpinWidget = (id: string) => {
    const updated = customWidgets.map(w => {
      if (w.id === id) {
        return { ...w, isPinnedToDashboard: false };
      }
      return w;
    });
    setCustomWidgets(updated);
    localStorage.setItem("kpi_custom_widgets", JSON.stringify(updated));
    window.dispatchEvent(new Event("local-database-update"));
  };

  const handleDeleteWidget = (id: string) => {
    const updated = customWidgets.filter(w => w.id !== id);
    setCustomWidgets(updated);
    localStorage.setItem("kpi_custom_widgets", JSON.stringify(updated));
    window.dispatchEvent(new Event("local-database-update"));
  };

  const handleEditWidget = (w: CustomWidget) => {
    setEditingWidget(w);
    setWidgetBuilderType(w.widgetType || "kpi");
    setIsWidgetBuilderOpen(true);
  };

  const toggleWidgetPin = (id: string) => {
    const updated = customWidgets.map(w => {
      if (w.id === id) {
        return { ...w, isPinnedToDashboard: !w.isPinnedToDashboard };
      }
      return w;
    });
    setCustomWidgets(updated);
    localStorage.setItem("kpi_custom_widgets", JSON.stringify(updated));
    window.dispatchEvent(new Event("local-database-update"));
  };

  const handleResetWidgetsToDefaults = () => {
    const updated = customWidgets.map(w => {
      if (w.id.startsWith("def-")) {
        return { ...w, isPinnedToDashboard: true };
      }
      return { ...w, isPinnedToDashboard: false };
    });
    setCustomWidgets(updated);
    localStorage.setItem("kpi_custom_widgets", JSON.stringify(updated));
    window.dispatchEvent(new Event("local-database-update"));
  };

  const toggleCardVisibility = (cardId: string) => {
    let updated: string[];
    if (disabledCardIds.includes(cardId)) {
      updated = disabledCardIds.filter((id) => id !== cardId);
    } else {
      updated = [...disabledCardIds, cardId];
    }
    setDisabledCardIds(updated);
    saveCollection("dashboard_disabled_cards", updated);
    localStorage.setItem("mms_dashboard_disabled_cards", JSON.stringify(updated));
    window.dispatchEvent(new Event("local-database-update"));
  };

  const handleResetToDefaults = () => {
    setDisabledCardIds([]);
    saveCollection("dashboard_disabled_cards", []);
    localStorage.removeItem("mms_dashboard_disabled_cards");
    localStorage.removeItem("dashboard_disabled_cards");
    window.dispatchEvent(new Event("local-database-update"));
  };

  const dataByVolume = useMemo(() => {
    return students.length + sessions.length + invoices.length + attendanceRecords.length + hasanatDistributions.length + contacts.length;
  }, [students, sessions, invoices, attendanceRecords, hasanatDistributions, contacts]);

  const handleDeleteCustomCard = (cardId: string) => {
    handleDeleteWidget(cardId);
  };

  const activeCustomCards = useMemo(() => {
    return customWidgets.filter((w) => w.widgetType === "card" && widgetMatchesPersona(w.role, dashboardPersona) && !w.id.startsWith("def-"));
  }, [customWidgets, dashboardPersona]);

  // Preview memos migrated to DynamicCardBuilder component

  // 1. Admin & General Stats calculations
  const studentCount = students.length;
  const activeSessionsCount = sessions.filter((s) => s.status === "active").length;
  const activeClassesCount = sessions.filter((s) => s.status === "active").flatMap((s) => s.classes || []).length;

  // Attendance Today (or latest)
  const today = new Date().toISOString().slice(0, 10);
  let todayRecords = attendanceRecords.filter((r) => r.date === today);
  if (todayRecords.length === 0) {
    const dates = [...new Set(attendanceRecords.map((r) => r.date))].sort().reverse();
    if (dates.length > 0) {
      todayRecords = attendanceRecords.filter((r) => r.date === dates[0]);
    }
  }
  const attTotal = todayRecords.length;
  const attPresent = todayRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const attRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 87;

  // Fee Collection Summary calculations
  let totalCollected = 0;
  let totalOutstanding = 0;
  invoices.forEach((inv) => {
    if (inv.status === "cancelled") return;
    if (inv.status === "paid") {
      totalCollected += Number(inv.finalAmt || 0);
    } else if (inv.status === "partial") {
      totalCollected += Number(inv.paidAmt || 0);
      totalOutstanding += (Number(inv.finalAmt || 0) - Number(inv.paidAmt || 0));
    } else {
      totalOutstanding += Number(inv.finalAmt || 0);
    }
  });

  // Hasanat Points
  const totalHasanat = hasanatDistributions.reduce((sum, dist) => {
    let points = 50;
    if (String(dist.denominationName || "").toLowerCase().includes("silver")) points = 150;
    else if (String(dist.denominationName || "").toLowerCase().includes("gold")) points = 500;
    else if (String(dist.denominationName || "").toLowerCase().includes("platinum")) points = 1000;
    else if (String(dist.denominationName || "").toLowerCase().includes("diamond")) points = 2500;
    return sum + Number(dist.quantity || 1) * points;
  }, 0);

  // YTD Revenue & Expenses
  const totalRevenueYTD = revenueExpenses.reduce((s, r) => s + r.revenue, 0);
  const totalExpensesYTD = revenueExpenses.reduce((s, r) => s + r.expenses, 0);

  // 2. Teacher Stats calculations — driven by the logged-in user's identity
  const currentUserId = currentUser?.id ?? '';
  const currentUserName = currentUser?.name ?? '';
  const teacherClasses = sessions
    .flatMap((s) => s.classes || [])
    .filter((c) => c.teacherId === currentUserId || String(c.teacherName || "").toLowerCase() === currentUserName.toLowerCase());
  const teacherClassesCount = teacherClasses.length;
  const teacherSessionsCount = sessions.filter((s) =>
    (s.classes || []).some(
      (c) => c.teacherId === currentUserId || String(c.teacherName || "").toLowerCase() === currentUserName.toLowerCase()
    )
  ).length;

  const teacherClassIds = teacherClasses.map((c) => c.id);
  const teacherTodayRecords = todayRecords.filter((r) => teacherClassIds.includes(r.classId));
  const teacherAttTotal = teacherTodayRecords.length;
  const teacherAttPresent = teacherTodayRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const teacherAttRate = teacherAttTotal > 0 ? Math.round((teacherAttPresent / teacherAttTotal) * 100) : 0;

  const teacherHasanat = hasanatDistributions
    .filter((dist) => dist.issuedBy === currentUserId || String(dist.issuedBy || "").toLowerCase() === currentUserName.toLowerCase())
    .reduce((sum, dist) => {
      let points = 50;
      if (String(dist.denominationName || "").toLowerCase().includes("silver")) points = 150;
      else if (String(dist.denominationName || "").toLowerCase().includes("gold")) points = 500;
      else if (String(dist.denominationName || "").toLowerCase().includes("platinum")) points = 1000;
      else if (String(dist.denominationName || "").toLowerCase().includes("diamond")) points = 2500;
      return sum + Number(dist.quantity || 1) * points;
    }, 0);

  const stats = useMemo(() => {
    const isEn = (id: string) => enabledModules[id] !== false;
    
    // Filter customWidgets to get those of widgetType === "card" and role === role
    const cardWidgets = customWidgets.filter((w) => w.widgetType === "card" && widgetMatchesPersona(w.role, dashboardPersona));

    // Filter by module enablement
    const enabledCardWidgets = cardWidgets.filter((w) => {
      const coll = w.collection;
      const id = w.id;
      if (coll === "sessions") return isEn("sessions");
      if (coll === "attendance_records") return isEn("attendance");
      if (coll === "hasanat_distributions") return isEn("hasanat");
      if (coll === "finance_invoices") {
        if (id.includes("revenue") || id.includes("expenses") || w.category === "accounting") {
          return isEn("accounting");
        }
        return isEn("finance");
      }
      return true;
    });

    // Compute their values in real-time
    return enabledCardWidgets.map((w) => {
      const customCardConfig: CustomCard = {
        id: w.id,
        role: w.role,
        title: w.title,
        collection: w.collection,
        operation: w.operation || "count",
        targetField: w.targetField,
        filterField: w.filterField,
        filterOperator: w.filterOperator,
        filterValue: w.filterValue,
        icon: w.icon || "GraduationCap",
        color: w.color || "emerald",
        subTextType: w.subTextType || "dynamic",
        fixedSubText: w.fixedSubText,
        trend: w.trend,
        trendType: w.trendType
      };

      const result = computeCustomCardShared(customCardConfig, {
        students,
        teachers,
        sessions,
        finance_invoices: invoices,
        attendance_records: attendanceRecords,
        hasanat_distributions: hasanatDistributions,
        contacts,
        questions,
        tests,
        assessment_results: assessmentResults
      });

      return {
        id: result.id,
        title: result.title,
        value: result.value,
        sub: result.sub,
        icon: result.icon,
        color: result.color,
        trend: result.trend || 0
      };
    });
  }, [dashboardPersona, enabledModules, customWidgets, students, sessions, invoices, attendanceRecords, hasanatDistributions, contacts, questions, tests, assessmentResults]);

  const allCardsForRole = stats;
  const selectedCount = useMemo(() => {
    return allCardsForRole.filter((c) => !disabledCardIds.includes(c.id)).length;
  }, [allCardsForRole, disabledCardIds]);

  const visibleStats = useMemo(() => {
    return stats.filter((s) => !disabledCardIds.includes(s.id));
  }, [stats, disabledCardIds]);

  const Body = BODIES[dashboardPersona] ?? AdminDashboard;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <title>MMS - Dashboard</title>
      <meta name="description" content="Manage and monitor your madrasa parameters, track students, contacts, attendance, and finance." />
      {/* Header and Role switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t("dashboard.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isEditMode
                ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            type="button"
          >
            <Settings className="w-3.5 h-3.5" />
            {isEditMode ? t("dashboard.exitCustomization") : t("dashboard.customizeCards")}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden mb-6"
          >
            <div className="space-y-6">
              {/* Shared Dynamic Widget Builder */}
              <AnimatePresence>
                {isWidgetBuilderOpen && (
                  <div className="mb-6">
                    <WidgetBuilder
                      initialCollection={defaultWidgetCollection(can)}
                      editWidgetConfig={editingWidget}
                      onCancelEdit={() => {
                        setIsWidgetBuilderOpen(false);
                        setEditingWidget(null);
                      }}
                      onSaveWidget={(savedWidget) => {
                        const exists = customWidgets.some((w) => w.id === savedWidget.id);
                        let next: CustomWidget[];
                        if (exists) {
                          next = customWidgets.map((w) => w.id === savedWidget.id ? savedWidget : w);
                        } else {
                          next = [...customWidgets, savedWidget];
                        }
                        setCustomWidgets(next);
                        localStorage.setItem("kpi_custom_widgets", JSON.stringify(next));
                        setIsWidgetBuilderOpen(false);
                        setEditingWidget(null);
                        window.dispatchEvent(new Event("local-database-update"));
                      }}
                      category={defaultWidgetCategory(can)}
                      mode="dashboard"
                      initialWidgetType={widgetBuilderType}
                    />
                  </div>
                )}
              </AnimatePresence>

              {/* Display checkboxes panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* Dashboard Cards Settings Card */}
                <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{t("dashboard.cardsSettings")}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.cardsSettingsDesc")}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs border-b border-border/50 pb-3">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">{t("dashboard.selectedCards", { count: selectedCount })}</p>
                        <p className="text-[10px] text-muted-foreground">{t("dashboard.dataVolume", { count: dataByVolume })}</p>
                      </div>
                      <button
                        onClick={handleResetToDefaults}
                        className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        type="button"
                      >
                        {t("dashboard.resetDefaults")}
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                      {allCardsForRole.map((card) => {
                        const isChecked = !disabledCardIds.includes(card.id);
                        return (
                          <label
                            key={card.id}
                            className="flex items-start gap-3 p-2.5 rounded-xl border border-border/40 bg-card/20 hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCardVisibility(card.id)}
                              className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                            />
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-foreground leading-tight">{card.title}</p>
                              <p className="text-[10px] text-muted-foreground flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5" />
                                {t("dashboard.activeData")}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Dashboard Widgets Settings Card */}
                <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{t("dashboard.chartsSettings")}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.chartsSettingsDesc")}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs border-b border-border/50 pb-3">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">{t("dashboard.pinnedCharts", { count: customWidgets.filter(w => w.isPinnedToDashboard).length })}</p>
                        <p className="text-[10px] text-muted-foreground">{t("dashboard.totalWidgets", { count: customWidgets.length })}</p>
                      </div>
                      <button
                        onClick={handleResetWidgetsToDefaults}
                        className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        type="button"
                      >
                        {t("dashboard.resetDefaults")}
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {customWidgets.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-4 text-center">{t("dashboard.noWidgets")}</p>
                      ) : (
                        customWidgets.map((widget) => {
                          return (
                            <div
                              key={widget.id}
                              className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40 bg-card/20 hover:bg-muted/30 transition-colors"
                            >
                              <label className="flex items-start gap-3 cursor-pointer flex-1 select-none">
                                <input
                                  type="checkbox"
                                  checked={widget.isPinnedToDashboard}
                                  onChange={() => toggleWidgetPin(widget.id)}
                                  className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                                />
                                <div className="space-y-0.5">
                                  <p className="text-xs font-semibold text-foreground leading-tight">{widget.title}</p>
                                  <p className="text-[10px] text-muted-foreground capitalize flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-info mr-1.5" />
                                    {widget.collection.replace("_", " ")}
                                  </p>
                                </div>
                              </label>
                              
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleEditWidget(widget)}
                                  className="p-1 rounded border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                  title={t("dashboard.editWidget")}
                                  type="button"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {!widget.id.startsWith("def-") && (
                                  <button
                                    onClick={() => handleDeleteWidget(widget.id)}
                                    className="p-1 rounded border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                    title={t("dashboard.deleteWidget")}
                                    type="button"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        setEditingWidget(null);
                        setIsWidgetBuilderOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all bg-card/10 cursor-pointer"
                      type="button"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t("dashboard.createWidget")}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`stats-${dashboardPersona}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ErrorBoundary>
          <StatsGrid
            stats={visibleStats}
            customCardIds={activeCustomCards.map((c) => c.id)}
            onDeleteCustomCard={handleDeleteCustomCard}
            onEditCustomCard={(id) => {
              const widget = customWidgets.find((w) => w.id === id);
              if (widget) {
                setEditingWidget(widget);
                setWidgetBuilderType("card");
                setIsWidgetBuilderOpen(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            isEditMode={isEditMode}
            onAddCardClick={() => {
              setEditingWidget(null);
              setWidgetBuilderType("card");
              setIsWidgetBuilderOpen(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>

      {/* Pinned Custom Widgets */}
      <ErrorBoundary>
      <DashboardWidgets 
        widgets={customWidgets.filter((w) => w.isPinnedToDashboard)} 
        onUnpin={handleUnpinWidget} 
        isEditMode={isEditMode}
        onEditWidget={handleEditWidget}
        onDeleteWidget={handleDeleteWidget}
      />
      </ErrorBoundary>

      {/* Role body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`body-${dashboardPersona}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ErrorBoundary>
          <Body enabled={enabledModules} sectionSettings={sectionSettings} isEditMode={isEditMode} />
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}