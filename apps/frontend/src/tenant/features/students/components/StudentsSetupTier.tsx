import React, { lazy, Suspense } from "react";
import { STUDENTS_MODULE_MANIFEST } from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";

const StudentsSetupPanel = lazy(
  () => import("@/tenant/features/students/components/StudentsSetupPanel"),
);

export const StudentsSetupTier = React.memo(function StudentsSetupTier(): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(STUDENTS_MODULE_MANIFEST);

  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <div className="space-y-4">
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("students.setupReadOnly")} />
          ) : (
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              <StudentsSetupPanel />
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
});
export default StudentsSetupTier;
