import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { sep } from 'node:path';
import { ensureUploadsRoot } from '../config/uploadConfig.js';

export async function registerStaticAssets(app: FastifyInstance): Promise<void> {
  const root = await ensureUploadsRoot();
  await app.register(fastifyStatic, {
    root,
    prefix: '/uploads/',
    decorateReply: false,
    // Attachments are user-uploaded and may be arbitrary types. Force them to
    // download as octet-stream so a malicious .html/.svg cannot be rendered
    // inline in the app origin (stored XSS). Images are served normally.
    setHeaders(res, path) {
      if (path.includes(`${sep}attachments${sep}`)) {
        res.header('Content-Type', 'application/octet-stream');
        res.header('Content-Disposition', 'attachment');
      }
    },
  });
}
