import type { AppTranslationKey } from './appTranslations.js';
import {
  BACKUP_FORMAT_ID,
  type WorkspaceBackupDataSource,
  type WorkspaceBackupEnvelope,
  type WorkspaceBackupSummary,
  type WorkspaceBackupSummaryResult,
} from './backupSchemas.js';
import {
  buildStorageKeysFromSnapshot,
  computeBackupStats,
  extractBackupRawKeys,
  parseStorageKeysToSnapshot,
  remapBackupKeysToPrefix,
} from './backupEnvelopeUtils.js';
import {
  hasPrototypePollution,
  validateAndNormalizeSnapshot,
} from './backupSecurityUtils.js';

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
  expectedSubdomain?: string | null,
): BackupValidationResult {
  const result = parseAndValidateBackupPayload(jsonString, targetPrefix);
  if (!result.ok) {
    return result;
  }
  if (expectedSubdomain) {
    const parsed = result.data.parsed;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed) ||
      (parsed as Record<string, unknown>).format !== BACKUP_FORMAT_ID
    ) {
      return { ok: false, errorKey: 'backup.workspaceUnidentified' };
    }
    const sourceSubdomain = (parsed as WorkspaceBackupEnvelope).subdomain;
    if (!sourceSubdomain) {
      return { ok: false, errorKey: 'backup.workspaceUnidentified' };
    }
    if (sourceSubdomain.toLowerCase() !== expectedSubdomain.toLowerCase()) {
      return { ok: false, errorKey: 'backup.workspaceMismatch' };
    }
  }
  return { ok: true, data: result.data.remapped };
}
