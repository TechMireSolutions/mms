import { SubTabBar } from "@/components/ui/SubTabBar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useTranslation } from "@/hooks/useTranslation";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { ObligationTypeManager } from "@/tenant/features/obligations/components/ObligationTypeManager";
import { MujtahidManager } from "@/tenant/features/obligations/components/MujtahidManager";
import { WakalaTypeManager } from "@/tenant/features/obligations/components/WakalaTypeManager";
import type {
  ObligationDistribution,
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
} from "@/lib/data/obligationsData";

interface SetupTab {
  id: string;
  label: string;
}

interface ObligationsSetupTierProps {
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

export function ObligationsSetupTier({
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
}: ObligationsSetupTierProps) {
  const { t } = useTranslation();

  return (
    <ErrorBoundary>
      <SubTabBar
        tabs={tabs.map((tab) => ({ key: tab.id, label: tab.label }))}
        value={activeTab}
        onChange={onTabChange}
      />

      {!canEditSetup && (
        <SetupReadOnlyMessage title={t("obligations.setup.readOnly")} />
      )}

      {canEditSetup && activeTab === "types" && (
        <ObligationTypeManager types={obligationTypes} onChange={onChangeTypes} />
      )}

      {canEditSetup && activeTab === "mujtahids" && (
        <MujtahidManager
          mujtahids={mujtahids}
          reps={reps}
          onChangeMujtahids={onChangeMujtahids}
          onChangeReps={onChangeReps}
        />
      )}

      {canEditSetup && activeTab === "wakala" && (
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
    </ErrorBoundary>
  );
}
