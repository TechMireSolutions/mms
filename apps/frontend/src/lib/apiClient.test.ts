import { describe, expect, it } from 'vitest';

describe('apiClient', () => {
  it('uses credentials include on fetch wrapper', async () => {
    const original = globalThis.fetch;
    let seenInit: RequestInit | undefined;
    globalThis.fetch = async (_input, init) => {
      seenInit = init;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };
    const { apiFetch } = await import('../lib/apiClient');
    await apiFetch('/api/health');
    expect(seenInit?.credentials).toBe('include');
    globalThis.fetch = original;
  });
});
