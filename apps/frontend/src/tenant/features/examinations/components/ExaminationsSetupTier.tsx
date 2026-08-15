import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useTranslation } from "@/hooks/useTranslation";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { ExaminationsSettings } from "@/tenant/features/examinations/components/ExaminationsSettings";
import React from "react";

interface SetupTab {
  id: string;
  label: string;
}

interface ExaminationsSetupTierProps {
  tabs: SetupTab[];
  activeTab: string;
  canEditSetup: boolean;
  onTabChange: (tab: string) => void;
}

export const ExaminationsSetupTier = React.memo(function ExaminationsSetupTier({
      canEditSetup,
    }: ExaminationsSetupTierProps) {
      const { t } = useTranslation();

      return (
        <ErrorBoundary>
          <div className="space-y-4">
            {!canEditSetup ? (
              <SetupReadOnlyMessage title={t("examinations.setup.readOnly")} />
            ) : (
              <ExaminationsSettings />
            )}
          </div>
        </ErrorBoundary>
      );
    });
