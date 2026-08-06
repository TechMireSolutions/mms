/** Relationship pair defaults and pure helpers for Contacts preferences. */
import type { RelationshipPair } from './contactEntityTypes.js';

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

export type ParsedRelationshipPairInput = {
  forward: string;
  inverse: string;
  inverseMale?: string;
  inverseFemale?: string;
};

type RelationshipPairLabels = Pick<
  RelationshipPair,
  "forward" | "inverse" | "inverseMale" | "inverseFemale"
>;

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
 * order-independent so Mentor↔Mentee matches Mentee↔Mentor), or when any new
 * label (including gendered inverses) collides with an existing pair's labels.
 */
export function isDuplicateRelationshipPair(
  pairs: readonly RelationshipPair[],
  input: ParsedRelationshipPairInput,
): boolean {
  const direct = relationshipPairKey(input.forward, input.inverse);
  const swapped = relationshipPairKey(input.inverse, input.forward);
  const newLabels = relationshipPairLabelKeys(input);
  return pairs.some((pair) => {
    const existing = relationshipPairKey(pair.forward, pair.inverse);
    if (existing === direct || existing === swapped) return true;
    const existingLabels = relationshipPairLabelKeys(pair);
    for (const key of newLabels) {
      if (existingLabels.has(key)) return true;
    }
    return false;
  });
}

function relationshipPairKey(forward: string, inverse: string): string {
  return `${forward.trim().toLowerCase()}::${inverse.trim().toLowerCase()}`;
}

function relationshipPairLabelList(pair: RelationshipPairLabels): Array<string | undefined> {
  return [pair.forward, pair.inverse, pair.inverseMale, pair.inverseFemale];
}

function relationshipPairLabelKeys(pair: RelationshipPairLabels): Set<string> {
  const keys = new Set<string>();
  for (const label of relationshipPairLabelList(pair)) {
    const trimmed = typeof label === "string" ? label.trim().toLowerCase() : "";
    if (trimmed) keys.add(trimmed);
  }
  return keys;
}

const RELATIONSHIP_PAIR_SEPARATOR = /\s*[:/↔]\s*/;
const RELATIONSHIP_GENDERED_INVERSE_SEPARATOR = /\s*\|\s*/;

/**
 * Parses a single-field relationship pair string (e.g. `Husband : Wife`).
 * Gendered inverses: `Parent : Child | Son | Daughter` (neutral | male | female).
 * No separator → self-inverse (both sides the same label).
 */
export function parseRelationshipPairInput(
  raw: string,
):
  | ({ ok: true } & ParsedRelationshipPairInput)
  | { ok: false; reason: "empty" | "malformed" } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  const match = RELATIONSHIP_PAIR_SEPARATOR.exec(trimmed);
  if (!match || match.index == null) {
    return { ok: true, forward: trimmed, inverse: trimmed };
  }

  const forward = trimmed.slice(0, match.index).trim();
  const inverseSide = trimmed.slice(match.index + match[0].length).trim();
  if (!forward || !inverseSide) return { ok: false, reason: "empty" };

  const segments = inverseSide
    .split(RELATIONSHIP_GENDERED_INVERSE_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (segments.length === 1) {
    const [inverse] = segments;
    if (!inverse) return { ok: false, reason: "empty" };
    return { ok: true, forward, inverse };
  }
  if (segments.length === 3) {
    const [inverse, inverseMale, inverseFemale] = segments;
    if (!inverse || !inverseMale || !inverseFemale) {
      return { ok: false, reason: "malformed" };
    }
    return { ok: true, forward, inverse, inverseMale, inverseFemale };
  }
  return { ok: false, reason: "malformed" };
}

/**
 * Appends a 2-sided pair (optionally with gendered inverses) and returns the next
 * pairs list plus flattened option labels.
 */
export function buildRelationshipPairAddition(
  existingPairs: readonly RelationshipPair[],
  existingLabels: readonly string[],
  input: ParsedRelationshipPairInput,
):
  | { ok: true; pairs: RelationshipPair[]; labels: string[]; selected: string }
  | { ok: false; reason: "empty" | "duplicate" } {
  const forward = input.forward.trim();
  const inverse = input.inverse.trim();
  const inverseMale = input.inverseMale?.trim() || undefined;
  const inverseFemale = input.inverseFemale?.trim() || undefined;
  if (!forward || !inverse) return { ok: false, reason: "empty" };

  const normalized: ParsedRelationshipPairInput = {
    forward,
    inverse,
    ...(inverseMale ? { inverseMale } : {}),
    ...(inverseFemale ? { inverseFemale } : {}),
  };
  if (isDuplicateRelationshipPair(existingPairs, normalized)) {
    return { ok: false, reason: "duplicate" };
  }

  const pair: RelationshipPair = {
    id: `pair_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    ...normalized,
  };
  return {
    ok: true,
    pairs: [...existingPairs, pair],
    labels: mergeRelationshipOptionLabels(existingLabels, relationshipPairLabelList(normalized)),
    selected: forward,
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
    return !relationshipPairLabelList(pair).some(
      (label) => typeof label === "string" && label.trim().toLowerCase() === key,
    );
  });
}

/**
 * Flattens configured 2-sided relationship pairs into unique dropdown option labels
 * (forward, inverse, and optional gendered inverse labels).
 */
export function deriveRelationshipOptionsFromPairs(pairs: RelationshipPair[]): string[] {
  return uniqueRelationshipLabels(pairs.flatMap((pair) => relationshipPairLabelList(pair)));
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
    const trimmed = typeof label === "string" ? label.trim() : "";
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(trimmed);
  }
  return options;
}

export const RELATIONSHIPS: string[] = deriveRelationshipOptionsFromPairs(DEFAULT_RELATIONSHIP_PAIRS);
