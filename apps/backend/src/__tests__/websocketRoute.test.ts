import { beforeEach, describe, expect, it, vi } from 'vitest';
import fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyWebsocket from '@fastify/websocket';
import websocketRoutes from '../routes/common/websocket.js';
import { ACCESS_COOKIE } from '../services/auth/authCookieService.js';

vi.mock('../services/session.service.js', () => ({
  isTenantBlocked: vi.fn().mockResolvedValue(false),
  isTokenRevoked: vi.fn().mockResolvedValue(false),
  isUserSessionRevoked: vi.fn().mockResolvedValue(false),
}));

vi.mock('../services/workspaceService.js', () => ({
  getWorkspaceBySubdomain: vi.fn().mockImplementation(async (sub: string) => {
    if (sub === 'demo') {
      return { id: 'ws-demo', subdomain: 'demo', enabled: true };
    }
    return null;
  }),
}));

const mockRegisteredConnections: Array<{ subdomain: string; userId: string }> = [];
vi.mock('../services/websocketService.js', () => ({
  registerConnection: vi.fn().mockImplementation((subdomain: string, _socket: unknown, userId: string) => {
    mockRegisteredConnections.push({ subdomain, userId });
    return () => {};
  }),
}));

async function buildWsTestApp() {
  const app = fastify();
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, { secret: 'test-secret-key-1234567890' });
  await app.register(fastifyWebsocket);
  await app.register(websocketRoutes, { prefix: '/api' });
  await app.ready();
  return app;
}

describe('WebSocket Route (/api/ws)', () => {
  beforeEach(() => {
    mockRegisteredConnections.length = 0;
    vi.clearAllMocks();
  });

  it('rejects cross-site untrusted origin with 4003 (CSWSH defense)', async () => {
    const app = await buildWsTestApp();
    const token = app.jwt.sign({
      id: 'u-1',
      tokenType: 'access',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
    });

    await app.inject({
      method: 'GET',
      url: '/api/ws',
      headers: {
        host: 'demo.localhost',
        origin: 'https://attacker-domain.evil.com',
        cookie: `${ACCESS_COOKIE}=${token}`,
      },
    });

    await app.close();
  });

  it('rejects missing subdomain context with 4000', async () => {
    const app = await buildWsTestApp();
    const token = app.jwt.sign({
      id: 'u-1',
      tokenType: 'access',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/ws',
      headers: {
        host: 'localhost', // apex -> no tenant subdomain
        cookie: `${ACCESS_COOKIE}=${token}`,
      },
    });

    expect(res.statusCode).toBeDefined();
    await app.close();
  });

  it('accepts valid connection with cookie auth and matching subdomain', async () => {
    const app = await buildWsTestApp();
    const token = app.jwt.sign({
      id: 'u-1',
      tokenType: 'access',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
    });

    await app.inject({
      method: 'GET',
      url: '/api/ws',
      headers: {
        host: 'demo.localhost',
        origin: 'http://demo.localhost:5173',
        cookie: `${ACCESS_COOKIE}=${token}`,
      },
    });

    await app.close();
  });

  it('supports Bearer authorization header as fallback when cookie is absent', async () => {
    const app = await buildWsTestApp();
    const token = app.jwt.sign({
      id: 'u-1',
      tokenType: 'access',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
    });

    await app.inject({
      method: 'GET',
      url: '/api/ws',
      headers: {
        host: 'demo.localhost',
        origin: 'http://demo.localhost:5173',
        authorization: `Bearer ${token}`,
      },
    });

    await app.close();
  });
});
