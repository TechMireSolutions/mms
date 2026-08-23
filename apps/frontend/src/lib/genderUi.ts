import { Mars, Venus, UserRound, type LucideIcon } from 'lucide-react';

/** Canonical gender keys used for icons/tones across the app. */
export type GenderUiKey = 'male' | 'female' | 'other' | 'unspecified';

/**
 * Normalizes free-form gender strings (Male/FEMALE/custom) to a UI key.
 * Empty/unknown → empty string (callers treat as no gender).
 */
export function normalizeGenderKey(gender: string | null | undefined): GenderUiKey | '' {
  const raw = gender?.trim().toLowerCase() ?? '';
  if (!raw) return '';
  if (raw === 'male' || raw === 'm') return 'male';
  if (raw === 'female' || raw === 'f') return 'female';
  if (raw === 'other') return 'other';
  if (raw === 'unspecified' || raw === 'unknown' || raw === 'any') return 'unspecified';
  return 'other';
}

/** Lucide icon for a gender value — Mars (male) / Venus (female) / UserRound (other/empty). */
export function getGenderIcon(gender: string | null | undefined): LucideIcon {
  switch (normalizeGenderKey(gender)) {
    case 'male':
      return Mars;
    case 'female':
      return Venus;
    default:
      return UserRound;
  }
}

/** Semantic text colour for gender icons (pairs with genderBadgeClass tones). */
export function getGenderIconClass(gender: string | null | undefined): string {
  switch (normalizeGenderKey(gender)) {
    case 'male':
      return 'text-info';
    case 'female':
      return 'text-secondary';
    default:
      return 'text-muted-foreground';
  }
}

/** Card accent tone based on gender. */
export function getGenderCardAccent(gender?: string | null | undefined): "info" | "secondary" | "primary" {
  switch (normalizeGenderKey(gender)) {
    case 'male':
      return 'info';
    case 'female':
      return 'secondary';
    default:
      return 'primary';
  }
}
