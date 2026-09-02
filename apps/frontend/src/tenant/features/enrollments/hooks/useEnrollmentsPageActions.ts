import { useTranslation } from "@/hooks/useTranslation";
import { apiContract } from "@/lib/api";
import { notify } from "@/lib/notify";
import type { Enrollment } from "@/lib/data/enrollmentData";
import type { StudentRecord } from "@mms/shared";
import { useStudentMutations } from "@/tenant/hooks/collections/students";
import { useEnrollmentViewerRole } from "@/tenant/hooks/useViewerRole";
import {
  useEnrollmentMutations,
} from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";

export interface UseEnrollmentsPageActionsParams {
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
    bulkDeleteEnrollments,
    bulkRestoreEnrollments,
  } = useEnrollmentMutations();
  const { updateStudent } = useStudentMutations();

  const handleComplete = async (enrollment: Enrollment) => {
    try {
      await createEnrollment.mutateAsync(enrollment);
      try {
        const res = await apiContract.students.resolve({
          body: { ids: [String(enrollment.studentId)] },
        });
        const body = res.body as {
          students?: Array<StudentRecord & { enrolledSessions?: string[] }>;
        };
        const student = body.students?.[0];
        if (student) {
          const enrolled = student.enrolledSessions ?? [];
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
      onActiveSubTabChange("directory");
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
      onError: (err: unknown) => notify.error(t("enrollments.toast.saveFailed"), {
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
      onError: (err: unknown) => notify.error(t("enrollments.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleRestore = (id: string) => {
    restoreEnrollment.mutate(id, {
      onSuccess: () => notify.success(t("enrollments.toast.restored")),
      onError: (err: unknown) => notify.error(t("enrollments.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleBulkDelete = (ids: string[], deletionReason?: string) => {
    bulkDeleteEnrollments.mutate({ ids, deletionReason }, {
      onSuccess: (raw: unknown) => {
        const result = (raw ?? {}) as { succeeded?: number; failed?: number };
        notify.success(
          (result.failed ?? 0) > 0
            ? t("enrollments.toast.bulkPartial", { succeeded: result.succeeded ?? 0, failed: result.failed ?? 0 })
            : t("enrollments.toast.bulkDeleted", { count: result.succeeded ?? ids.length }),
        );
      },
      onError: (err: unknown) => notify.error(t("enrollments.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleBulkRestore = (ids: string[]) => {
    bulkRestoreEnrollments.mutate(ids, {
      onSuccess: (raw: unknown) => {
        const result = (raw ?? {}) as { succeeded?: number; failed?: number };
        notify.success(
          (result.failed ?? 0) > 0
            ? t("enrollments.toast.bulkPartial", { succeeded: result.succeeded ?? 0, failed: result.failed ?? 0 })
            : t("enrollments.toast.bulkRestored", { count: result.succeeded ?? ids.length }),
        );
      },
      onError: (err: unknown) => notify.error(t("enrollments.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleBulkCancel = (ids: string[]) => {
    ids.forEach((id) => handleCancel(id));
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
      onError: (err: unknown) => notify.error(t("enrollments.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handlePaymentStatusChange = (
    id: string,
    newPaymentStatus: Enrollment["paymentStatus"],
  ) => {
    const enrollment = enrollments.find((candidate) => candidate.id === id);
    if (!enrollment) return;
    const updated: Enrollment = {
      ...enrollment,
      paymentStatus: newPaymentStatus,
      timeline: [
        ...(enrollment.timeline || []),
        {
          ts: new Date().toISOString(),
          event: t("enrollments.timeline.paymentStatusChange", { status: newPaymentStatus }),
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
      onError: (err: unknown) => notify.error(t("enrollments.toast.saveFailed"), {
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
    handlePaymentStatusChange,
    handleBulkDelete,
    handleBulkRestore,
    handleBulkCancel,
  };
}
