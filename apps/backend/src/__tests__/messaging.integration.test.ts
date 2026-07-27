import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';

vi.mock('../db/database.js', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  pingDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('../services/auth/authArtifactService.js', () => ({
  purgeExpiredAuthArtifacts: vi.fn().mockResolvedValue(undefined),
  putAuthArtifact: vi.fn(),
  takeAuthArtifact: vi.fn(),
}));

vi.mock('../services/workspaceService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/workspaceService.js')>();
  return {
    ...actual,
    getWorkspaceBySubdomain: vi.fn().mockImplementation(async (subdomain: string) =>
      subdomain === 'demo' ? { id: 'ws-demo', subdomain: 'demo', madrasaName: 'Demo Madrasa', enabled: true } : null,
    ),
  };
});

const mockLoadMessageTemplates = vi.fn();
const mockLoadFilteredMessageLogs = vi.fn();
const mockClearAllMessageLogs = vi.fn();
const mockComputeMessagingMetrics = vi.fn();
const mockSaveMessageTemplate = vi.fn();
const mockRecordMessageLogs = vi.fn();

vi.mock('../services/messagingService.js', () => ({
  loadMessageTemplates: (...args: unknown[]) => mockLoadMessageTemplates(...args),
  saveMessageTemplate: (...args: unknown[]) => mockSaveMessageTemplate(...args),
  removeMessageTemplate: vi.fn(),
  loadMessageLogs: vi.fn().mockResolvedValue([]),
  loadFilteredMessageLogs: (...args: unknown[]) => mockLoadFilteredMessageLogs(...args),
  recordMessageLogs: (...args: unknown[]) => mockRecordMessageLogs(...args),
  clearAllMessageLogs: (...args: unknown[]) => mockClearAllMessageLogs(...args),
  computeMessagingMetrics: (...args: unknown[]) => mockComputeMessagingMetrics(...args),
}));

function tokenFor(
  app: Awaited<ReturnType<typeof buildApp>>,
  role: string,
): string {
  return app.jwt.sign({
    id: `u-${role}`,
    email: `${role}@test.com`,
    name: role,
    role,
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

describe('messaging REST routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadMessageTemplates.mockReset().mockResolvedValue([]);
    mockLoadFilteredMessageLogs.mockReset().mockResolvedValue([]);
    mockClearAllMessageLogs.mockReset().mockResolvedValue(undefined);
    mockSaveMessageTemplate.mockReset().mockImplementation(async (_tenant: string, template: unknown) => template);
    mockRecordMessageLogs.mockReset().mockImplementation(async (_tenant: string, logs: unknown[]) => logs);
    mockComputeMessagingMetrics.mockReset().mockResolvedValue({
      total: 0,
      smsCount: 0,
      whatsappCount: 0,
      emailCount: 0,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      skippedCount: 0,
      queuedCount: 0,
      successRate: 100,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/messaging/templates requires auth', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/messaging/templates',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/messaging/templates allows teacher with messaging.read', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/messaging/templates',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${tokenFor(app, 'teacher')}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ templates: [] });
    await app.close();
  });

  it('POST /api/messaging/templates denies accountant without messaging.write', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/messaging/templates',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${tokenFor(app, 'accountant')}`,
      },
      payload: { label: 'Hi', body: 'Hello {name}' },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('DELETE /api/messaging/logs denies teacher without messaging.clearLogs', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/messaging/logs',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${tokenFor(app, 'teacher')}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(mockClearAllMessageLogs).not.toHaveBeenCalled();
    await app.close();
  });

  it('DELETE /api/messaging/logs allows admin with messaging.clearLogs', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/messaging/logs',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${tokenFor(app, 'admin')}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockClearAllMessageLogs).toHaveBeenCalledWith('demo');
    await app.close();
  });

  it('GET /api/messaging/logs rejects invalid query', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/messaging/logs?page=not-a-number',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${tokenFor(app, 'teacher')}`,
      },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('POST /api/messaging/templates creates with UUID id and tenant', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/messaging/templates',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${tokenFor(app, 'admin')}`,
      },
      payload: { label: 'Fee Reminder', body: 'Hello {name}', category: 'financial', channel: 'sms' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockSaveMessageTemplate).toHaveBeenCalledTimes(1);
    const [tenant, template] = mockSaveMessageTemplate.mock.calls[0] as [
      string,
      { id: string; label: string; body: string; category: string; channel: string },
    ];
    expect(tenant).toBe('demo');
    expect(template.id).toMatch(/^custom_[0-9a-f-]{36}$/i);
    expect(template.label).toBe('Fee Reminder');
    expect(template.category).toBe('financial');
    expect(res.json().template.id).toBe(template.id);
    await app.close();
  });

  it('POST /api/messaging/templates rejects invalid body', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/messaging/templates',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${tokenFor(app, 'admin')}`,
      },
      payload: { label: '', body: '' },
    });
    expect(res.statusCode).toBe(400);
    expect(mockSaveMessageTemplate).not.toHaveBeenCalled();
    await app.close();
  });

  it('POST /api/messaging/logs forces authenticated userId and strips deletedAt', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/messaging/logs',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${tokenFor(app, 'admin')}`,
      },
      payload: {
        logs: [
          {
            id: 'msg-1',
            userId: 'forged-user',
            contactId: 'c1',
            channel: 'sms',
            body: 'Assalamu Alaikum',
            sentAt: '2026-01-01T00:00:00.000Z',
            status: 'sent',
            deletedAt: '2026-01-02T00:00:00.000Z',
          },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ recorded: 1 });
    expect(mockRecordMessageLogs).toHaveBeenCalledTimes(1);
    const [tenant, logs] = mockRecordMessageLogs.mock.calls[0] as [
      string,
      Array<{ userId: string; deletedAt?: string; id: string }>,
    ];
    expect(tenant).toBe('demo');
    expect(logs[0].userId).toBe('u-admin');
    expect(logs[0].deletedAt).toBeUndefined();
    expect(logs[0].id).toBe('msg-1');
    await app.close();
  });
});
