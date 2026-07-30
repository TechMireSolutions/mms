import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ObligationsSummary as ObligationsSummaryComponent } from "@/tenant/features/obligations/components/ObligationsSummary";
import type {
  ObligationCollection,
  ObligationDistribution,
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
} from "@/lib/data/obligationsData";

interface ObligationsReportsTierProps {
  collections: ObligationCollection[];
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  wakalaTypes: WakalaType[];
  distributions: ObligationDistribution[];
}

export function ObligationsReportsTier(props: ObligationsReportsTierProps) {
  return (
    <ErrorBoundary>
      <ObligationsSummaryComponent
        collections={props.collections}
        obligationTypes={props.obligationTypes}
        reps={props.reps}
        mujtahids={props.mujtahids}
        wakalaTypes={props.wakalaTypes}
        distributions={props.distributions}
      />
    </ErrorBoundary>
  );
}
