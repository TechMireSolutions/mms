import React, { useState, useEffect, useMemo } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, UserCheck } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
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
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { ActionButton } from "@/components/ui/ActionButton";
import { Enrollment } from '@/lib/data/enrollmentData';
import {
  useEnrollmentsCollection,
  useEnrollmentsPaginated,
  useEnrollmentMutations,
} from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import { useStudentMutations, type StudentRecord } from "@/tenant/features/students/hooks/useStudents";
import { apiJson } from "@/lib/apiClient";
import { notify } from "@/lib/notify";
import { STUDENTS_MODULE_CONTRACT, ENROLLMENTS_MODULE_CONTRACT } from "@mms/shared";
import { useEnrollmentViewerRole } from "@/tenant/hooks/useViewerRole";
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
  } = useModulePermissions(ENROLLMENTS_MODULE_CONTRACT);
  const TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const [tab, setTab]                 = usePersistedTabState<string>("enrollments_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("list");
  const role = useEnrollmentViewerRole();
  const [showDeleted, setShowDeleted] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const activeEnrollments = useEnrollmentsCollection();
  const { data: deletedPage } = useEnrollmentsPaginated({
    page: 1,
    limit: ENROLLMENTS_MODULE_CONTRACT.maxPageSize,
    includeDeleted: true,
    enabled: showDeleted,
  });
  const enrollments = showDeleted
    ? ((deletedPage?.enrollments ?? []) as Enrollment[])
    : activeEnrollments;
  const {
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    restoreEnrollment,
  } = useEnrollmentMutations();
  const { updateStudent } = useStudentMutations();
  const [viewing, setViewing]         = useState<Enrollment | null>(null);
  const [showWizard, setShowWizard]   = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);
  const columnLayout = useEnrollmentColumnLayout();

  useEffect(() => {
    if (!canWriteEnrollments && activeSubTab === "eligibility") {
      setActiveSubTab("list");
    }
  }, [canWriteEnrollments, activeSubTab]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        if (canWriteEnrollments && !showDeleted) {
          event.preventDefault();
          setTab("work");
          setShowWizard(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canWriteEnrollments, showDeleted, setTab]);

  const handleComplete = async (enrollment: Enrollment) => {
    try {
      await createEnrollment.mutateAsync(enrollment);
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
      notify.success(t("enrollments.toast.created"));
      setActiveSubTab("list");
    } catch (error) {
      notify.error(t("enrollments.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleCancel = (id: string) => {
    const enrollment = enrollments.find((candidate) => candidate.id === id);
    if (!enrollment) return;
    updateEnrollment.mutate({
      id,
      enrollment: {
        ...enrollment,
        status: "cancelled" as const,
        timeline: [
          ...(enrollment.timeline || []),
          { ts: new Date().toISOString(), event: t("enrollments.timeline.cancelled"), by: role },
        ],
      },
    }, {
      onSuccess: () => notify.info(t("enrollments.toast.cancelled")),
      onError: (err) => notify.error(t("enrollments.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleDelete = (id: string) => {
    deleteEnrollment.mutate(id, {
      onSuccess: () => {
        notify.info(t("enrollments.toast.deleted"));
        if (viewing?.id === id) setViewing(null);
      },
      onError: (err) => notify.error(t("enrollments.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleRestore = (id: string) => {
    restoreEnrollment.mutate(id, {
      onSuccess: () => notify.success(t("enrollments.toast.restored")),
      onError: (err) => notify.error(t("enrollments.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleStatusChange = (id: string, newStatus: Enrollment["status"]) => {
    const enrollment = enrollments.find((candidate) => candidate.id === id);
    if (!enrollment) return;
    const updated: Enrollment = {
      ...enrollment,
      status: newStatus,
      timeline: [
        ...(enrollment.timeline || []),
        {
          ts: new Date().toISOString(),
          event: t("enrollments.timeline.statusChange", { status: newStatus }),
          by: role,
        },
      ],
    };
    updateEnrollment.mutate({
      id,
      enrollment: updated,
    }, {
      onSuccess: () => {
        if (viewing?.id === id) setViewing(updated);
        notify.success(t("enrollments.toast.updated"));
      },
      onError: (err) => notify.error(t("enrollments.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

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
      {tab === "work" && (
        <SubTabBar
          tabs={SUB_TABS
            .filter((item) => canWriteEnrollments || item.id !== "eligibility")
            .map((item) => ({ key: item.id, label: item.label }))}
          value={activeSubTab}
          onChange={setActiveSubTab}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div key={tab + "-" + activeSubTab + (showDeleted ? "-trash" : "")}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {tab === "reports" && (
            <ErrorBoundary>
              <div className="space-y-4">
                <KPISummary category="enrollments" />
                <EnrollmentReports enrollments={activeEnrollments} />
              </div>
            </ErrorBoundary>
          )}
          {tab === "work" && activeSubTab === "list" && (
            <ErrorBoundary>
              <EnrollmentList
                enrollments={enrollments}
                canWrite={canWriteEnrollments}
                canDelete={canDelete}
                showDeleted={showDeleted}
                onShowDeletedChange={setShowDeleted}
                onView={(enrollment: Enrollment) => setViewing(enrollment)}
                onCancel={handleCancel}
                onDelete={(id) => setPendingDeleteId(id)}
                onRestore={handleRestore}
                onFilteredCountChange={setFilteredCount}
                isColumnVisible={columnLayout.isColumnVisible}
                getColumnWidth={columnLayout.getColumnWidth}
                onColumnResize={columnLayout.setColumnWidth}
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
              <EnrollmentsSettings />
            </ErrorBoundary>
          )}
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        {viewing && !showDeleted && (
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

      <ConfirmAlertDialog
        open={pendingDeleteId != null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        title={t("enrollments.confirmDeleteTitle")}
        description={t("enrollments.confirmDeleteDescription")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (pendingDeleteId) handleDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </ModulePageShell>
  );
}
