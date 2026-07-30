import { RELATIONAL_REPLACE_MAPPING } from './relationalReplaceMapping.js';

/** Credential columns that must never leave the server in a snapshot payload. */
const CREDENTIAL_FIELDS = ['passwordHash'] as const;

function stripCredentials(rows: unknown[]): unknown[] {
  return rows.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
    const clone = { ...(row as Record<string, unknown>) };
    for (const field of CREDENTIAL_FIELDS) {
      delete clone[field];
    }
    return clone;
  });
}

/**
 * Reads every REST-migrated collection straight from its relational table.
 *
 * The legacy `collections` document store is only written by the deprecated
 * `/api/db/collections/:name` path, so it is stale for REST-migrated modules —
 * backups must read the tables that own the data.
 */
export async function loadRelationalSnapshotCollections(
  workspaceSubdomain: string,
): Promise<Record<string, unknown[]>> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const collections: Record<string, unknown[]> = {};

  for (const [logicalKey, mapping] of Object.entries(RELATIONAL_REPLACE_MAPPING)) {
    if (!mapping.snapshotFnName) continue;

    const repoModule = (await import(mapping.importPath)) as Record<string, unknown>;
    const listRows = repoModule[mapping.snapshotFnName];
    if (typeof listRows !== 'function') {
      throw new Error(
        `Backup snapshot helper "${mapping.snapshotFnName}" missing for collection "${logicalKey}"`,
      );
    }

    const rows = await (listRows as (subdomain: string) => Promise<unknown[]>)(subdomain);
    collections[logicalKey] = stripCredentials(Array.isArray(rows) ? rows : []);
  }

  return collections;
}
