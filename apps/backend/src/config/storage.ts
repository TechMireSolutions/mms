import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { type Readable, type PassThrough } from 'node:stream';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { resolveUploadsRoot } from './uploadConfig.js';

export interface StorageUploadResult {
  key: string;
  storageType: 's3' | 'local';
  url: string;
}

const s3Bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || '';
const s3Region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

export const isS3Configured = Boolean(
  s3Bucket && (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE || process.env.AWS_ROLE_ARN)
);

export const s3Client = new S3Client({
  region: s3Region,
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export function resolveTenantExportKey(tenantId: string, filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `tenants/${tenantId}/exports/${Date.now()}-${sanitized}`;
}

export function resolveLocalArtifactPath(s3Key: string): string {
  return join(resolveUploadsRoot(), s3Key);
}

export async function uploadStreamToStorage(
  _tenantId: string,
  key: string,
  stream: Readable | PassThrough,
  contentType = 'application/octet-stream'
): Promise<StorageUploadResult> {
  if (isS3Configured) {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: s3Bucket,
        Key: key,
        Body: stream,
        ContentType: contentType,
      },
    });

    await upload.done();
    return {
      key,
      storageType: 's3',
      url: `/api/downloads/${key}`,
    };
  }

  // Local storage fallback
  const localPath = resolveLocalArtifactPath(key);
  await mkdir(dirname(localPath), { recursive: true });
  const writeStream = createWriteStream(localPath);
  await pipeline(stream, writeStream);

  return {
    key,
    storageType: 'local',
    url: `/uploads/${key}`,
  };
}

export async function uploadBufferToStorage(
  _tenantId: string,
  key: string,
  buffer: Buffer,
  contentType = 'application/octet-stream'
): Promise<StorageUploadResult> {
  if (isS3Configured) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return {
      key,
      storageType: 's3',
      url: `/api/downloads/${key}`,
    };
  }

  const localPath = resolveLocalArtifactPath(key);
  await mkdir(dirname(localPath), { recursive: true });
  await writeFile(localPath, buffer);

  return {
    key,
    storageType: 'local',
    url: `/uploads/${key}`,
  };
}
