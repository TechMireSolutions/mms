import React, { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import { useTranslation } from "@/hooks/useTranslation";

const QuestionBankSettings = lazy(
  () => import("@/tenant/features/question-bank/components/QuestionBankSettings"),
);

export interface SetupTab {
  id: string;
  label: string;
}

export interface QuestionBankSetupTierProps {
  tabs?: SetupTab[];
  activeTab?: string;
  canEditSetup: boolean;
  onTabChange?: (tab: string) => void;
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const QuestionBankSetupTier = React.memo(function QuestionBankSetupTier({
  canEditSetup,
  onPrefsDirtyChange,
}: QuestionBankSetupTierProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <div className="space-y-4">
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("questionBank.setup.readOnly")} />
          ) : (
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              <QuestionBankSettings onPrefsDirtyChange={onPrefsDirtyChange} />
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
});

export default QuestionBankSetupTier;
