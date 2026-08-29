import React, { lazy, Suspense } from "react";
import { ENROLLMENTS_MODULE_MANIFEST } from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";

const EnrollmentsSettings = lazy(
  () => import("@/tenant/features/enrollments/components/EnrollmentsSettings"),
);

export const EnrollmentsSetupTier = React.memo(function EnrollmentsSetupTier(): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(ENROLLMENTS_MODULE_MANIFEST);

  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <div className="space-y-4">
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("enrollments.setupReadOnly")} />
          ) : (
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              <EnrollmentsSettings />
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
});

export default EnrollmentsSetupTier;
