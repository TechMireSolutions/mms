import { z } from 'zod';
import type { AppTranslationKey } from './appTranslations.js';

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
