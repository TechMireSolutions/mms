import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { isOriginAllowedForAppDomain } from '@mms/shared';
import type { ServerConfig } from '../config/serverConfig.js';

export async function registerHttpPlugins(
  app: FastifyInstance,
  config: ServerConfig,
): Promise<void> {
  await app.register(cookie);
  await app.register(cors, {
    origin: config.isProd
      ? (origin, cb) => {
          if (!origin) {
            cb(null, true);
            return;
          }
          if (
            isOriginAllowedForAppDomain(origin, config.appDomain)
            || origin === config.allowedOrigin
          ) {
            cb(null, true);
            return;
          }
          cb(null, false);
        }
      : true,
    credentials: true,
  });
  await app.register(jwt, { secret: config.jwtSecret });
}
