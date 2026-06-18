import type { FastifyInstance } from 'fastify';
import type { ServerConfig } from '../config/serverConfig.js';
import { registerErrorHandlers } from '../lib/errorHandler.js';
import { registerHttpPlugins } from './http.js';
import { registerProductionHostGuard } from './productionHostGuard.js';
import { registerRequestHooks } from './requestHooks.js';
import { registerSecurityPlugins } from './security.js';
import { registerStaticAssets } from './staticAssets.js';

export async function registerPlugins(
  app: FastifyInstance,
  config: ServerConfig,
): Promise<void> {
  registerErrorHandlers(app, config.isProd);
  await registerSecurityPlugins(app);
  await registerHttpPlugins(app, config);
  registerProductionHostGuard(app, config);
  await registerStaticAssets(app);
  registerRequestHooks(app);
}
