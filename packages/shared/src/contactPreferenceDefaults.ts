/** Contact preference defaults, labels, palettes, and lookup lists. */
import type { ContactPreferences, WhatsAppTemplate } from './contactFieldSchemaTypes.js';
import type { RelationshipPair } from './contactEntityTypes.js';

export const CONFIG_VERSION = 2;

export const DEFAULT_ENABLED_TABS = ["phones", "emails", "addresses", "socials", "relationship"];
export const DEFAULT_REQUIRED_TABS: string[] = [];

export const GENDERS = ["male", "female"];

export const COLOR_PALETTES = {
  blue: { bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-900/50" },
  emerald: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900/50" },
  violet: { bg: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50", text: "text-violet-700 dark:text-violet-400", border: "border-violet-200 dark:border-violet-900/50" },
  amber: { bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/50" },
  rose: { bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-900/50" },
  red: { bg: "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50", text: "text-red-600 dark:text-red-400", border: "border-red-100 dark:border-red-900/50" },
  indigo: { bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-900/50" },
  cyan: { bg: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/50", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-900/50" },
  slate: { bg: "bg-muted text-muted-foreground border-border", text: "text-muted-foreground", border: "border-border" },
  /** Semantic aliases — prefer these for status / alert chips (theme-aware). */
  success: { bg: "bg-success/10 text-success border-success/20 dark:bg-success/15 dark:border-success/25", text: "text-success", border: "border-success/20 dark:border-success/25" },
  info: { bg: "bg-info/10 text-info border-info/20 dark:bg-info/15 dark:border-info/25", text: "text-info", border: "border-info/20 dark:border-info/25" },
  warning: { bg: "bg-warning/10 text-warning border-warning/20 dark:bg-warning/15 dark:border-warning/25", text: "text-warning", border: "border-warning/20 dark:border-warning/25" },
  destructive: { bg: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15 dark:border-destructive/25", text: "text-destructive", border: "border-destructive/20 dark:border-destructive/25" },
};

export const DEFAULT_RELATIONSHIP_PAIRS: RelationshipPair[] = [
  { id: "parent_child", forward: "Parent", inverse: "Child", inverseMale: "Son", inverseFemale: "Daughter" },
  { id: "father_child", forward: "Father", inverse: "Child", inverseMale: "Son", inverseFemale: "Daughter" },
  { id: "mother_child", forward: "Mother", inverse: "Child", inverseMale: "Son", inverseFemale: "Daughter" },
  { id: "spouse", forward: "Spouse", inverse: "Spouse" },
  { id: "sibling", forward: "Sibling", inverse: "Sibling", inverseMale: "Brother", inverseFemale: "Sister" },
  { id: "brother_sibling", forward: "Brother", inverse: "Sibling", inverseMale: "Brother", inverseFemale: "Sister" },
  { id: "sister_sibling", forward: "Sister", inverse: "Sibling", inverseMale: "Brother", inverseFemale: "Sister" },
  { id: "guardian_dependent", forward: "Guardian", inverse: "Dependent" },
  { id: "grandparent_grandchild", forward: "Grandparent", inverse: "Grandchild", inverseMale: "Grandson", inverseFemale: "Granddaughter" },
  { id: "aunt_uncle", forward: "Aunt/Uncle", inverse: "Niece/Nephew", inverseMale: "Nephew", inverseFemale: "Niece" },
  { id: "cousin", forward: "Cousin", inverse: "Cousin" },
  { id: "inlaw", forward: "Parent-In-Law", inverse: "Child-In-Law" },
  { id: "other", forward: "Other", inverse: "Other" },
];

/**
 * Returns configured pairs, or DEFAULT_RELATIONSHIP_PAIRS when missing/empty.
 * Intentional empty lists are not supported (product invariant).
 */
export function resolveRelationshipPairs(
  pairs?: RelationshipPair[] | null,
): RelationshipPair[] {
  if (!Array.isArray(pairs) || pairs.length === 0) {
    return [...DEFAULT_RELATIONSHIP_PAIRS];
  }
  return pairs;
}

/**
 * Flattens configured 2-sided relationship pairs into unique dropdown option labels
 * (forward, inverse, and optional gendered inverse labels).
 */
export function deriveRelationshipOptionsFromPairs(pairs: RelationshipPair[]): string[] {
  const labels = pairs.flatMap((pair) => [
    pair.forward,
    pair.inverse,
    pair.inverseMale,
    pair.inverseFemale,
  ]);
  return uniqueRelationshipLabels(labels);
}

/**
 * Merges relationship option lists case-insensitively, preserving first-seen casing.
 * Pair-derived labels are listed before existing collection options.
 */
export function mergeRelationshipOptionLabels(
  primaryLabels: readonly (string | undefined | null)[],
  secondaryLabels: readonly (string | undefined | null)[] = [],
): string[] {
  return uniqueRelationshipLabels([...primaryLabels, ...secondaryLabels]);
}

function uniqueRelationshipLabels(labels: readonly (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const options: string[] = [];
  for (const label of labels) {
    const trimmed = typeof label === 'string' ? label.trim() : '';
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(trimmed);
  }
  return options;
}

export const DEFAULT_CONTACT_PREFERENCES: ContactPreferences = {
  defaultCountry: "Pakistan",
  defaultProvince: "Punjab",
  defaultCity: "Lahore",
  defaultViewLayout: "list",
  duplicateDetectionFields: ["name", "phone", "email"],
  duplicateDetectionThresholdHigh: 90,
  duplicateDetectionThresholdMedium: 75,
  duplicateDetectionColorHigh: COLOR_PALETTES.destructive.bg,
  duplicateDetectionColorMedium: COLOR_PALETTES.warning.bg,
  duplicateDetectionColorLow: COLOR_PALETTES.slate.bg,
  duplicateDetectionScorePhoneEmail: 99,
  duplicateDetectionScoreNamePhone: 95,
  duplicateDetectionScoreNameEmail: 95,
  duplicateDetectionScorePhone: 80,
  duplicateDetectionScoreEmail: 80,
  duplicateDetectionScoreName: 75,
  duplicateDetectionScoreDefault: 70,
  duplicateDetectionColorWarning: COLOR_PALETTES.warning.bg,
  duplicateDetectionColorWarningText: COLOR_PALETTES.warning.text,
  duplicateDetectionColorSuccess: COLOR_PALETTES.success.bg,
  duplicateDetectionColorSuccessText: COLOR_PALETTES.success.text,
  duplicateDetectionColorHighlight: COLOR_PALETTES.info.bg,
  showDetailedSolarAge: true,
  showLunarDob: false,
  showDetailedLunarAge: false,
  namePrefixesToIgnore: ["syed", "syeda"],
  relationshipPairs: DEFAULT_RELATIONSHIP_PAIRS,
};

/**
 * Merges stored contact preferences onto defaults.
 * Empty `relationshipPairs` falls back via {@link resolveRelationshipPairs}.
 */
export function normalizeContactPreferences(
  partial?: Partial<ContactPreferences> | null,
): ContactPreferences {
  const merged: ContactPreferences = {
    ...DEFAULT_CONTACT_PREFERENCES,
    ...(partial && typeof partial === "object" && !Array.isArray(partial) ? partial : {}),
  };
  merged.relationshipPairs = resolveRelationshipPairs(merged.relationshipPairs);
  return merged;
}

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  { id: "fee", label: "Fee Reminder", body: "Assalamu Alaikum! This is a friendly reminder that your fee payment for this month is due. Please contact us at your earliest convenience. JazakAllah Khair." },
  { id: "event", label: "Event Invitation", body: "Assalamu Alaikum! You are cordially invited to our upcoming event at the madrasa. Please confirm your attendance. JazakAllah Khair." },
  { id: "absence", label: "Absence Notice", body: "Assalamu Alaikum! We noticed your child was absent today. Please inform us if there is an issue. JazakAllah Khair." },
  { id: "custom", label: "Custom Message", body: "" },
];

export const DEFAULT_PHONE_LABELS = ["Mobile", "Home", "Work", "WhatsApp", "Other"];
export const DEFAULT_EMAIL_LABELS = ["Personal", "Work", "Other"];
export const DEFAULT_ADDRESS_LABELS = ["Home", "Work", "Billing", "Other"];

export const SOCIAL_PLATFORMS = [
  "Facebook", "Twitter / X", "Instagram", "LinkedIn", "TikTok", "YouTube",
  "WhatsApp", "Telegram", "Snapchat",
];

export const DEFAULT_SOCIAL_PLATFORMS = SOCIAL_PLATFORMS;

export const COUNTRY_CODES = [
  { country: "Pakistan",              code: "+92"  },
  { country: "United States",         code: "+1"   },
  { country: "United Kingdom",        code: "+44"  },
  { country: "Canada",                code: "+1"   },
  { country: "Australia",             code: "+61"  },
  { country: "India",                 code: "+91"  },
  { country: "Bangladesh",            code: "+880" },
  { country: "Egypt",                 code: "+20"  },
  { country: "Nigeria",               code: "+234" },
  { country: "Ghana",                 code: "+233" },
  { country: "Saudi Arabia",          code: "+966" },
  { country: "United Arab Emirates",  code: "+971" },
  { country: "Qatar",                 code: "+974" },
  { country: "Kuwait",                code: "+965" },
  { country: "Bahrain",               code: "+973" },
  { country: "Oman",                  code: "+968" },
  { country: "Malaysia",              code: "+60"  },
  { country: "Singapore",             code: "+65"  },
  { country: "Thailand",              code: "+66"  },
  { country: "Indonesia",             code: "+62"  },
];

export const RELATIONSHIPS: string[] = deriveRelationshipOptionsFromPairs(DEFAULT_RELATIONSHIP_PAIRS);
