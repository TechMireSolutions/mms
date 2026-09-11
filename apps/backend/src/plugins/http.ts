import { hash } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import compress from '@fastify/compress';
import { isOriginAllowedForAppDomain, isTrustedWorkspaceOrigin } from '@mms/shared';
import type { ServerConfig } from '../config/serverConfig.js';
import { getRedisClient, getRedisSubscriberClient } from '../lib/redis.js';
import { configureRedisPubSub } from '../lib/livePush.js';

export async function registerHttpPlugins(
  app: FastifyInstance,
  config: ServerConfig,
): Promise<void> {
  // RFC 7232 ETag & 304 Not Modified conditional caching for idempotent GET/HEAD reads
  app.addHook('onSend', async (request, reply, payload) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return payload;
    }
    if (reply.statusCode < 200 || reply.statusCode >= 300 || reply.statusCode === 204) {
      return payload;
    }
    if (payload == null || (typeof payload !== 'string' && !Buffer.isBuffer(payload))) {
      return payload;
    }
    if (reply.hasHeader('etag')) {
      return payload;
    }

    // Skip synchronous SHA-1 hash computation for payloads > 256KB to avoid event loop blocking
    const byteLength = typeof payload === 'string' ? Buffer.byteLength(payload) : payload.length;
    if (byteLength > 256 * 1024) {
      return payload;
    }

    const digest = hash('sha1', payload, 'hex').slice(0, 27);
    const etag = `W/"${digest}"`;
    reply.header('etag', etag);
    if (!reply.hasHeader('cache-control')) {
      reply.header('cache-control', 'private, no-cache');
    }

    const ifNoneMatch = request.headers['if-none-match'];
    if (ifNoneMatch) {
      if (ifNoneMatch === etag || ifNoneMatch === '*' || ifNoneMatch.includes(etag)) {
        reply.code(304);
        return '';
      }
    }

    return payload;
  });

  await app.register(compress, {
    global: true,
    threshold: 1024,
  });
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

  const redisPub = getRedisClient();
  const redisSub = getRedisSubscriberClient();
  if (redisPub) {
    configureRedisPubSub(redisPub, redisSub || undefined);
  }
}

