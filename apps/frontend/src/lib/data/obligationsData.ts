export interface ObligationType {
  id: string;
  name: string;
  quantity_based: boolean;
  designated_for: "Syed" | "Non-Syed" | "Both" | "None";
  created_at: string;
  updated_at: string;
}

export interface Mujtahid {
  id: string;
  name: string;
}

export interface MujtahidRep {
  id: string;
  name: string;
  mujtahid_id: string;
}

export interface WakalaType {
  id: string;
  mujtahid_representative_id: string;
  obligation_type_id: string;
}

export interface ObligationDistribution {
  id: string;
  name: string;
  percentage: number;
  wakala_type_id: string;
  type: "Liability" | "Income";
}

export interface ObligationCollection {
  id: string;
  receipt_no: string;
  received_date: string;
  sender_id: string;
  reference_id: string | null;
  amount: number;
  currency_id: string;
  payment_mode: "Cash" | "Online";
  obligation_type_id: string;
  mujtahid_representative_id: string;
  received_by: string;
  created_at: string;
  updated_at: string;
}

export const OBLIGATION_TYPES: ObligationType[] = [];

export const DESIGNATED_FOR_OPTIONS = ["Syed", "Non-Syed", "Both", "None"] as const;

export const MUJTAHIDS: Mujtahid[] = [];

export const MUJTAHID_REPS: MujtahidRep[] = [];

export const WAKALA_TYPES: WakalaType[] = [];

export const OBLIGATION_DISTRIBUTIONS: ObligationDistribution[] = [];
export const DISTRIBUTION_TYPES = ["Liability", "Income"] as const;
export const PAYMENT_MODES = ["Cash", "Online"] as const;

export const OBLIGATION_COLLECTIONS: ObligationCollection[] = [];

export function generateReceiptNo(existingCollections: ObligationCollection[]): string {
  const nums = existingCollections
    .map((c) => parseInt(c.receipt_no.replace("OBL-", ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return "OBL-" + String(next).padStart(5, "0");
}
