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

export const RELATIONSHIPS: string[] = deriveRelationshipOptionsFromPairs(DEFAULT_RELATIONSHIP_PAIRS);
