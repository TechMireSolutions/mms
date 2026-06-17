import multipart from '@fastify/multipart';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { IMAGE_UPLOAD_MAX_BYTES, parseImageUploadPurpose } from '../config/uploadConfig.js';
import { authenticateUploader } from '../middleware/authenticateUploader.js';
import { saveUploadedImage } from '../services/imageAssetService.js';

export default async function uploadRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  await fastify.register(multipart, {
    limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES },
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
}
