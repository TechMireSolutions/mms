import { z } from 'zod';
import type { AppTranslationKey } from './appTranslations.js';
import { parseTenantScopedStorageKey } from './tenantStorage.js';
import { slugifySubdomain } from './tenantUtils.js';

import { isServerOnlyObjectKey } from './emailIntegrationTypes.js';

export type WorkspaceBackupStatus = 'success';

/** Maps a logical settings object key to its corresponding moduleId/collection name. */
export const SETTINGS_KEY_TO_MODULE: Record<string, string> = {
  contact_field_config: 'contacts',
  students_settings: 'students',
  teachers_settings: 'teachers',
  users_settings: 'users',
  attendance_settings: 'attendance',
  sessions_settings: 'sessions',
  enrollments_settings: 'enrollments',
  finance_settings: 'finance',
  obligations_settings: 'obligations',
  accounting_settings: 'accounting',
  hasanat_settings: 'hasanat',
  examinations_settings: 'examinations',
  question_bank_settings: 'questionBank',
};

/** Maps a moduleId/collection name to its corresponding logical settings object key. */
export const MODULE_TO_SETTINGS_KEY: Record<string, string> = {};

// Populate dynamically from SETTINGS_KEY_TO_MODULE to enforce DRY
for (const [settingsKey, moduleName] of Object.entries(SETTINGS_KEY_TO_MODULE)) {
  MODULE_TO_SETTINGS_KEY[moduleName] = settingsKey;
}

// Add backward-compatibility singular/alias formats
MODULE_TO_SETTINGS_KEY['question-bank'] = 'question_bank_settings';
MODULE_TO_SETTINGS_KEY['enrollment'] = 'enrollments_settings';
MODULE_TO_SETTINGS_KEY['examination'] = 'examinations_settings';

/** Identifies MMS workspace backup envelope files. */
export const BACKUP_FORMAT_ID = 'mms-workspace-backup' as const;

/** Current envelope schema version. */
export const BACKUP_FORMAT_VERSION = 1;

/** Max upload size for restore file picker (bytes). */
export const BACKUP_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

/** Local backup history entry (device export log). */
export interface WorkspaceBackupRecord {
  id: string;
  name: string;
  date: string;
  size: string;
  status: WorkspaceBackupStatus;
  /** Serialized export JSON — omitted when entry exceeds size cap. */
  data?: string;
  keyCount?: number;
  collectionCount?: number;
  objectCount?: number;
  /** Download filename used for this export. */
  fileName?: string;
  encrypted?: boolean;
  adminEmail?: string;
}

export const DEFAULT_BACKUP_HISTORY: WorkspaceBackupRecord[] = [];

/** Max history entries kept on device. */
export const BACKUP_HISTORY_MAX = 10;

/** Max JSON payload stored per history row (bytes). */
export const BACKUP_HISTORY_MAX_BYTES = 512_000;

/** Authoritative tenant data shape from `GET /api/db/sync`. */
export interface TenantDatabaseSnapshot {
  collections?: Record<string, unknown[]>;
  objects?: Record<string, unknown>;
}

export const tenantDatabaseSnapshotSchema = z.object({
  collections: z.record(z.string(), z.array(z.unknown())).optional(),
  objects: z.record(z.string(), z.unknown()).optional(),
});

export type WorkspaceBackupDataSource = 'server' | 'local';

/** Versioned export envelope written by tenant backup export. */
export interface WorkspaceBackupEnvelope {
  format: typeof BACKUP_FORMAT_ID;
  version: number;
  exportedAt: string;
  subdomain: string | null;
  /** `server` = PostgreSQL snapshot; `local` = browser cache only. */
  dataSource?: WorkspaceBackupDataSource;
  stats: WorkspaceBackupStats;
  keys: Record<string, string>;
}

export interface WorkspaceBackupStats {
  keyCount: number;
  collectionCount: number;
  objectCount: number;
  byteSize: number;
}

export const workspaceBackupStatsSchema = z.object({
  keyCount: z.number(),
  collectionCount: z.number(),
  objectCount: z.number(),
  byteSize: z.number(),
});

export const workspaceBackupEnvelopeSchema = z.object({
  format: z.literal(BACKUP_FORMAT_ID),
  version: z.number(),
  exportedAt: z.string(),
  subdomain: z.string().nullable(),
  dataSource: z.enum(['server', 'local']).optional(),
  stats: workspaceBackupStatsSchema,
  keys: z.record(z.string(), z.string()),
});

