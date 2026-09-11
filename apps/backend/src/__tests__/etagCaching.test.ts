import { describe, it, expect } from 'vitest';
import fastify from 'fastify';
import { registerHttpPlugins } from '../plugins/http.js';
import type { ServerConfig } from '../config/serverConfig.js';

describe('HTTP ETag & 304 Not Modified (RFC 7232)', () => {
  const dummyConfig = {
    port: 5002,
    host: '127.0.0.1',
    logLevel: 'silent',
    isProd: false,
    jwtSecret: 'test-secret-at-least-32-chars-long-1234567890',
    allowedOrigin: 'http://localhost:3000',
    trustProxy: false,
    bodyLimit: 1048576,
    requestTimeoutMs: 30000,
  } as ServerConfig;

  async function createTestApp() {
    const app = fastify({ logger: false });
    await registerHttpPlugins(app, dummyConfig);
    app.get('/api/test-data', async () => {
      return { message: 'hello world', items: [1, 2, 3] };
    });
    return app;
  }

  it('generates weak ETag and Cache-Control headers on 200 GET', async () => {
    const app = await createTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/test-data',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers.etag).toMatch(/^W\/"[a-f0-9]{27}"$/);
    expect(res.headers['cache-control']).toBe('private, no-cache');
    expect(res.json()).toEqual({ message: 'hello world', items: [1, 2, 3] });
  });

  it('returns 304 Not Modified with empty payload when If-None-Match matches ETag', async () => {
    const app = await createTestApp();
    const initial = await app.inject({
      method: 'GET',
      url: '/api/test-data',
    });

    const etag = initial.headers.etag;
    expect(etag).toBeDefined();

    const cached = await app.inject({
      method: 'GET',
      url: '/api/test-data',
      headers: {
        'if-none-match': etag as string,
      },
    });

    expect(cached.statusCode).toBe(304);
    expect(cached.headers.etag).toBe(etag);
    expect(cached.body).toBe('');
  });

  it('returns 200 with fresh body when If-None-Match does not match', async () => {
    const app = await createTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/test-data',
      headers: {
        'if-none-match': 'W/"stale-etag-999999999999999999999"',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ message: 'hello world', items: [1, 2, 3] });
  });
});
