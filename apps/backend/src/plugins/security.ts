import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { ServerConfig } from '../config/serverConfig.js';
import { getRedisClient } from '../lib/redis.js';

/**
 * Hardened but SPA-compatible security headers.
 *
 * CSP notes:
 *  - `script-src 'unsafe-inline'` is required by the inline FOUC theme-flash
 *    script in the built `index.html`. `script-src-attr 'none'` blocks inline event
 *    handlers / `javascript:` URLs, and `script-src 'self'` blocks external scripts.
 *  - `worker-src 'self' blob:` supports PDF.js / client-side export workers.
 *  - `media-src 'self' data: blob:` supports audio playback for messaging voice notes.
 *  - Google Fonts allowed via `style-src`/`font-src`.
 *  - `frame-ancestors 'none'` and `object-src 'none'` block framing and plugins.
 */
function buildCspDirectives(isProd?: boolean) {
  return {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'script-src-attr': ["'none'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'media-src': ["'self'", 'data:', 'blob:'],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'connect-src': ["'self'", 'ws:', 'wss:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    ...(isProd ? { 'upgrade-insecure-requests': [] } : {}),
  };
}

export async function registerSecurityPlugins(
  app: FastifyInstance,
  config?: ServerConfig,
): Promise<void> {
  const isProd = config?.isProd ?? process.env.NODE_ENV === 'production';

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: buildCspDirectives(isProd),
    },
    // Enforce 1-year HSTS with preloading in production; disable in local dev
    hsts: isProd
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
    // Prevents cross-origin window object tampering while allowing OAuth popups
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    // Restricts embedding to same-site (supports tenant subdomains on same root domain)
    crossOriginResourcePolicy: { policy: 'same-site' },
    // Strict referrer policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });

  const redisClient = getRedisClient();

  await app.register(rateLimit, {
    global: false,
    redis: redisClient ?? undefined,
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });
}
