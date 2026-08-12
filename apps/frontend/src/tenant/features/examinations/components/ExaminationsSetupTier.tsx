import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { ExaminationsSettings } from "@/tenant/features/examinations/components/ExaminationsSettings";

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

export function ExaminationsSetupTier({
  tabs,
  activeTab,
  canEditSetup,
  onTabChange,
}: ExaminationsSetupTierProps) {
  const { t } = useTranslation();

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <SubTabBar
          tabs={tabs.map((tab) => ({ key: tab.id, label: tab.label }))}
          value={activeTab}
          onChange={onTabChange}
        />
        {!canEditSetup ? (
          <SetupReadOnlyMessage title={t("examinations.setup.readOnly")} />
        ) : (
          <ExaminationsSettings mode={activeTab as "fields" | "preferences"} />
        )}
      </div>
    </ErrorBoundary>
  );
}
