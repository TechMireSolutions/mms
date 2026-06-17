import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { resolveUploadsRoot } from '../config/uploadConfig.js';

export async function registerStaticAssets(app: FastifyInstance): Promise<void> {
  await app.register(fastifyStatic, {
    root: resolveUploadsRoot(),
    prefix: '/uploads/',
    decorateReply: false,
  });
}
