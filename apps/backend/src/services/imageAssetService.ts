import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  IMAGE_UPLOAD_MAX_BYTES,
  assertAllowedImageMime,
  categoryForUploadPurpose,
  ensureUploadCategoryDir,
  imageExtensionForMime,
  type ImageUploadPurpose,
} from '../config/uploadConfig.js';

/**
 * Persists a client-encoded AVIF/WebP image and returns its public URL path.
 */
export async function saveUploadedImage(
  buffer: Buffer,
  mimeType: string,
  purpose: ImageUploadPurpose,
): Promise<string> {
  assertAllowedImageMime(mimeType);

  if (buffer.length === 0) {
    throw Object.assign(new Error('Image file is empty'), {
      statusCode: 400,
      type: 'validation_error',
    });
  }

  if (buffer.length > IMAGE_UPLOAD_MAX_BYTES) {
    throw Object.assign(new Error('Image file is too large'), {
      statusCode: 400,
      type: 'validation_error',
    });
  }

  const category = categoryForUploadPurpose(purpose);
  const dir = await ensureUploadCategoryDir(category);
  const ext = imageExtensionForMime(mimeType);
  const filename = `${randomUUID()}${ext}`;
  await writeFile(join(dir, filename), buffer);

  return `/uploads/${category}/${filename}`;
}
