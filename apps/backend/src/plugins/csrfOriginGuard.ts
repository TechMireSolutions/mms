import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { isOriginAllowedForAppDomain, isTrustedWorkspaceOrigin } from '@mms/shared';
import type { ServerConfig } from '../config/serverConfig.js';
import { requestHostname } from '../lib/requestHost.js';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isOriginAllowed(origin: string, requestHost: string, config: ServerConfig): boolean {
  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.hostname.toLowerCase();

    // 1. Direct match with current request host
    if (originHost === requestHost) {
      return true;
    }

    // 2. Explicit config.allowedOrigin
    if (config.allowedOrigin && origin === config.allowedOrigin) {
      return true;
    }

    const appDomain = process.env.MMS_APP_DOMAIN?.trim();
    if (appDomain) {
      if (isOriginAllowedForAppDomain(origin, appDomain)) {
        return true;
      }
    }

    // 3. Local dev origins
    if (!config.isProd && isTrustedWorkspaceOrigin(origin)) {
      return true;
    }

    // 4. Localhost fallback in non-prod
    if (!config.isProd && (originHost === 'localhost' || originHost === '127.0.0.1')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Enforces same-origin / allowed-origin and Sec-Fetch-Site guards on all cookie-auth state-changing mutations.
 * Also enforces application/json content-type on JSON API write paths.
 */
export function registerCsrfOriginGuard(
  app: FastifyInstance,
  config: ServerConfig,
): void {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!MUTATION_METHODS.has(request.method.toUpperCase())) {
      return;
    }

    // 1. Sec-Fetch-Site browser header defense
    const secFetchSite = request.headers['sec-fetch-site'];
    if (typeof secFetchSite === 'string') {
      const normalizedSite = secFetchSite.trim().toLowerCase();
      if (normalizedSite === 'cross-site') {
        reply.status(403).send({
          type: 'forbidden',
          message: 'Cross-site mutation blocked',
        });
        return reply;
      }
    }

    // 2. Origin / Referer validation
    const origin = typeof request.headers.origin === 'string' ? request.headers.origin.trim() : undefined;
    const requestHost = requestHostname(request);

    if (origin) {
      if (!isOriginAllowed(origin, requestHost, config)) {
        reply.status(403).send({
          type: 'forbidden',
          message: 'Untrusted origin blocked',
        });
        return reply;
      }
    } else {
      const referer = typeof request.headers.referer === 'string' ? request.headers.referer.trim() : undefined;
      if (referer) {
        try {
          const refererOrigin = new URL(referer).origin;
          if (!isOriginAllowed(refererOrigin, requestHost, config)) {
            reply.status(403).send({
              type: 'forbidden',
              message: 'Untrusted referer blocked',
            });
            return reply;
          }
        } catch {
          reply.status(403).send({
            type: 'forbidden',
            message: 'Malformed referer blocked',
          });
          return reply;
        }
      }
    }

    // 3. JSON Content-Type check on API mutations
    const pathname = request.url.split('?')[0] ?? '';
    const contentType = typeof request.headers['content-type'] === 'string' ? request.headers['content-type'].toLowerCase() : '';
    const isUploadPath = pathname.startsWith('/uploads') || pathname.includes('/upload') || pathname.includes('/import');

    if (
      pathname.startsWith('/api') &&
      !isUploadPath &&
      ['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase()) &&
      contentType
    ) {
      const isJson = contentType.includes('application/json') || contentType.includes('application/problem+json');
      const isMultipart = contentType.includes('multipart/form-data');

      if (!isJson && !isMultipart) {
        reply.status(415).send({
          type: 'unsupported_media_type',
          message: 'Content-Type must be application/json',
        });
        return reply;
      }
    }
  });
}
