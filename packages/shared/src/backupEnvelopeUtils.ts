import { parseTenantScopedStorageKey } from './tenantStorage.js';
import { slugifySubdomain } from './tenantUtils.js';
import {
  BACKUP_FORMAT_ID,
  BACKUP_FORMAT_VERSION,
  type TenantDatabaseSnapshot,
  type WorkspaceBackupDataSource,
  type WorkspaceBackupEnvelope,
  type WorkspaceBackupStats,
  workspaceBackupEnvelopeSchema,
} from './backupSchemas.js';

/** Formats byte size for backup history display. */
export function formatBackupSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Default download filename — includes tenant slug; `.mmsbak` when encrypted. */
export function buildBackupFileName(
  date: Date,
  options?: { tenantSlug?: string | null; suffix?: string; encrypted?: boolean },
): string {
  const slug = slugifySubdomain(options?.tenantSlug?.trim() || 'workspace') || 'workspace';
  const day = date.toISOString().slice(0, 10);
  const suffix = options?.suffix ? `_${slugifySubdomain(options.suffix)}` : '';
  const ext = options?.encrypted ? '.mmsbak' : '.json';
  return `mms_backup_${slug}_${day}${suffix}${ext}`;
}

/** Extracts logical storage key from an exported localStorage key. */
export function extractLogicalStorageKey(key: string): string | null {
  if (!key.startsWith('mms_')) return null;
  const stripped = key.slice(4);
  const tenantParsed = parseTenantScopedStorageKey(stripped);
  if (tenantParsed) return tenantParsed.logicalKey;
  return stripped;
}

/** Remaps exported keys to the active workspace localStorage prefix. */
export function remapBackupKeysToPrefix(
  raw: Record<string, string>,
  targetPrefix: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const logical = extractLogicalStorageKey(key);
    if (!logical) continue;
    result[`${targetPrefix}${logical}`] = value;
  }
  return result;
}

/** Counts collections vs singleton objects in a raw key map. */
export function computeBackupStats(keys: Record<string, string>): WorkspaceBackupStats {
  let collectionCount = 0;
  let objectCount = 0;
  let byteSize = 0;

  for (const [key, value] of Object.entries(keys)) {
    byteSize += key.length + value.length;
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        collectionCount += 1;
      } else {
        objectCount += 1;
      }
    } catch {
      objectCount += 1;
    }
  }

  return {
    keyCount: Object.keys(keys).length,
    collectionCount,
    objectCount,
    byteSize,
  };
}

export function extractBackupRawKeys(parsed: unknown): Record<string, string> | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  if (record.format === BACKUP_FORMAT_ID) {
    const validated = workspaceBackupEnvelopeSchema.safeParse(parsed);
    if (!validated.success) return null;
    return validated.data.keys;
  }

  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value !== 'string') return null;
    raw[key] = value;
  }
  return Object.keys(raw).length > 0 ? raw : null;
}

/** Converts a server tenant snapshot into scoped localStorage key entries. */
export function buildStorageKeysFromSnapshot(
  snapshot: TenantDatabaseSnapshot,
  prefix: string,
): Record<string, string> {
  const keys: Record<string, string> = {};

  if (snapshot.collections) {
    for (const [name, list] of Object.entries(snapshot.collections)) {
      if (!Array.isArray(list)) continue;
      keys[`${prefix}${name}`] = JSON.stringify(list);
    }
  }

  if (snapshot.objects) {
    for (const [key, obj] of Object.entries(snapshot.objects)) {
      keys[`${prefix}${key}`] = JSON.stringify(obj);
    }
  }

  return keys;
}

/** Builds a versioned backup envelope JSON string. */
export function buildWorkspaceBackupEnvelope(
  keys: Record<string, string>,
  options?: { subdomain?: string | null; dataSource?: WorkspaceBackupDataSource },
): string {
  const envelope: WorkspaceBackupEnvelope = {
    format: BACKUP_FORMAT_ID,
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    subdomain: options?.subdomain ?? null,
    dataSource: options?.dataSource,
    stats: computeBackupStats(keys),
    keys,
  };
  return JSON.stringify(envelope);
}

/**
 * Converts a flat map of prefixed localStorage keys into a TenantDatabaseSnapshot.
 */
export function parseStorageKeysToSnapshot(
  keys: Record<string, string>,
  prefix: string,
): TenantDatabaseSnapshot {
  const collections: Record<string, unknown[]> = Object.create(null);
  const objects: Record<string, unknown> = Object.create(null);

  for (const [key, value] of Object.entries(keys)) {
    if (!key.startsWith(prefix)) continue;
    const logicalKey = key.slice(prefix.length);
    try {
      const parsedVal = JSON.parse(value) as unknown;
      if (Array.isArray(parsedVal)) {
        collections[logicalKey] = parsedVal;
      } else {
        objects[logicalKey] = parsedVal;
      }
    } catch {
      objects[logicalKey] = value;
    }
  }

  return { collections, objects };
}
