import multipart from '@fastify/multipart';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { parseImageUploadPurpose, resolveUploadsRoot } from '../../config/uploadConfig.js';
import { authenticateUploader } from '../../middleware/authenticateUploader.js';
import { saveUploadedImage } from '../../services/imageAssetService.js';

export default async function uploadRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  await fastify.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  });

  fastify.post<{ Querystring: { purpose?: string } }>(
    '/image',
    { preHandler: authenticateUploader },
    async (request, reply) => {
      try {
        const purpose = parseImageUploadPurpose(request.query.purpose);
        const file = await request.file();
        if (!file) {
          return reply.status(400).send({
            type: 'validation_error',
            message: 'Image file is required',
          });
        }

        const buffer = await file.toBuffer();
        const url = await saveUploadedImage(buffer, file.mimetype, purpose);
        return reply.send({ url, purpose });
      } catch (error: unknown) {
        const err = error as Error & { statusCode?: number; type?: string };
        const statusCode = err.statusCode ?? 500;
        return reply.status(statusCode).send({
          type: err.type ?? (statusCode === 400 ? 'validation_error' : 'server_error'),
          message: err.message || 'Failed to upload image',
        });
      }
    },
  );

  fastify.post(
    '/attachment',
    { preHandler: authenticateUploader },
    async (request, reply) => {
      try {
        const file = await request.file();
        if (!file) {
          return reply.status(400).send({
            type: 'validation_error',
            message: 'File is required',
          });
        }

        const buffer = await file.toBuffer();
        const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB
        if (buffer.length > MAX_ATTACHMENT_SIZE) {
          return reply.status(400).send({
            type: 'validation_error',
            message: 'File size exceeds limit of 10 MB',
          });
        }

        const root = resolveUploadsRoot();
        const dir = join(root, 'attachments');
        await mkdir(dir, { recursive: true });

        // Sanitize filename to prevent directory traversal
        const safeName = file.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${randomUUID()}-${safeName}`;
        const filepath = join(dir, filename);
        await writeFile(filepath, buffer);

        const url = `/uploads/attachments/${filename}`;
        return reply.send({
          url,
          name: file.filename,
          type: file.mimetype,
          size: buffer.length,
        });
      } catch (error: unknown) {
        const err = error as Error & { statusCode?: number; type?: string };
        const statusCode = err.statusCode ?? 500;
        return reply.status(statusCode).send({
          type: err.type ?? (statusCode === 400 ? 'validation_error' : 'server_error'),
          message: err.message || 'Failed to upload attachment',
        });
      }
    },
  );
}
