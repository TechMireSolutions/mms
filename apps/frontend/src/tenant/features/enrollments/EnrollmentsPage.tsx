import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { EnrollmentWizard } from "@/tenant/features/enrollments/components/EnrollmentWizard";
import { EnrollmentList } from "@/tenant/features/enrollments/components/EnrollmentList";
import { EnrollmentsCommandMetrics } from "@/tenant/features/enrollments/components/EnrollmentsCommandMetrics";
import { EnrollmentDetail } from "@/tenant/features/enrollments/components/EnrollmentDetail";
import { EligibilityCheck } from "@/tenant/features/enrollments/components/EligibilityCheck";
import { EnrollmentReports } from "@/tenant/features/enrollments/components/EnrollmentReports";
import { EnrollmentsSettings } from "@/tenant/features/enrollments/components/EnrollmentsSettings";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Modal } from "@/components/ui/Modal";
import { Enrollment } from '@/lib/data/enrollmentData';
import { useEnrollmentsCollection, useEnrollmentMutations } from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import { useStudentMutations, type StudentRecord } from "@/tenant/features/students/hooks/useStudents";
import { apiJson } from "@/lib/apiClient";
import { STUDENTS_MODULE_CONTRACT } from "@mms/shared";
import { useEnrollmentViewerRole } from "@/tenant/hooks/useViewerRole";
import { useEnrollmentColumnLayout } from "@/tenant/features/enrollments/hooks/useEnrollmentColumnLayout";

/**
 * Enrollments management — Work | Reports | Setup.
 *
 * @returns {React.ReactElement} The Enrollments page component.
 */
export default function Enrollments() {
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
  const enrollments = useEnrollmentsCollection();
  const { createEnrollment, updateEnrollment } = useEnrollmentMutations();
  const { updateStudent } = useStudentMutations();
  const [viewing, setViewing]         = useState<Enrollment | null>(null);
  const [showWizard, setShowWizard]   = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);
  const columnLayout = useEnrollmentColumnLayout();

  // Reset activeSubTab to list if role changes to accountant (since new and eligibility are restricted)
  useEffect(() => {
    if (!canWriteEnrollments && activeSubTab === "eligibility") {
      setActiveSubTab("list");
    }
  }, [canWriteEnrollments, activeSubTab]);

  const handleComplete = async (enrollment: Enrollment) => {
    createEnrollment.mutate(enrollment, {
      onSuccess: async () => {
        try {
          const studentsResponse = await apiJson<{ students: StudentRecord[] }>(
            `${STUDENTS_MODULE_CONTRACT.restBasePath}/resolve`,
            {
              method: 'POST',
              body: JSON.stringify({ ids: [String(enrollment.studentId)] }),
            },
          );
          const student = studentsResponse.students[0];
          if (student) {
            const enrolled = (student.enrolledSessions as string[] | undefined) ?? [];
            if (!enrolled.includes(enrollment.sessionId)) {
              updateStudent.mutate({
                id: String(student.id),
                student: { ...student, enrolledSessions: [...enrolled, enrollment.sessionId] },
              });
            }
          }
        } catch (error) {
          console.error('Failed to update student enrolled sessions', error);
        }
        setShowWizard(false);
        setActiveSubTab("list");
      }
    });
  };

  const handleCancel = (id: string) => {
    const enrollment = enrollments.find((candidate) => candidate.id === id);
    if (!enrollment) return;
    updateEnrollment.mutate({
      id,
      enrollment: {
        ...enrollment,
        status: "cancelled" as const,
        timeline: [...(enrollment.timeline || []), { ts: new Date().toISOString(), event: "Enrollment cancelled", by: role }]
      }
    });
  };

  const handleStatusChange = (id: string, newStatus: Enrollment["status"]) => {
    const enrollment = enrollments.find((candidate) => candidate.id === id);
    if (!enrollment) return;
    const updated: Enrollment = {
      ...enrollment,
      status: newStatus,
      timeline: [...(enrollment.timeline || []), { ts: new Date().toISOString(), event: `Status → ${newStatus}`, by: role }]
    };
    updateEnrollment.mutate({
      id,
      enrollment: updated,
    }, {
      onSuccess: () => {
        if (viewing?.id === id) setViewing(updated);
      }
    });
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
                onView={(enrollment: Enrollment) => setViewing(enrollment)}
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
              <EnrollmentsSettings mode="preferences" />
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
