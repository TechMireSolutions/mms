import type { TranslationFunction } from '@/lib/contexts/TranslationContext';

export type WorkFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

export interface BuildWorkFilterChipsInput {
  statuses: string[];
  statusLabel: (t: TranslationFunction, status: string) => string;
  onToggleStatus: (status: string) => void;
  extraChip?: {
    key: string;
    label: string;
    onRemove: () => void;
  };
  /** Additional single-select filter chips (e.g. specialization + gender). */
  extraChips?: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }>;
  t: TranslationFunction;
}

/**
 * Build removable FilterChips models for active module Work filters
 * (status chips + optional extra filter chips).
 */
export function buildWorkFilterChips(input: BuildWorkFilterChipsInput): WorkFilterChip[] {
  const chips: WorkFilterChip[] = input.statuses.map((status) => ({
    key: status,
    label: input.statusLabel(input.t, status),
    onRemove: () => input.onToggleStatus(status),
  }));

  if (input.extraChip) {
    chips.push(input.extraChip);
  }

  for (const chip of input.extraChips ?? []) {
    chips.push(chip);
  }

  return chips;
}
