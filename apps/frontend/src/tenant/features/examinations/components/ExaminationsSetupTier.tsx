import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useTranslation } from "@/hooks/useTranslation";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { ExaminationsSettings } from "@/tenant/features/examinations/components/ExaminationsSettings";
import React from "react";

export interface ExaminationsSetupTab {
  id: string;
  label: string;
}

export type SetupTab = ExaminationsSetupTab;

export interface ExaminationsSetupTierProps {
  tabs: ExaminationsSetupTab[];
  activeTab: string;
  canEditSetup: boolean;
  onTabChange: (tab: string) => void;
}

export const ExaminationsSetupTier = React.memo(function ExaminationsSetupTier({
  canEditSetup,
}: ExaminationsSetupTierProps): React.JSX.Element {
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
