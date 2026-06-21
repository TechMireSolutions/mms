import React, { useState, useEffect, useCallback, useMemo } from "react";
import useConfigSubTabs from "@/hooks/useConfigSubTabs";
import useTranslation from "@/hooks/useTranslation";
import useModuleTierTabs from "@/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, UserCheck } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ResponsiveAccordionTabs from "@/components/ui/ResponsiveAccordionTabs";
import SubTabBar from "@/components/ui/SubTabBar";
import usePermissions from "@/hooks/usePermissions";
import EnrollmentWizard from "../components/enrollment/EnrollmentWizard";
import EnrollmentList from "../components/enrollment/EnrollmentList";
import EnrollmentsCommandMetrics from "../components/enrollment/EnrollmentsCommandMetrics";
import EnrollmentDetail from "../components/enrollment/EnrollmentDetail";
import EligibilityCheck from "../components/enrollment/EligibilityCheck";
import EnrollmentReports from "../components/enrollment/EnrollmentReports";
import EnrollmentsSettings from "../components/enrollment/EnrollmentsSettings";
import KPISummary from "../components/reports/KPISummary";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import Modal from "../components/ui/Modal";
import { Enrollment } from '@/lib/data/enrollmentData';
import { saveCollection } from "../lib/db";
import { useLiveCollection } from "../hooks/useLiveCollection";
import { useStudentMutations, type StudentRecord } from "../hooks/useStudents";
import { apiJson } from "@/lib/apiClient";
import { STUDENTS_MODULE_CONTRACT } from "@mms/shared";
import { useEnrollmentViewerRole } from "@/hooks/useViewerRole";
import { useEnrollmentColumnLayout } from "@/hooks/useEnrollmentColumnLayout";

/**
 * Enrollments management — Work | Reports | Setup.
 *
 * @returns {React.ReactElement} The Enrollments page component.
 */
export default function Enrollments() {
  const configSubTabs = useConfigSubTabs();
  const { t } = useTranslation();
  const SUB_TABS = useMemo(
    () => [
      { id: "list", label: t("enrollments.list"), icon: ClipboardList },
      { id: "eligibility", label: t("enrollments.eligibility"), icon: UserCheck },
    ],
    [t]
  );
  const TABS = useModuleTierTabs();
  const [tab, setTab]                 = useState("work");
  const [activeSubTab, setActiveSubTab] = useState("list");
  const role = useEnrollmentViewerRole();
  const { can } = usePermissions();
  const canWriteEnrollments = can("enrollments.write");
  const enrollments = useLiveCollection("enrollments");
  const { updateStudent } = useStudentMutations();
  const [viewing, setViewing]         = useState<Enrollment | null>(null);
  const [subTab, setSubTab]           = useState("fields");
  const [showWizard, setShowWizard]   = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);
  const columnLayout = useEnrollmentColumnLayout();

  const saveEnrollments = useCallback((updater: Enrollment[] | ((prev: Enrollment[]) => Enrollment[])) => {
    const next = typeof updater === "function" ? updater(enrollments) : updater;
    saveCollection("enrollments", next);
  }, [enrollments]);

  // Reset activeSubTab to list if role changes to accountant (since new and eligibility are restricted)
  useEffect(() => {
    if (!canWriteEnrollments && activeSubTab === "eligibility") {
      setActiveSubTab("list");
    }
  }, [canWriteEnrollments, activeSubTab]);

  const handleComplete = async (enrollment: Enrollment) => {
    saveEnrollments((prev) => [enrollment, ...prev]);

    try {
      const body = await apiJson<{ students: StudentRecord[] }>(
        `${STUDENTS_MODULE_CONTRACT.restBasePath}/resolve`,
        {
          method: 'POST',
          body: JSON.stringify({ ids: [String(enrollment.studentId)] }),
        },
      );
      const student = body.students[0];
      if (student) {
        const enrolled = (student.enrolledSessions as string[] | undefined) ?? [];
        if (!enrolled.includes(enrollment.sessionId)) {
          updateStudent.mutate({
            id: String(student.id),
            student: { ...student, enrolledSessions: [...enrolled, enrollment.sessionId] },
          });
        }
      }
    } catch (err) {
      console.error('Failed to update student enrolled sessions', err);
    }

    setShowWizard(false);
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

  // Stats bar — server metrics via EnrollmentsCommandMetrics; filtered count from list
  useEffect(() => {
    setFilteredCount(enrollments.length);
  }, [enrollments.length]);

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
              <button onClick={() => { setTab("work"); setShowWizard(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" /> {t("enrollments.new")}
              </button>
            )}
          </div>
        }
      />

      <EnrollmentsCommandMetrics total={enrollments.length} shown={filteredCount} />

      <ResponsiveAccordionTabs
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        panelIdPrefix="enrollments-tab"
      >
      {/* Work tier sub-tabs */}
      {tab === "work" && (
        <SubTabBar
          tabs={SUB_TABS
            .filter((item) => canWriteEnrollments || item.id !== "eligibility")
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
          {tab === "reports" && (
            <ErrorBoundary>
              <div className="space-y-4">
                <KPISummary category="enrollments" />
                <EnrollmentReports enrollments={enrollments} />
              </div>
            </ErrorBoundary>
          )}
          {tab === "work" && activeSubTab === "list" && (
            <ErrorBoundary>
              <EnrollmentList
                enrollments={enrollments}
                canWrite={canWriteEnrollments}
                onView={(enr: Enrollment) => setViewing(enr)}
                onCancel={handleCancel}
                onFilteredCountChange={setFilteredCount}
                isColumnVisible={columnLayout.isColumnVisible}
                columnCustomizer={{
                  columnRegistry: columnLayout.columnRegistry,
                  updateUserColumnLayout: columnLayout.updateUserColumnLayout,
                  labels: columnLayout.customizerLabels,
                }}
              />
            </ErrorBoundary>
          )}

          {tab === "work" && activeSubTab === "eligibility" && (
            <ErrorBoundary>
              <EligibilityCheck />
            </ErrorBoundary>
          )}

          {tab === "setup" && (
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
              canWrite={canWriteEnrollments}
              onClose={() => setViewing(null)}
              onStatusChange={handleStatusChange}
            />
          </ErrorBoundary>
        )}
      </AnimatePresence>

      <Modal
        open={showWizard}
        onClose={() => setShowWizard(false)}
        title={t("enrollments.new")}
        size="xl"
        panelClassName="h-[88vh] max-h-[700px]"
      >
        <ErrorBoundary>
          <EnrollmentWizard
            onComplete={handleComplete}
            onCancel={() => setShowWizard(false)}
          />
        </ErrorBoundary>
      </Modal>
    </div>
  );
}
