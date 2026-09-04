import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, normalize, relative, dirname } from 'node:path';
import { resolveUploadsRoot } from '../config/uploadConfig.js';
import type { TenantDatabaseSnapshot } from '@mms/shared';
import { logger } from '../lib/logger.js';

const UPLOADS_PATH_REGEX = /^\/uploads\/([a-zA-Z0-9_\-/.]+)$/;

/**
 * Recursively scans all collections and objects in a snapshot for `/uploads/...` URLs.
 */
export function collectReferencedAssetUrls(snapshot: TenantDatabaseSnapshot): Set<string> {
  const urls = new Set<string>();

  function scan(val: unknown): void {
    if (!val) return;
    if (typeof val === 'string') {
      if (val.length >= 10 && val.includes('/uploads/')) {
        const trimmed = val.trim();
        if (UPLOADS_PATH_REGEX.test(trimmed)) {
          urls.add(trimmed);
        }
      }
      return;
    }
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        scan(val[i]);
      }
      return;
    }
    if (typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          scan(obj[key]);
        }
      }
    }
  }

  if (snapshot.collections) {
    const cols = snapshot.collections;
    for (const key in cols) {
      if (Object.prototype.hasOwnProperty.call(cols, key)) {
        scan(cols[key]);
      }
    }
  }

  if (snapshot.objects) {
    const objs = snapshot.objects;
    for (const key in objs) {
      if (Object.prototype.hasOwnProperty.call(objs, key)) {
        scan(objs[key]);
      }
    }
  }

  return urls;
}

/**
 * Safely resolves a disk path for an `/uploads/...` URL, verifying no directory traversal.
 */
export function resolveSafeUploadDiskPath(urlPath: string): string | null {
  const match = UPLOADS_PATH_REGEX.exec(urlPath.trim());
  if (!match || !match[1]) return null;

  const relativePath = match[1];
  const root = resolveUploadsRoot();
  const target = normalize(join(root, relativePath));

  const rel = relative(root, target);
  if (rel.startsWith('..') || rel.startsWith('/') || rel.includes('..')) {
    return null; // Path traversal attempt
  }

  return target;
}

const MAX_BACKUP_ASSET_FILE_BYTES = 25 * 1024 * 1024; // 25MB per asset

/**
 * Exports referenced upload assets (logos, avatars, attachments, pictures) as base64 strings.
 */
export async function exportBackupAssetsForSnapshot(
  snapshot: TenantDatabaseSnapshot,
): Promise<Record<string, string>> {
  const urls = collectReferencedAssetUrls(snapshot);
  const assets: Record<string, string> = {};

  for (const url of urls) {
    const diskPath = resolveSafeUploadDiskPath(url);
    if (!diskPath) continue;

    try {
      const fileStat = await stat(diskPath);
      if (!fileStat.isFile()) continue;
      if (fileStat.size > MAX_BACKUP_ASSET_FILE_BYTES) {
        logger.warn({ url, size: fileStat.size }, 'Skipping asset exceeding 25MB limit');
        continue;
      }

      const buffer = await readFile(diskPath);
      assets[url] = buffer.toString('base64');
    } catch {
      // Missing file on disk — skip gracefully so backup export doesn't fail
    }
  }

  return assets;
}

/**
 * Restores binary image and attachment files from a backup payload to the uploads directory.
 */
export async function restoreTenantAssets(assets: Record<string, string>): Promise<void> {
  if (!assets || typeof assets !== 'object') return;

  for (const [urlPath, base64Data] of Object.entries(assets)) {
    if (typeof urlPath !== 'string' || typeof base64Data !== 'string') continue;

    const diskPath = resolveSafeUploadDiskPath(urlPath);
    if (!diskPath) continue;

    try {
      const commaIdx = base64Data.indexOf(',');
      const cleanBase64 = commaIdx >= 0 ? base64Data.slice(commaIdx + 1) : base64Data;
      if (!cleanBase64) continue;

      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length === 0) continue;

      await mkdir(dirname(diskPath), { recursive: true });
      await writeFile(diskPath, buffer);
    } catch (err) {
      logger.error({ urlPath, err: err instanceof Error ? err.message : 'error' }, 'Failed to restore asset');
    }
  }
}
