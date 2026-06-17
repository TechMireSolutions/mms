import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveUploadedImage } from '../services/imageAssetService.js';

describe('saveUploadedImage', () => {
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'mms-upload-'));
    vi.stubEnv('MMS_UPLOADS_DIR', tempDir);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  it('persists AVIF logos under /uploads/branding', async () => {
    const buffer = Buffer.from('fake-avif-bytes');
    const url = await saveUploadedImage(buffer, 'image/avif', 'logo');

    expect(url).toMatch(/^\/uploads\/branding\/[0-9a-f-]+\.avif$/);

    const filename = url.split('/').pop()!;
    const saved = await readFile(join(tempDir, 'branding', filename));
    expect(saved.equals(buffer)).toBe(true);
  });

  it('persists AVIF avatars under /uploads/avatars', async () => {
    const buffer = Buffer.from('fake-avif-bytes');
    const url = await saveUploadedImage(buffer, 'image/avif', 'avatar');

    expect(url).toMatch(/^\/uploads\/avatars\/[0-9a-f-]+\.avif$/);
  });

  it('rejects non-AVIF/WebP uploads', async () => {
    await expect(saveUploadedImage(Buffer.from('x'), 'image/png', 'general')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
