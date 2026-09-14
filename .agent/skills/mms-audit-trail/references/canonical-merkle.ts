import crypto from 'node:crypto';

/**
 * Deterministic JSON Canonicalization according to RFC 8785 (JCS).
 * Recursively sorts keys lexicographically and strips extraneous whitespace.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalizeJson).join(',')}]`;
  }

  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalizeJson((obj as Record<string, unknown>)[key])}`
  );
  return `{${pairs.join(',')}}`;
}

/**
 * Computes deterministic SHA-256 hash chain link for an audit event.
 * hash_current = SHA-256(hash_previous + canonical_json(payload) + transaction_timestamp)
 */
export function computeAuditEventHash(
  hashPrevious: string,
  payload: Record<string, unknown>,
  transactionTimestamp: string,
): string {
  const canonicalPayload = canonicalizeJson(payload);
  const content = `${hashPrevious}${canonicalPayload}${transactionTimestamp}`;
  return crypto.hash('sha256', content, 'hex');
}

/**
 * Computes a binary Merkle tree root from a list of leaf hashes (SHA-256).
 */
export function computeMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) return '';
  if (leaves.length === 1) return leaves[0];

  let currentLevel = [...leaves];
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const combined = currentLevel[i] + currentLevel[i + 1];
        nextLevel.push(crypto.hash('sha256', combined, 'hex'));
      } else {
        // Odd leaf is paired with itself or promoted
        const combined = currentLevel[i] + currentLevel[i];
        nextLevel.push(crypto.hash('sha256', combined, 'hex'));
      }
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}
