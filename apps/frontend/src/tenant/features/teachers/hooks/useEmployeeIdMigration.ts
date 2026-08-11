import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { migrateTeachersEmployeeIds } from "@/tenant/features/teachers/hooks/useTeachers";
import { invalidateTeachersQueries } from "@/tenant/features/teachers/hooks/invalidateTeachersQueries";

const TEACHERS_EMPLOYEE_ID_MIGRATION_KEY = "mms_teachers_employee_id_migration_v1";

function employeeIdMigrationAlreadyDone(): boolean {
  try {
    return localStorage.getItem(TEACHERS_EMPLOYEE_ID_MIGRATION_KEY) === "1";
  } catch {
    return false;
  }
}

function markEmployeeIdMigrationDone(): void {
  try {
    localStorage.setItem(TEACHERS_EMPLOYEE_ID_MIGRATION_KEY, "1");
  } catch {
    // non-fatal: the one-shot gate is best-effort dedupe only
  }
}

/**
 * One-shot employee-id backfill for legacy teachers missing an id.
 * Runs once per browser (localStorage gate) when a Setup writer opens the Work
 * tab — matches BE `setupWrite`. The POST goes through a `useMutation` so the
 * outcome surfaces via `notify.*` + `t()` instead of silent console warnings.
 */
export function useEmployeeIdMigration(activeTab: string, canEditSetup: boolean): void {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [needsMigrationScan, setNeedsMigrationScan] = useState(() => !employeeIdMigrationAlreadyDone());
  const migrationAppliedRef = useRef(false);

  const { mutate } = useMutation({
    mutationFn: () => migrateTeachersEmployeeIds(),
    onSuccess: (result) => {
      invalidateTeachersQueries(queryClient);
      markEmployeeIdMigrationDone();
      setNeedsMigrationScan(false);
      if (result.updated > 0) {
        notify.success(t("teachers.employeeIdMigrationCompleted"), {
          description: t("teachers.employeeIdMigrationUpdated", { count: result.updated }),
        });
      }
    },
    onError: () => {
      migrationAppliedRef.current = false;
      notify.error(t("teachers.employeeIdMigrationFailed"));
    },
  });

  useEffect(() => {
    if (!canEditSetup || !needsMigrationScan || activeTab !== "work") return;
    if (migrationAppliedRef.current) return;
    migrationAppliedRef.current = true;
    mutate();
  }, [activeTab, canEditSetup, needsMigrationScan, mutate]);
}
