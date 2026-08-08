import { useTranslation } from "@/hooks/useTranslation";
import { apiJson } from "@/lib/apiClient";
import { notify } from "@/lib/notify";
import type { Enrollment } from "@/lib/data/enrollmentData";
import { useStudentMutations, type StudentRecord } from "@/tenant/hooks/collections/students";
import { useEnrollmentViewerRole } from "@/tenant/hooks/useViewerRole";
import {
  useEnrollmentMutations,
} from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import { STUDENTS_MODULE_MANIFEST } from "@mms/shared";

interface UseEnrollmentsPageActionsParams {
  enrollments: Enrollment[];
  viewing: Enrollment | null;
  onViewingChange: (enrollment: Enrollment | null) => void;
  onActiveSubTabChange: (subTab: string) => void;
}

export function useEnrollmentsPageActions({
  enrollments,
  viewing,
  onViewingChange,
  onActiveSubTabChange,
}: UseEnrollmentsPageActionsParams) {
  const { t } = useTranslation();
  const role = useEnrollmentViewerRole();
  const {
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    restoreEnrollment,
  } = useEnrollmentMutations();
  const { updateStudent } = useStudentMutations();

  const handleComplete = async (enrollment: Enrollment) => {
    try {
      await createEnrollment.mutateAsync(enrollment);
      try {
        const studentsResponse = await apiJson<{ students: StudentRecord[] }>(
          `${STUDENTS_MODULE_MANIFEST.restBasePath}/resolve`,
          {
            method: "POST",
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
        console.error("Failed to update student enrolled sessions", error);
      }
      notify.success(t("enrollments.toast.created"));
      onActiveSubTabChange("list");
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

  const handleDelete = (id: string, deletionReason?: string) => {
    deleteEnrollment.mutate({ id, deletionReason }, {
      onSuccess: () => {
        notify.info(t("enrollments.toast.deleted"));
        if (viewing?.id === id) onViewingChange(null);
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
        if (viewing?.id === id) onViewingChange(updated);
        notify.success(t("enrollments.toast.updated"));
      },
      onError: (err) => notify.error(t("enrollments.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  return {
    handleComplete,
    handleCancel,
    handleDelete,
    handleRestore,
    handleStatusChange,
  };
}
