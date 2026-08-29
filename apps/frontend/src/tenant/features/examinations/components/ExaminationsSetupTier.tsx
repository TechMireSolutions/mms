import React, { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import { useTranslation } from "@/hooks/useTranslation";

const ExaminationsSettings = lazy(
  () => import("@/tenant/features/examinations/components/ExaminationsSettings"),
);

export interface ExaminationsSetupTab {
  id: string;
  label: string;
}

export type SetupTab = ExaminationsSetupTab;

export interface ExaminationsSetupTierProps {
  tabs?: ExaminationsSetupTab[];
  activeTab?: string;
  canEditSetup: boolean;
  onTabChange?: (tab: string) => void;
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const ExaminationsSetupTier = React.memo(function ExaminationsSetupTier({
  canEditSetup,
  onPrefsDirtyChange,
}: ExaminationsSetupTierProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <div className="space-y-4">
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("examinations.setup.readOnly")} />
          ) : (
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              <ExaminationsSettings onPrefsDirtyChange={onPrefsDirtyChange} />
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
});

export default ExaminationsSetupTier;
