import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import type { useEnrollmentMutations } from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";

export interface UseEnrollmentsBulkActionsParams {
  bulkDeleteEnrollments: ReturnType<typeof useEnrollmentMutations>["bulkDeleteEnrollments"];
  bulkRestoreEnrollments: ReturnType<typeof useEnrollmentMutations>["bulkRestoreEnrollments"];
  handleCancel: (id: string) => void;
}

export function useEnrollmentsBulkActions({
  bulkDeleteEnrollments,
  bulkRestoreEnrollments,
  handleCancel,
}: UseEnrollmentsBulkActionsParams) {
  const { t } = useTranslation();

  const handleBulkDelete = (ids: string[], deletionReason?: string) => {
    bulkDeleteEnrollments.mutate(
      { ids, deletionReason },
      {
        onSuccess: (raw: unknown) => {
          const result = (raw ?? {}) as { succeeded?: number; failed?: number };
          notify.success(
            (result.failed ?? 0) > 0
              ? t("enrollments.toast.bulkPartial", {
                  succeeded: result.succeeded ?? 0,
                  failed: result.failed ?? 0,
                })
              : t("enrollments.toast.bulkDeleted", { count: result.succeeded ?? ids.length }),
          );
        },
        onError: (err: unknown) =>
          notify.error(t("enrollments.toast.saveFailed"), {
            description: err instanceof Error ? err.message : String(err),
          }),
      },
    );
  };

  const handleBulkRestore = (ids: string[]) => {
    bulkRestoreEnrollments.mutate(ids, {
      onSuccess: (raw: unknown) => {
        const result = (raw ?? {}) as { succeeded?: number; failed?: number };
        notify.success(
          (result.failed ?? 0) > 0
            ? t("enrollments.toast.bulkPartial", {
                succeeded: result.succeeded ?? 0,
                failed: result.failed ?? 0,
              })
            : t("enrollments.toast.bulkRestored", { count: result.succeeded ?? ids.length }),
        );
      },
      onError: (err: unknown) =>
        notify.error(t("enrollments.toast.saveFailed"), {
          description: err instanceof Error ? err.message : String(err),
        }),
    });
  };

  const handleBulkCancel = (ids: string[]) => {
    ids.forEach((id) => handleCancel(id));
  };

  return {
    handleBulkDelete,
    handleBulkRestore,
    handleBulkCancel,
  };
}
