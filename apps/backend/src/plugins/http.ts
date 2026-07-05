import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { isOriginAllowedForAppDomain, isTrustedWorkspaceOrigin } from '@mms/shared';
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
          const appDomain = process.env.MMS_APP_DOMAIN?.trim();
          if (appDomain && isOriginAllowedForAppDomain(origin, appDomain)) {
            cb(null, true);
            return;
          }
          if (!appDomain && isTrustedWorkspaceOrigin(origin)) {
            cb(null, true);
            return;
          }
          if (origin === config.allowedOrigin) {
            cb(null, true);
            return;
          }
          cb(null, false);
        }
      : true,
    credentials: true,
  });
  await app.register(jwt, { secret: config.jwtSecret });
  await app.register(websocket);
}
