import { beforeAll, describe, expect, it, vi } from 'vitest';
import { initDb } from '../db/database.js';
import { buildApp } from '../app.js';
import { deleteCustomTab } from '../services/customTabsService.js';
import { runWithTenant } from '../lib/tenantContext.js';

vi.mock('../services/workspaceService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/workspaceService.js')>();
  const demoWorkspace = {
    id: 'ws-demo',
    subdomain: 'demo',
    madrasaName: 'Demo Madrasa',
    createdAt: '2026-01-01T00:00:00.000Z',
    enabled: true,
  };
  return {
    ...actual,
    getWorkspaceBySubdomain: vi.fn().mockImplementation(async (subdomain: string) =>
      subdomain === 'demo' ? demoWorkspace : null,
    ),
  };
});

import type { FastifyInstance } from 'fastify';

describe('custom tabs REST API routes', () => {
  let isDbAvailable = false;
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    try {
      await initDb();
      isDbAvailable = true;
      app = await buildApp();
    } catch (err) {
      console.warn('[CustomTabsRoute Test] Postgres database connection failed. Skipping route integration test.');
    }
  });

  it('runs CRUD via Fastify custom-tabs route endpoints', async () => {
    if (!isDbAvailable) return;

    // Use JWT sign to mock authentication
    const token = app.jwt.sign({
      id: 'test-user',
      email: 'admin@demo.com',
      role: 'admin',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
      tokenType: 'access',
    });

    const headers = {
      host: 'demo.localhost',
      cookie: `mms_access=${token}`,
    };

    // 1. POST /api/custom-tabs (Create tab)
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/custom-tabs',
      headers,
      payload: {
        moduleId: 'contacts',
        key: 'route_test_tab',
        label: 'Route Test Tab',
        enabled: true,
        sortOrder: 5,
        color: 'red',
      },
    });

    if (postRes.statusCode !== 200) {
      console.error('postRes failed:', postRes.statusCode, postRes.body);
    }
    expect(postRes.statusCode).toBe(200);
    const postBody = JSON.parse(postRes.body);
    expect(postBody.tab.key).toBe('route_test_tab');
    expect(postBody.tab.label).toBe('Route Test Tab');

    // 2. GET /api/custom-tabs?moduleId=contacts
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/custom-tabs?moduleId=contacts',
      headers,
    });
    expect(getRes.statusCode).toBe(200);
    const getBody = JSON.parse(getRes.body);
    const found = getBody.tabs.find((t: { key: string; color?: string }) => t.key === 'route_test_tab');
    expect(found).toBeDefined();
    expect(found.color).toBe('red');

    // 3. PUT /api/custom-tabs/:id (Update tab)
    const tabId = `demo:contacts:route_test_tab`;
    const putRes = await app.inject({
      method: 'PUT',
      url: `/api/custom-tabs/${tabId}`,
      headers,
      payload: {
        label: 'Updated Route Test Tab',
        color: 'green',
      },
    });
    expect(putRes.statusCode).toBe(200);
    const putBody = JSON.parse(putRes.body);
    expect(putBody.tab.label).toBe('Updated Route Test Tab');
    expect(putBody.tab.color).toBe('green');

    // 4. PUT /api/custom-tabs/bulk (Bulk replace tabs)
    const bulkRes = await app.inject({
      method: 'PUT',
      url: '/api/custom-tabs/bulk',
      headers,
      payload: {
        moduleId: 'contacts',
        tabs: [
          { key: 'bulk_1', label: 'Bulk Tab 1', enabled: true, sortOrder: 0 },
          { key: 'bulk_2', label: 'Bulk Tab 2', enabled: false, sortOrder: 1 },
        ],
      },
    });
    expect(bulkRes.statusCode).toBe(200);
    const bulkBody = JSON.parse(bulkRes.body);
    expect(bulkBody.tabs.length).toBe(2);
    expect(bulkBody.tabs[0].key).toBe('bulk_1');
    expect(bulkBody.tabs[1].key).toBe('bulk_2');
    expect(bulkBody.tabs[1].enabled).toBe(false);

    // Clean up
    await runWithTenant('demo', async () => {
      await deleteCustomTab(`demo:contacts:bulk_1`);
      await deleteCustomTab(`demo:contacts:bulk_2`);
    });
  });
});
