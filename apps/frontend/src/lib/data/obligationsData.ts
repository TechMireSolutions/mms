import type {
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
  ObligationDistribution,
  ObligationCollection,
  ObligationsSettings,
} from '@mms/shared';
import {
  formatDeterministicSequence,
  obligationsSettingsToSequenceConfig,
} from '@mms/shared';

export type {
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
  ObligationDistribution,
  ObligationCollection,
};

export const DESIGNATED_FOR_OPTIONS = ["Syed", "Non-Syed", "Both", "None"] as const;

export const DISTRIBUTION_TYPES = ["Liability", "Income"] as const;
export const PAYMENT_MODES = ["Cash", "Online"] as const;

export function generateReceiptNo(
  existingCollections: ObligationCollection[],
  settings?: Partial<ObligationsSettings>,
  referenceDate?: Date | string,
): string {
  const config = obligationsSettingsToSequenceConfig(settings);
  if (!config.autoGenerate) {
    return "";
  }

  const numbers = existingCollections
    .map((collection) => {
      if (!collection.receipt_no) return NaN;
      const match = collection.receipt_no.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter((receiptNumber) => !isNaN(receiptNumber));

  const maxExisting = numbers.length > 0 ? Math.max(...numbers) : 0;
  const starting = config.startingSequence || 1;
  const nextSeq = Math.max(maxExisting + 1, starting);

  return formatDeterministicSequence(nextSeq, config, referenceDate);
}