export interface WorkspaceBackupSummary extends WorkspaceBackupStats {
  exportedAt: string | null;
  subdomain: string | null;
  legacyFormat: boolean;
  dataSource: WorkspaceBackupDataSource | null;
}

export type WorkspaceBackupSummaryResult =
  | { ok: true; summary: WorkspaceBackupSummary }
  | { ok: false; errorKey: AppTranslationKey };

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

/** Detects prototype pollution keys recursively in any parsed value. */
export function hasPrototypePollution(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (hasPrototypePollution(item)) return true;
    }
    return false;
  }
  const recordValue = value as Record<string, unknown>;
  for (const key of Object.keys(recordValue)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    if (hasPrototypePollution(recordValue[key])) {
      return true;
    }
  }
  return false;
}

/** Checks if a logical key represents a restricted platform-level resource. */
export function isRestrictedKey(logicalKey: string): boolean {
  const lower = logicalKey.toLowerCase();
  return (
    lower === 'workspaces' ||
    lower === 'platform_super_users' ||
    lower === 'platform_users' ||
    lower === 'auth_artifacts' ||
    lower === '__proto__' ||
    lower === 'constructor' ||
    lower === 'prototype' ||
    lower.startsWith('platform_') ||
    isServerOnlyObjectKey(logicalKey)
  );
}

/** Validate if a database snapshot contains any restricted platform-level key. Returns first restricted key found, or null. */
export function findRestrictedKeyInSnapshot(snapshot: TenantDatabaseSnapshot): string | null {
  if (snapshot.collections) {
    for (const key of Object.keys(snapshot.collections)) {
      if (isRestrictedKey(key)) return key;
    }
  }
  if (snapshot.objects) {
    for (const key of Object.keys(snapshot.objects)) {
      if (isRestrictedKey(key)) return key;
    }
  }
  return null;
}

/** Result of a parsed and validated backup payload. */
export interface ValidatedBackupPayload {
  parsed: unknown;
  raw: Record<string, string>;
  remapped: Record<string, string>;
}

export type ParseAndValidateResult =
  | { ok: true; data: ValidatedBackupPayload }
  | { ok: false; errorKey: AppTranslationKey };

/**
 * Validates, deduplicates, and sanitizes a tenant database snapshot.
 * Enforces prototype pollution prevention, restricted key detection, and admin user verification.
 */
export function validateAndNormalizeSnapshot(
  snapshot: TenantDatabaseSnapshot,
): { ok: true; data: TenantDatabaseSnapshot } | { ok: false; errorKey: AppTranslationKey } {
  if (hasPrototypePollution(snapshot)) {
    return { ok: false, errorKey: 'backup.securityViolation' };
  }

  const restrictedKey = findRestrictedKeyInSnapshot(snapshot);
  if (restrictedKey) {
    return { ok: false, errorKey: 'backup.securityViolation' };
  }

  const collections = snapshot.collections ? { ...snapshot.collections } : {};
  const objects = snapshot.objects ? { ...snapshot.objects } : {};

  for (const [colName, rows] of Object.entries(collections)) {
    if (Array.isArray(rows)) {
      const seen = new Set<string>();
      const deduped: unknown[] = [];
      for (const item of rows) {
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          if ('id' in record && record.id !== undefined && record.id !== null) {
            const idStr = String(record.id);
            if (seen.has(idStr)) {
              continue;
            }
            seen.add(idStr);
          }
        }
        deduped.push(item);
      }
      collections[colName] = deduped;
    }
  }

  if (collections.users) {
    const hasAdmin = collections.users.some(
      (u: unknown) => u && typeof u === 'object' && 'role' in u && u.role === 'admin',
    );
    if (!hasAdmin) {
      return { ok: false, errorKey: 'backup.missingAdminUser' };
    }
  }

  return { ok: true, data: { collections, objects } };
}

/**
 * Common internal logic for validating and parsing a workspace backup payload.
 * Enforces prototype pollution prevention, restricted key detection, and admin user verification.
 */
