import type {
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
  ObligationDistribution,
  ObligationCollection,
} from '@mms/shared';

export type {
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
  ObligationDistribution,
  ObligationCollection,
};

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
  const receiptNumbers = existingCollections
    .map((collection) => parseInt(collection.receipt_no.replace("OBL-", ""), 10))
    .filter((receiptNumber) => !isNaN(receiptNumber));
  const nextReceiptNumber = receiptNumbers.length > 0 ? Math.max(...receiptNumbers) + 1 : 1;
  return "OBL-" + String(nextReceiptNumber).padStart(5, "0");
}
