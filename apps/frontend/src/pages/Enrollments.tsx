import React, { useState, useEffect, useCallback, useMemo } from "react";
import useConfigSubTabs from "@/hooks/useConfigSubTabs";
import useTranslation from "@/hooks/useTranslation";
import useModuleTierTabs from "@/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, UserCheck, BarChart2, Settings, LayoutDashboard } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ResponsiveAccordionTabs from "@/components/ui/ResponsiveAccordionTabs";
import SubTabBar from "@/components/ui/SubTabBar";
import usePermissions from "@/hooks/usePermissions";
import EnrollmentWizard from "../components/enrollment/EnrollmentWizard";
import EnrollmentList from "../components/enrollment/EnrollmentList";
import EnrollmentDetail from "../components/enrollment/EnrollmentDetail";
import EligibilityCheck from "../components/enrollment/EligibilityCheck";
import EnrollmentReports from "../components/enrollment/EnrollmentReports";
import EnrollmentsSettings from "../components/enrollment/EnrollmentsSettings";
import KPISummary from "../components/reports/KPISummary";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import { SAMPLE_ENROLLMENTS, Enrollment } from "../lib/enrollmentData";
import { STUDENTS } from "../lib/studentsData";
import { saveCollection } from "../lib/db";
import { useLiveCollection } from "../hooks/useLiveCollection";
import { useStudentsCollection } from "../hooks/useStudents";
import { useEnrollmentViewerRole } from "@/hooks/useViewerRole";

/**
 * Enrollments management page.
 * Allows managing student enrollment into sessions and classes with Dashboard and Settings tabs.
 * 
 * @returns {React.ReactElement} The Enrollments page component.
 */
export default function Enrollments() {
  const configSubTabs = useConfigSubTabs();
  const { t } = useTranslation();
  const SUB_TABS = useMemo(
    () => [
      { id: "list", label: t("enrollments.list"), icon: ClipboardList },
      { id: "new", label: t("enrollments.new"), icon: Plus },
      { id: "eligibility", label: t("enrollments.eligibility"), icon: UserCheck },
    ],
    [t]
  );
  const TABS = useModuleTierTabs();
  const [tab, setTab]                 = useState("operations");
  const [activeSubTab, setActiveSubTab] = useState("list");
  const role = useEnrollmentViewerRole();
  const { can } = usePermissions();
  const canWriteEnrollments = can("enrollments.write");
  const enrollments = useLiveCollection("enrollments");
  const students = useStudentsCollection();
  const [viewing, setViewing]         = useState<Enrollment | null>(null);
  const [subTab, setSubTab]           = useState("fields");

  const saveEnrollments = useCallback((updater: Enrollment[] | ((prev: Enrollment[]) => Enrollment[])) => {
    const next = typeof updater === "function" ? updater(enrollments) : updater;
    saveCollection("enrollments", next);
  }, [enrollments]);

  // Reset activeSubTab to list if role changes to accountant (since new and eligibility are restricted)
  useEffect(() => {
    if (!canWriteEnrollments && (activeSubTab === "new" || activeSubTab === "eligibility")) {
      setActiveSubTab("list");
    }
  }, [canWriteEnrollments, activeSubTab]);

  const handleComplete = (enrollment: Enrollment) => {
    saveEnrollments((prev) => [enrollment, ...prev]);
    
    // Update student's enrolledSessions in localStorage
    const updatedStudents = students.map((s) => {
      if (s.id === enrollment.studentId) {
        const enrolled = s.enrolledSessions || [];
        if (!enrolled.includes(enrollment.sessionId)) {
          return { ...s, enrolledSessions: [...enrolled, enrollment.sessionId] };
        }
      }
      return s;
    });
    saveCollection("students", updatedStudents);

    setActiveSubTab("list");
  };

  const handleCancel = (id: string) => {
    saveEnrollments((prev) => prev.map((e) =>
      e.id === id
        ? { ...e, status: "cancelled" as const, timeline: [...(e.timeline || []), { ts: new Date().toISOString(), event: "Enrollment cancelled", by: role }] }
        : e
    ));
  };

  const handleStatusChange = (id: string, newStatus: Enrollment["status"]) => {
    saveEnrollments((prev) => prev.map((e) =>
      e.id === id
        ? { ...e, status: newStatus, timeline: [...(e.timeline || []), { ts: new Date().toISOString(), event: `Status → ${newStatus}`, by: role }] }
        : e
    ));
    if (viewing?.id === id) setViewing((v) => v ? { ...v, status: newStatus } : v);
  };

  // Stats bar
  const total     = enrollments.length;
  const confirmed = enrollments.filter((e) => e.status === "confirmed").length;
  const pending   = enrollments.filter((e) => e.status === "pending").length;
  const revenue   = enrollments.filter((e) => e.status !== "cancelled").reduce((s, e) => s + (e.finalFee || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Enrollments Portal</title>
      <meta name="description" content="Review and register class enrollments, verify student class allocations, and generate admissions reports." />
      <PageHeader
        icon={ClipboardList}
        title={t("nav.enrollments")}
        subtitle={t("page.enrollments.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            {canWriteEnrollments && (
              <button onClick={() => { setTab("operations"); setActiveSubTab("new"); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" /> {t("enrollments.new")}
              </button>
            )}
          </div>
        }
      />

      <ResponsiveAccordionTabs
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        panelIdPrefix="enrollments-tab"
      >
      {/* Sub-tabs for Operations */}
      {tab === "operations" && (
        <SubTabBar
          tabs={SUB_TABS
            .filter((item) => canWriteEnrollments || (item.id !== "new" && item.id !== "eligibility"))
            .map((item) => ({ key: item.id, label: item.label }))}
          value={activeSubTab}
          onChange={setActiveSubTab}
        />
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab + "-" + activeSubTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {tab === "analytics" && (
            <ErrorBoundary>
              <div className="space-y-4">
                <KPISummary category="enrollments" />
                <EnrollmentReports enrollments={enrollments} />
              </div>
            </ErrorBoundary>
          )}
          {tab === "operations" && activeSubTab === "new" && (
            <div className="max-w-2xl">
              <ErrorBoundary>
                <EnrollmentWizard
                  onComplete={handleComplete}
                  onCancel={() => setActiveSubTab("list")}
                />
              </ErrorBoundary>
            </div>
          )}

          {tab === "operations" && activeSubTab === "list" && (
            <ErrorBoundary>
              <EnrollmentList
                enrollments={enrollments}
                role={role}
                onView={(enr: Enrollment) => setViewing(enr)}
                onCancel={handleCancel}
              />
            </ErrorBoundary>
          )}

          {tab === "operations" && activeSubTab === "eligibility" && (
            <ErrorBoundary>
              <EligibilityCheck />
            </ErrorBoundary>
          )}

          {tab === "configuration" && (
            <ErrorBoundary>
              <div className="space-y-4">
                <SubTabBar
                  tabs={configSubTabs.map((item) => ({ key: item.id, label: item.label }))}
                  value={subTab}
                  onChange={setSubTab}
                />
                <EnrollmentsSettings mode={subTab as "fields" | "preferences"} />
              </div>
            </ErrorBoundary>
          )}
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      {/* Detail panel */}
      <AnimatePresence>
        {viewing && (
          <ErrorBoundary>
            <EnrollmentDetail
              enrollment={viewing}
              role={role}
              onClose={() => setViewing(null)}
              onStatusChange={handleStatusChange}
            />
          </ErrorBoundary>
        )}
      </AnimatePresence>
    </div>
  );
}