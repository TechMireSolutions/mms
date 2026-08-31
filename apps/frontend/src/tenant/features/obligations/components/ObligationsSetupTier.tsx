import React, { lazy, Suspense } from "react";
import type {
  ObligationDistribution,
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
} from "@mms/shared";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import { useModuleSetupSubTabs } from "@/lib/setup/useModuleSetupSubTabs";

const ObligationTypeManager = lazy(
  () =>
    import(
      "@/tenant/features/obligations/components/ObligationTypeManager"
    ).then((m) => ({ default: m.ObligationTypeManager })),
);

const MujtahidManager = lazy(
  () =>
    import("@/tenant/features/obligations/components/MujtahidManager").then(
      (m) => ({ default: m.MujtahidManager }),
    ),
);

const WakalaTypeManager = lazy(
  () =>
    import(
      "@/tenant/features/obligations/components/WakalaTypeManager"
    ).then((m) => ({ default: m.WakalaTypeManager })),
);

export interface SetupTab {
  id: string;
  label: string;
}

export interface ObligationsSetupTierProps {
  tabs: SetupTab[];
  activeTab: string;
  canEditSetup: boolean;
  obligationTypes: ObligationType[];
  mujtahids: Mujtahid[];
  reps: MujtahidRep[];
  wakalaTypes: WakalaType[];
  distributions: ObligationDistribution[];
  onTabChange: (tab: string) => void;
  onChangeTypes: (types: ObligationType[]) => Promise<void>;
  onChangeMujtahids: (mujtahids: Mujtahid[]) => Promise<void>;
  onChangeReps: (reps: MujtahidRep[]) => Promise<void>;
  onChangeWakala: (wakalaTypes: WakalaType[]) => Promise<void>;
  onChangeDistributions: (distributions: ObligationDistribution[]) => Promise<void>;
}

export const ObligationsSetupTier = (function ObligationsSetupTier({
  tabs,
  activeTab,
  canEditSetup,
  obligationTypes,
  mujtahids,
  reps,
  wakalaTypes,
  distributions,
  onTabChange,
  onChangeTypes,
  onChangeMujtahids,
  onChangeReps,
  onChangeWakala,
  onChangeDistributions,
}: ObligationsSetupTierProps): React.JSX.Element {
  const { t } = useTranslation();

  const subTabs = useModuleSetupSubTabs({
    initialKey: activeTab || "types",
    isDirty: () => false,
    onDiscard: () => {},
    onChange: onTabChange,
  });

  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <div className="space-y-4">
          <SubTabBar
            tabs={tabs.map((tab) => ({ key: tab.id, label: tab.label }))}
            value={subTabs.sub}
            onChange={subTabs.handleSubTabChange}
          />

          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("obligations.setup.readOnly")} />
          ) : (
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              {subTabs.sub === "types" && (
                <ObligationTypeManager
                  types={obligationTypes}
                  onChange={onChangeTypes}
                />
              )}

              {subTabs.sub === "mujtahids" && (
                <MujtahidManager
                  mujtahids={mujtahids}
                  reps={reps}
                  onChangeMujtahids={onChangeMujtahids}
                  onChangeReps={onChangeReps}
                />
              )}

              {subTabs.sub === "wakala" && (
                <WakalaTypeManager
                  wakalaTypes={wakalaTypes}
                  distributions={distributions}
                  obligationTypes={obligationTypes}
                  reps={reps}
                  mujtahids={mujtahids}
                  onChangeWakala={onChangeWakala}
                  onChangeDistributions={onChangeDistributions}
                />
              )}
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
});

export default ObligationsSetupTier;
