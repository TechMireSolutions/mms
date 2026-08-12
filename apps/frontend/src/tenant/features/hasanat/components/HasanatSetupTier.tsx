import { SubTabBar } from "@/components/ui/SubTabBar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { DenominationsManager } from "@/tenant/features/hasanat/components/DenominationsManager";
import { HasanatSettings } from "@/tenant/features/hasanat/components/HasanatSettings";
import type { Denomination } from "@/lib/data/hasanatData";

interface SetupTab {
  id: string;
  label: string;
}

interface HasanatSetupTierProps {
  tabs: SetupTab[];
  activeTab: string;
  canEditSetup: boolean;
  canWrite: boolean;
  denoms: Denomination[];
  onTabChange: (tab: string) => void;
  onUpdateDenoms: (denoms: Denomination[]) => Promise<void>;
}

export function HasanatSetupTier({
  tabs,
  activeTab,
  canEditSetup,
  canWrite,
  denoms,
  onTabChange,
  onUpdateDenoms,
}: HasanatSetupTierProps) {
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
          <SetupReadOnlyMessage title={t("hasanat.setup.readOnly")} />
        ) : (
          <>
            {activeTab === "denominations" && (
              <DenominationsManager denoms={denoms} onUpdate={onUpdateDenoms} canWrite={canWrite} />
            )}
            {(activeTab === "fields" || activeTab === "preferences") && (
              <HasanatSettings mode={activeTab} />
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
