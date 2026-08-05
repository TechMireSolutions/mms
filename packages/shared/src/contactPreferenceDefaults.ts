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

/**
 * Former seeded pair ids. Stripped on resolve so Workspaces only keep
 * user-created dynamic pairs (ids like `pair_…`).
 */
export const LEGACY_BUILTIN_RELATIONSHIP_PAIR_IDS: ReadonlySet<string> = new Set([
  "parent_child",
  "father_child",
  "mother_child",
  "spouse",
  "husband_wife",
  "sibling",
  "brother_sibling",
  "sister_sibling",
  "guardian_dependent",
  "grandparent_grandchild",
  "aunt_uncle",
  "cousin",
  "inlaw",
  "other",
]);

/** No prebuilt pairs — relationship types are user-created only. */
export const DEFAULT_RELATIONSHIP_PAIRS: RelationshipPair[] = [];

/**
 * Returns configured user pairs. Missing/empty → `[]`.
 * Drops legacy built-in seed ids so only dynamic pairs remain.
 */
export function resolveRelationshipPairs(
  pairs?: RelationshipPair[] | null,
): RelationshipPair[] {
  if (!Array.isArray(pairs) || pairs.length === 0) {
    return [];
  }
  return pairs.filter(
    (pair) => typeof pair.id !== "string" || !LEGACY_BUILTIN_RELATIONSHIP_PAIR_IDS.has(pair.id),
  );
}

/**
 * True when an equivalent forward/inverse pair already exists (case-insensitive;
 * order-independent so Mentor↔Mentee matches Mentee↔Mentor).
 */
export function isDuplicateRelationshipPair(
  pairs: readonly RelationshipPair[],
  forward: string,
  inverse: string,
): boolean {
  const direct = relationshipPairKey(forward, inverse);
  const swapped = relationshipPairKey(inverse, forward);
  return pairs.some((pair) => {
    const existing = relationshipPairKey(pair.forward, pair.inverse);
    return existing === direct || existing === swapped;
  });
}

function relationshipPairKey(forward: string, inverse: string): string {
  return `${forward.trim().toLowerCase()}::${inverse.trim().toLowerCase()}`;
}

const RELATIONSHIP_PAIR_SEPARATOR = /\s*[:/↔]\s*/;

/**
 * Parses a single-field relationship pair string (e.g. `Husband : Wife`).
 * No separator → self-inverse (both sides the same label).
 */
export function parseRelationshipPairInput(
  raw: string,
):
  | { ok: true; forward: string; inverse: string }
  | { ok: false; reason: "empty" } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  const match = RELATIONSHIP_PAIR_SEPARATOR.exec(trimmed);
  if (!match || match.index == null) {
    return { ok: true, forward: trimmed, inverse: trimmed };
  }

  const forward = trimmed.slice(0, match.index).trim();
  const inverse = trimmed.slice(match.index + match[0].length).trim();
  if (!forward || !inverse) return { ok: false, reason: "empty" };
  return { ok: true, forward, inverse };
}

/**
 * Appends a 2-sided pair and returns the next pairs list plus flattened option labels.
 */
export function buildRelationshipPairAddition(
  existingPairs: readonly RelationshipPair[],
  existingLabels: readonly string[],
  forward: string,
  inverse: string,
):
  | { ok: true; pairs: RelationshipPair[]; labels: string[]; selected: string }
  | { ok: false; reason: "empty" | "duplicate" } {
  const fwd = forward.trim();
  const inv = inverse.trim();
  if (!fwd || !inv) return { ok: false, reason: "empty" };
  if (isDuplicateRelationshipPair(existingPairs, fwd, inv)) {
    return { ok: false, reason: "duplicate" };
  }
  const pairs = [
    ...existingPairs,
    {
      id: `pair_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      forward: fwd,
      inverse: inv,
    },
  ];
  return {
    ok: true,
    pairs,
    labels: mergeRelationshipOptionLabels(existingLabels, [fwd, inv]),
    selected: fwd,
  };
}

/**
 * Removes pairs that reference a dropped dropdown label (forward, inverse, or gendered).
 * Empty results are returned as-is (no built-in fallback).
 */
export function pruneRelationshipPairsForRemovedLabel(
  pairs: readonly RelationshipPair[],
  removedLabel: string,
): RelationshipPair[] {
  const key = removedLabel.trim().toLowerCase();
  if (!key) return [...pairs];
  return pairs.filter((pair) => {
    const labels = [pair.forward, pair.inverse, pair.inverseMale, pair.inverseFemale];
    return !labels.some(
      (label) => typeof label === "string" && label.trim().toLowerCase() === key,
    );
  });
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
 * Relationship pairs are resolved via {@link resolveRelationshipPairs}
 * (empty allowed; legacy built-ins stripped).
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
  { country: "Pakistan",       code: "+92"  },
  { country: "India",          code: "+91"  },
  { country: "Iran",           code: "+98"  },
  { country: "Iraq",           code: "+964" },
  { country: "United States",  code: "+1"   },
  { country: "United Kingdom", code: "+44"  },
];

/**
 * Names retired from the former expanded Contacts dial-code seed.
 * Presence in a persisted list means it should be replaced with {@link COUNTRY_CODES}.
 */
export const RETIRED_CONTACT_COUNTRY_CODE_NAMES = [
  "Canada",
  "Australia",
  "Bangladesh",
  "Egypt",
  "Nigeria",
  "Ghana",
  "Saudi Arabia",
  "United Arab Emirates",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Malaysia",
  "Singapore",
  "Thailand",
  "Indonesia",
] as const;

/** True when a persisted dial-code list still contains a retired seed country. */
export function needsContactCountryCodesCurate(
  entries: ReadonlyArray<{ country: string; code: string }>,
): boolean {
  const retired = new Set(
    RETIRED_CONTACT_COUNTRY_CODE_NAMES.map((name) => name.toLowerCase()),
  );
  return entries.some((entry) => retired.has(entry.country.trim().toLowerCase()));
}

/** Fresh copy of the curated Contacts dial-code seed. */
export function curatedContactCountryCodes(): Array<{ country: string; code: string }> {
  return COUNTRY_CODES.map((entry) => ({ ...entry }));
}

export const RELATIONSHIPS: string[] = deriveRelationshipOptionsFromPairs(DEFAULT_RELATIONSHIP_PAIRS);
