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

  it('throws ApiError with stable type on failed JSON response', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ type: 'forbidden', message: 'Denied' }), { status: 403 });
    const { apiJson, ApiError, isApiError } = await import('../lib/apiClient');
    try {
      await apiJson('/api/students');
      expect.unreachable('should throw');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(403);
        expect(error.type).toBe('forbidden');
        expect(error.message).toBe('Denied');
      }
    }
    globalThis.fetch = original;
  });
});
