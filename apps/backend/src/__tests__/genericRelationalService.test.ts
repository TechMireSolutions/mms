import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { runWithTenant } from '../lib/tenantContext.js';
import { createGenericRelationalService } from '../services/genericRelationalService.js';

vi.mock('../services/websocketService.js', () => ({
  broadcastTenantUpdate: vi.fn(),
}));

describe('createGenericRelationalService restoreById', () => {
  it('writes null soft-delete fields so JSONB merge clears old values', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const service = createGenericRelationalService({
      repo: {
        listByWorkspace: vi.fn().mockResolvedValue([]),
        findById: vi.fn().mockResolvedValue({
          id: 'record-1',
          name: 'Archived',
          deletedAt: '2026-07-27T12:00:00.000Z',
          deletedBy: 'user-1',
          deletionReason: 'Duplicate',
        }),
        save,
      },
      schema: z.object({
        id: z.string(),
        name: z.string(),
        deletedAt: z.string().nullable().optional(),
        deletedBy: z.string().nullable().optional(),
        deletionReason: z.string().nullable().optional(),
      }),
      websocketCollection: 'records',
      idPrefix: 'record',
    });

    const restored = await runWithTenant('demo', () => service.restoreById('record-1'));

    expect(restored).toBe(true);
    expect(save).toHaveBeenCalledWith('demo', expect.objectContaining({
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
    }));
  });
});
