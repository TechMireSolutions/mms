import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useTranslation } from "@/hooks/useTranslation";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { QuestionBankSettings } from "@/tenant/features/question-bank/components/QuestionBankSettings";
import React from "react";

interface SetupTab {
  id: string;
  label: string;
}

interface QuestionBankSetupTierProps {
  tabs: SetupTab[];
  activeTab: string;
  canEditSetup: boolean;
  onTabChange: (tab: string) => void;
}

export const QuestionBankSetupTier = React.memo(function QuestionBankSetupTier({
      canEditSetup,
    }: QuestionBankSetupTierProps) {
      const { t } = useTranslation();

      return (
        <ErrorBoundary>
          <div className="space-y-4">
            {!canEditSetup ? (
              <SetupReadOnlyMessage title={t("questionBank.setup.readOnly")} />
            ) : (
              <QuestionBankSettings />
            )}
          </div>
        </ErrorBoundary>
      );
    });
