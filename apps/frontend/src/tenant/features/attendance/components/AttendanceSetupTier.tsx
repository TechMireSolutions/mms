import React, { lazy, Suspense } from "react";
import { ATTENDANCE_MODULE_MANIFEST } from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";

const AttendanceSettings = lazy(
  () => import("@/tenant/features/attendance/components/AttendanceSettings"),
);

export const AttendanceSetupTier = React.memo(function AttendanceSetupTier(): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(ATTENDANCE_MODULE_MANIFEST);

  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <div className="space-y-4">
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("attendance.settings.readOnly")} />
          ) : (
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              <AttendanceSettings />
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
});

export default AttendanceSetupTier;
