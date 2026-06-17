import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { ensureUploadsRoot } from '../config/uploadConfig.js';

export async function registerStaticAssets(app: FastifyInstance): Promise<void> {
  const root = await ensureUploadsRoot();
  await app.register(fastifyStatic, {
    root,
    prefix: '/uploads/',
    decorateReply: false,
  });
}
