import React, { lazy, Suspense } from "react";
import { SESSIONS_MODULE_MANIFEST } from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";

const SessionsSettings = lazy(
  () => import("@/tenant/features/sessions/components/SessionsSettings"),
);

export const SessionsSetupTier = React.memo(function SessionsSetupTier(): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(SESSIONS_MODULE_MANIFEST);

  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <div className="space-y-4">
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("sessions.setupReadOnly")} />
          ) : (
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              <SessionsSettings />
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
});

export default SessionsSetupTier;
