import { WakalaType, ObligationDistribution, ObligationType, MujtahidRep, Mujtahid } from '@/lib/data/obligationsData';

export type DistributionType = "Income" | "Liability";

export interface WakalaTypeManagerProps {
  wakalaTypes: WakalaType[];
  distributions: ObligationDistribution[];
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  onChangeWakala: (wt: WakalaType[]) => void | Promise<void>;
  onChangeDistributions: (dists: ObligationDistribution[]) => void | Promise<void>;
}
