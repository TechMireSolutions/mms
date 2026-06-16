import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import type { ServerConfig } from '../config/serverConfig.js';

export async function registerHttpPlugins(
  app: FastifyInstance,
  config: ServerConfig,
): Promise<void> {
  await app.register(cookie);
  await app.register(cors, {
    origin: config.isProd ? config.allowedOrigin : true,
    credentials: true,
  });
  await app.register(jwt, { secret: config.jwtSecret });
}
