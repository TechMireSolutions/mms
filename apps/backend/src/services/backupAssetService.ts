import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, normalize, relative, dirname } from 'node:path';
import { resolveUploadsRoot } from '../config/uploadConfig.js';
import type { TenantDatabaseSnapshot } from '@mms/shared';

const UPLOADS_PATH_REGEX = /^\/uploads\/([a-zA-Z0-9_\-/.]+)$/;

/**
 * Recursively scans all collections and objects in a snapshot for `/uploads/...` URLs.
 */
export function collectReferencedAssetUrls(snapshot: TenantDatabaseSnapshot): Set<string> {
  const urls = new Set<string>();

  function scan(val: unknown): void {
    if (!val) return;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (UPLOADS_PATH_REGEX.test(trimmed)) {
        urls.add(trimmed);
      }
      return;
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        scan(item);
      }
      return;
    }
    if (typeof val === 'object') {
      for (const propValue of Object.values(val as Record<string, unknown>)) {
        scan(propValue);
      }
    }
  }

  if (snapshot.collections) {
    for (const items of Object.values(snapshot.collections)) {
      scan(items);
    }
  }

  if (snapshot.objects) {
    for (const obj of Object.values(snapshot.objects)) {
      scan(obj);
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
      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      if (!cleanBase64) continue;

      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length === 0) continue;

      await mkdir(dirname(diskPath), { recursive: true });
      await writeFile(diskPath, buffer);
    } catch (err) {
      console.error(`[BackupRestore] Failed to restore asset "${urlPath}":`, err instanceof Error ? err.message : 'error');
    }
  }
}
