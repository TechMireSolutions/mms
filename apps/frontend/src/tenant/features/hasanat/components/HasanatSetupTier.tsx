import React, { lazy, Suspense } from "react";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import { useTranslation } from "@/hooks/useTranslation";
import type { Denomination } from "@/lib/data/hasanatData";

const DenominationsManager = lazy(
  () =>
    import("@/tenant/features/hasanat/components/DenominationsManager").then(
      (m) => ({ default: m.DenominationsManager }),
    ),
);

const HasanatSettings = lazy(
  () => import("@/tenant/features/hasanat/components/HasanatSettings"),
);

export interface SetupTab {
  id: string;
  label: string;
}

export interface HasanatSetupTierProps {
  tabs: SetupTab[];
  activeTab: string;
  canEditSetup: boolean;
  canWrite: boolean;
  denoms: Denomination[];
  onTabChange: (tab: string) => void;
  onUpdateDenoms: (denoms: Denomination[]) => Promise<void>;
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const HasanatSetupTier = React.memo(function HasanatSetupTier({
  tabs,
  activeTab,
  canEditSetup,
  canWrite,
  denoms,
  onTabChange,
  onUpdateDenoms,
  onPrefsDirtyChange,
}: HasanatSetupTierProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleTierMotion tier="setup">
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
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              {activeTab === "denominations" && (
                <DenominationsManager
                  denoms={denoms}
                  onUpdate={onUpdateDenoms}
                  canWrite={canWrite}
                />
              )}
              {activeTab === "preferences" && (
                <HasanatSettings onPrefsDirtyChange={onPrefsDirtyChange} />
              )}
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
});

export default HasanatSetupTier;
