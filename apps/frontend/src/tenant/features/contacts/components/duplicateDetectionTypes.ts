import type { Contact, ContactPreferences } from "@mms/shared";
import { DEFAULT_CONTACT_PREFERENCES } from "@mms/shared";

export interface DuplicatePair {
  id: string;
  confidence: number;
  reason: string;
  contacts: [Contact, Contact];
}

export function getDuplicateThemeColors(prefs?: Partial<ContactPreferences>) {
  const merged = { ...DEFAULT_CONTACT_PREFERENCES, ...prefs };
  return {
    warningBg: merged.duplicateDetectionColorWarning,
    warningText: merged.duplicateDetectionColorWarningText,
    successBg: merged.duplicateDetectionColorSuccess,
    successText: merged.duplicateDetectionColorSuccessText,
    highlightBg: merged.duplicateDetectionColorHighlight,
  };
}
