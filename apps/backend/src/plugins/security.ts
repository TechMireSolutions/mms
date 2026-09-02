import { randomBytes } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { ServerConfig } from '../config/serverConfig.js';
import { getRedisClient } from '../lib/redis.js';

/**
 * Per-request CSP nonce store. The nonce is generated in `onRequest` and
 * consumed in `onSend` to (a) allow the inline theme-flash script in the SPA
 * `index.html` and (b) stamp that same nonce onto the inline `<script>` tag.
 * This lets us drop `'unsafe-inline'` from `script-src`.
 */
const nonceStore = new WeakMap<FastifyRequest, string>();

/**
 * Hardened but SPA-compatible security headers.
 *
 * CSP notes:
 *  - `script-src` uses a per-request nonce (no `'unsafe-inline'`). The inline
 *    FOUC theme-flash script in the built `index.html` is stamped with the same
 *    nonce at serve time. `script-src-attr 'none'` blocks inline event handlers
 *    / `javascript:` URLs, and `script-src 'self'` blocks external scripts.
 *  - `worker-src 'self' blob:` supports PDF.js / client-side export workers.
 *  - `media-src 'self' data: blob:` supports audio playback for messaging voice notes.
 *  - Google Fonts allowed via `style-src`/`font-src`.
 *  - `frame-ancestors 'none'` and `object-src 'none'` block framing and plugins.
 */
function buildCspDirectives(isProd?: boolean, nonce?: string) {
  return {
    'default-src': ["'self'"],
    'script-src': nonce ? ["'self'", `'nonce-${nonce}'`] : ["'self'"],
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

function serializeCsp(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => (values.length ? `${key} ${values.join(' ')}` : key))
    .join('; ');
}

/** Adds a `nonce` attribute to inline `<script>` tags (those without a `src`). */
function injectNonce(html: string, nonce: string): string {
  return html.replace(/<script(?![^>]*\bsrc=)([^>]*)>/gi, (match, attrs: string) => {
    if (/\snonce=/.test(attrs)) return match;
    return `<script${attrs} nonce="${nonce}">`;
  });
}

export async function registerSecurityPlugins(
  app: FastifyInstance,
  config?: ServerConfig,
): Promise<void> {
  const isProd = config?.isProd ?? process.env.NODE_ENV === 'production';

  await app.register(helmet, {
    // CSP is set per-request in `onSend` so we can embed a per-request nonce.
    contentSecurityPolicy: false,
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

  app.addHook('onRequest', async (request) => {
    nonceStore.set(request, randomBytes(16).toString('base64'));
  });

  app.addHook('onSend', async (request, reply, payload) => {
    const nonce = nonceStore.get(request) ?? randomBytes(16).toString('base64');
    reply.header('content-security-policy', serializeCsp(buildCspDirectives(isProd, nonce)));

    const contentType = String(reply.getHeader('content-type') ?? '');
    if (!contentType.includes('text/html')) {
      return payload;
    }

    if (typeof payload === 'string') {
      return injectNonce(payload, nonce);
    }
    if (Buffer.isBuffer(payload)) {
      return injectNonce(payload.toString('utf8'), nonce);
    }
    if (payload && typeof (payload as { on?: unknown }).on === 'function') {
      const chunks: Buffer[] = [];
      for await (const chunk of payload as AsyncIterable<Buffer | string>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return injectNonce(Buffer.concat(chunks).toString('utf8'), nonce);
    }
    return payload;
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
