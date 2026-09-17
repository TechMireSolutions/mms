import React, { lazy, Suspense } from "react";
import { TEACHERS_MODULE_MANIFEST } from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";

const FacultySettings = lazy(
  () => import("@/tenant/features/faculty/components/FacultySettings").then((m) => ({
    default: m.FacultySettings,
  })),
);

export interface FacultySetupTierProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}
export type TeachersSetupTierProps = FacultySetupTierProps;

export const FacultySetupTier = function FacultySetupTier({
  onPrefsDirtyChange,
}: FacultySetupTierProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(TEACHERS_MODULE_MANIFEST);

  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <div className="space-y-4">
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("teachers.setup.readOnly")} />
          ) : (
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              <FacultySettings onPrefsDirtyChange={onPrefsDirtyChange} />
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
};

export const TeachersSetupTier = FacultySetupTier;
export default FacultySetupTier;