export function parseAndValidateBackupPayload(
  jsonString: string,
  targetPrefix: string,
): ParseAndValidateResult {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    if (hasPrototypePollution(parsed)) {
      return { ok: false, errorKey: 'backup.securityViolation' };
    }

    const raw = extractBackupRawKeys(parsed);
    if (!raw) {
      return { ok: false, errorKey: 'backup.invalidFormat' };
    }

    if (Object.keys(raw).length === 0) {
      return { ok: false, errorKey: 'backup.emptyBackup' };
    }

    const remapped = remapBackupKeysToPrefix(raw, targetPrefix);
    if (Object.keys(remapped).length === 0) {
      return { ok: false, errorKey: 'backup.invalidFormat' };
    }

    const snapshot = parseStorageKeysToSnapshot(remapped, targetPrefix);
    const validated = validateAndNormalizeSnapshot(snapshot);
    if (!validated.ok) {
      return { ok: false, errorKey: validated.errorKey };
    }

    const finalRemapped = buildStorageKeysFromSnapshot(validated.data, targetPrefix);

    return {
      ok: true,
      data: {
        parsed,
        raw,
        remapped: finalRemapped,
      },
    };
  } catch {
    return { ok: false, errorKey: 'backup.invalidFormat' };
  }
}

/** Summarizes a backup file for pre-restore preview (no writes). */
export function summarizeWorkspaceBackup(
  jsonString: string,
  targetPrefix: string,
): WorkspaceBackupSummaryResult {
  const result = parseAndValidateBackupPayload(jsonString, targetPrefix);
  if (!result.ok) {
    return result;
  }

  const { parsed, remapped } = result.data;
  const stats = computeBackupStats(remapped);
  const legacyFormat =
    typeof parsed === 'object' &&
    parsed !== null &&
    !Array.isArray(parsed) &&
    (parsed as Record<string, unknown>).format !== BACKUP_FORMAT_ID;

  let exportedAt: string | null = null;
  let subdomain: string | null = null;
  let dataSource: WorkspaceBackupDataSource | null = null;
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    !Array.isArray(parsed) &&
    (parsed as Record<string, unknown>).format === BACKUP_FORMAT_ID
  ) {
    const env = parsed as WorkspaceBackupEnvelope;
    exportedAt = typeof env.exportedAt === 'string' ? env.exportedAt : null;
    subdomain = typeof env.subdomain === 'string' ? env.subdomain : null;
    dataSource =
      env.dataSource === 'server' || env.dataSource === 'local' ? env.dataSource : null;
  }

  return {
    ok: true,
    summary: {
      ...stats,
      exportedAt,
      subdomain,
      legacyFormat,
      dataSource,
    },
  };
}

export type BackupValidationResult =
  | { ok: true; data: Record<string, string> }
  | { ok: false; errorKey: AppTranslationKey };

/**
 * Validates exported workspace JSON before restore.
 * Accepts versioned envelope, tenant-scoped, or apex `mms_` keys.
 */
export function validateWorkspaceBackupJson(
  jsonString: string,
  targetPrefix: string,
): BackupValidationResult {
  const result = parseAndValidateBackupPayload(jsonString, targetPrefix);
  if (!result.ok) {
    return result;
  }
  return { ok: true, data: result.data.remapped };
}

/** Prepends a new backup entry and enforces history limits. */
export function appendBackupHistory(
  history: WorkspaceBackupRecord[],
  entry: WorkspaceBackupRecord,
  max = BACKUP_HISTORY_MAX,
): WorkspaceBackupRecord[] {
  return [entry, ...history].slice(0, max);
}

export interface BackupCryptoCredentials {
  adminEmail: string;
  password: string;
}

export type BackupCredentials = BackupCryptoCredentials;

export interface PendingRestore {
  jsonText: string;
  summary: WorkspaceBackupSummary;
  fileName?: string;
  credentials: BackupCryptoCredentials;
}

export type PendingDecrypt =
  | { kind: 'file'; encryptedText: string; fileName: string; adminEmail: string }
  | { kind: 'history'; backup: WorkspaceBackupRecord }
  | { kind: 'plaintext'; jsonText: string; fileName: string };

/**
 * Checks if an error message string matches a localized backup translation key format.
 */
export function isBackupErrorKey(message: string): message is AppTranslationKey {
  return message.startsWith('backup.');
}

/**
 * Creates a standard WorkspaceBackupRecord history log entry.
 */
export function createBackupHistoryEntry(
  dataStr: string,
  now: Date,
  name: string,
  stats: WorkspaceBackupStats,
  meta: { fileName: string; encrypted: boolean; adminEmail: string; maxInlineBytes: number },
): WorkspaceBackupRecord {
  return {
    id: `b${Date.now()}`,
    name,
    date: now.toISOString(),
    size: formatBackupSize(dataStr.length),
    status: 'success',
    data: dataStr.length <= meta.maxInlineBytes ? dataStr : undefined,
    keyCount: stats.keyCount,
    collectionCount: stats.collectionCount,
    objectCount: stats.objectCount,
    fileName: meta.fileName,
    encrypted: meta.encrypted,
    adminEmail: meta.adminEmail,
  };
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


